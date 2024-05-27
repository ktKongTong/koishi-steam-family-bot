import { $, Context } from 'koishi'
import { Config } from '../config'
import _ from 'lodash'
import { ISteamService } from '../interface'

const libTagSyncer =
  (ctx: Context, config: Config, steam: ISteamService) => async () => {
    const logger = ctx.logger('steam-family-bot.libTagsMonitor')
    logger.info('trigger lib tags monitor')
    const libItem = await steam.db.FamilyLib.getUnSyncedTagLib()
    // const libItem = totalLibItem.slice(0, 500)
    // logger.info(`trigger lib tags syncer, total ${totalLibItem.length}, syncing ${libItem.length}`)
    const libsId = _.uniq(libItem.map((it) => it.appId))
    const libTags = _.chunk(libsId, 30).flatMap(async (chunk) => {
      try {
        const steamItems = await steam.api.Steam.getSteamItems(
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
        }))

        return tagsById
      } catch (e) {
        return []
      }
    })

    const awaitedLibTags = (await Promise.all(libTags)).flatMap((it) => it)

    const libTagDict = _.keyBy(awaitedLibTags, 'id')

    const res = libItem
      .filter((it) => libTagDict[it.appId])
      .map((it) => {
        const tags = libTagDict[it.appId]
        return {
          appid: it.appId,
          tags: tags.tags.join(','),
          name: it.name,
          lastRefreshedAt: Date.now(),
        }
      })
    const data = _.uniqBy(res, 'appid')
    await steam.db.FamilyLib.batchUpsertLibInfo(data)

    logger.info(`lib tags sync finished, synced ${res.length} items`)
  }

export default libTagSyncer
