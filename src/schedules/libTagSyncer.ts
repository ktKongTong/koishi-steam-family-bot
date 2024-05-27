import { $, Context } from 'koishi'
import { Config } from '../config'
import * as _ from 'lodash'
import { APIService } from '../service'

// todo
//
const libTagSyncer = (ctx: Context, config: Config) => async () => {
  const logger = ctx.logger('steam-family-bot.libTagsMonitor')
  logger.info('trigger lib tags monitor')
  const totalLibItem = await ctx.database.get(
    'SteamFamilyLib',
    // {}))
    (row) => {
      return $.and(
        $.or($.eq(row.tags, ''), $.eq(row.tags, null)),
        $.or(
          $.not(row.tagSynced),
          $.eq(row.tagSynced, undefined),
          $.eq(row.tagSynced, false),
          $.eq(row.tagSynced, null)
        )
      )
    }
  )
  const libItem = totalLibItem.slice(0, 500)
  logger.info(
    `trigger lib tags syncer, total ${totalLibItem.length}, syncing ${libItem.length}`
  )
  const api = APIService.createNonTokenAPI(ctx, config)
  const libsId = _.uniq(libItem.map((it) => it.appId))
  const libTags = _.chunk(libsId, 30).flatMap(async (chunk) => {
    try {
      const steamItems = await api.Steam.getSteamItems(
        chunk.map((it) => it.toString()),
        {
          ids: chunk
            .filter((it) => !Number.isNaN(it))
            .map((it) => ({ appid: it })),
          context: {
            language: 'schinese',
            countryCode: 'US',
            steamRealm: 1,
          },
          dataRequest: {
            includeTagCount: 20,
          },
        }
      )

      const tagsById = steamItems.data.storeItems.map((it) => ({
        id: it.appid,
        tags: it.tags
          .sort((a, b) => a.weight - b.weight)
          .map((it) => it.tagid.toString()),
        tagSynced: true,
      }))

      return tagsById
    } catch (e) {
      return chunk.map((it) => ({
        id: it,
        tags: [],
        tagSynced: false,
      }))
    }
  })

  const awaitedLibTags = (await Promise.all(libTags)).flatMap((it) => it)

  const libTagDict = _.keyBy(awaitedLibTags, 'id')

  const res = libItem.map((it) => {
    const tags = libTagDict[it.appId]
    return {
      ...it,
      tags: tags.tags.join(','),
      tagSynced: tags.tagSynced,
    }
  })
  await ctx.database.upsert('SteamFamilyLib', res)

  logger.info(
    `lib tags sync finished, synced ${res.filter((it) => !it.tagSynced).length} items`
  )
}

export default libTagSyncer
