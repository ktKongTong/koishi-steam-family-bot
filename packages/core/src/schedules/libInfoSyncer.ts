import _ from 'lodash'
import { Config, ISteamService } from '../interface'
import { Logger } from '../interface/logger'

export const libInfoSyncer =
  (logger: Logger, config: Config, steam: ISteamService) => async () => {
    logger.info('trigger lib info syncer')
    const libItem = await steam.db.FamilyLib.getUnSyncedLib()
    const libsId = _.uniq(libItem.map((it) => it.appId))
    const libInfos = _.chunk(libsId, 30).flatMap(async (chunk) => {
      try {
        const steamItems = await steam.api.Steam.getSteamItemsBaseInfo(chunk)
        return steamItems.data ?? []
      } catch (e) {
        return []
      }
    })
    const awaitedLibInfos = (await Promise.all(libInfos)).flatMap((it) => it)
    const libInfoDict = _.keyBy(awaitedLibInfos, 'appId')
    const notSynced = libItem
      .filter((it) => !libInfoDict[it.appId])
      .map((it) => it.appId)
      .join(',')
    if (notSynced) {
      logger.info(`not synced steam apps ${notSynced}`)
    }
    const res = libItem
      .filter((it) => libInfoDict[it.appId])
      .map((it) => {
        const infos = libInfoDict[it.appId]
        return {
          appid: it.appId,
          name: it.name,
          aliases: infos.aliases,
          top20Tags: infos.top20Tags.join(','),
          lastRefreshedAt: Math.floor(Date.now() / 1000),
        }
      })
    const data = _.uniqBy(res, 'appid')
    await steam.db.FamilyLib.batchUpsertLibInfo(data)
    logger.info(`lib sync finished, synced ${res.length} items`)
  }
