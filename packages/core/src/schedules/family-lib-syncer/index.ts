import {
  ISteamService,
  SteamAccount,
  SteamAccountFamilyRel,
  SteamFamilyLibSubscribe,
  SteamRelateChannelInfo,
} from '@/interface'
import { Config } from '@/interface'
import _ from 'lodash'
import { getGameCapsule } from '@/utils'
import { Logger } from '@/interface/logger'
import { BotService, Session } from '@/interface'
import { handleTokenInvalid } from '@/schedules/family-lib-syncer/handleTokenInvalid'
import { buildMessages } from '@/schedules/family-lib-syncer/buildMsgs'
import { sendMessages } from '@/schedules/family-lib-syncer/messageSender'
import {
  getChangedLibs,
  updateDB,
} from '@/schedules/family-lib-syncer/getLibChange'

export const libMonitor =
  <CHANNEL, SESSION extends Session>(
    steam: ISteamService<CHANNEL>,
    botService: BotService<CHANNEL, SESSION>,
    config: Config,
    logger: Logger
  ) =>
  async () => {
    logger.info('trigger lib monitor')
    const subscribes =
      await steam.db.getAllSubscription<SteamRelateChannelInfo<CHANNEL>>()
    for (const item of subscribes) {
      try {
        await handleSubScribe<CHANNEL, SESSION>(
          steam,
          item,
          botService,
          config,
          logger
        )
      } catch (e) {
        logger.error(
          `some error occur during handle steam subscription familyId: ${item.steamAndFamilyRel.familyId}, ${e}`
        )
      }
    }
  }

const handleSubScribe = async <CHANNEL, SESSION extends Session>(
  steam: ISteamService<CHANNEL>,
  item: {
    account: SteamAccount
    steamAndFamilyRel: SteamAccountFamilyRel
    subscription: SteamFamilyLibSubscribe
    channel: SteamRelateChannelInfo<CHANNEL>
  },
  botService: BotService<CHANNEL, SESSION>,
  config: Config,
  logger: Logger
) => {
  logger.debug(
    `start handle family subscribe ${item.steamAndFamilyRel.familyId}`
  )

  // if invalid, will auto-renew account token
  const apiServiceResult = await steam.createAPIWithCurAccount(item.account)
  const session = botService.getSessionByChannelInfo(item.channel)
  if (!session) {
    logger.info(
      `it's seem that bot for family 「${item.steamAndFamilyRel.familyId}」have down. skip it`
    )
    return
  }
  // eslint-disable-next-line prefer-spread
  const trans = (...args) => session.text.apply(session, args)
  if (!apiServiceResult.isSuccess()) {
    await handleTokenInvalid<CHANNEL>(logger, item, session, steam)
    return
  }

  const {
    memberDict,
    newWishes,
    modifiedWishes,
    deletedWishes,
    wishesDict,
    newLibs,
    modifiedLibs,
    deletedLibs,
    libDict,
  } = await getChangedLibs(apiServiceResult.data, steam, item, logger)

  await updateDB(
    item,
    logger,
    steam,
    newWishes,
    modifiedWishes,
    deletedWishes,
    newLibs,
    modifiedLibs,
    deletedLibs
  )

  const msgs = await buildMessages(
    memberDict,
    newWishes,
    modifiedWishes,
    deletedWishes,
    wishesDict,
    newLibs,
    modifiedLibs,
    deletedLibs,
    libDict,
    item,
    trans
  )

  logger.info(
    `steam 家庭「${item.subscription.steamFamilyId}」库存/愿望单变更 ${msgs.length}`
  )
  const apps = msgs.map((msg) => msg.relateAppId)
  const appDetails = (
    await Promise.all(
      _.chunk(apps, 30).map((appChunk) =>
        steam.api.Steam.getSteamItems(appChunk)
      )
    )
  ).flatMap((it) => it.data.storeItems)
  const appDetailsDict = _.keyBy(appDetails, 'appid')
  const mappedMsgs = msgs.map((msg) => {
    const app = appDetailsDict[msg.relateAppId]
    const img = getGameCapsule(app, item.subscription.preferGameImgType)
    return {
      text: msg.text,
      img: img,
    }
  })
  sendMessages(mappedMsgs, session)
}
