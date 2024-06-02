import {
  IAPIService,
  ISteamService,
  SteamAccount,
  SteamFamilyLib,
  SteamFamilyLibSubscribe,
  SteamRelateChannelInfo,
} from '../interface'
import _ from 'lodash'
import { Config } from '../interface'
import {
  diffLibs,
  diffWishes,
  prepareFamilyInfo,
  prepareLibData,
} from './utils'
import { getGameCapsule } from '../utils'
import { Logger } from '../interface/logger'
import { BotService, Session } from '../interface'

export const libMonitor =
  <CHANNEL, SESSION extends Session>(
    steam: ISteamService,
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
          `some error occur during handle steam subscription familyId: ${item.account.familyId}, ${e}`
        )
      }
    }
  }

const handleTokenInvalid = async (
  logger: Logger,
  item,
  session: Session,
  steam: ISteamService
) => {
  logger.debug(
    `account 「${item.account.id}」steamId「${item.account.steamId}」token is invalid`
  )
  const timesStr = item.account.valid.split('.')?.[1]
  let times = 0
  if (!timesStr) {
    const tmp = parseInt(item.account.valid.split('.')[1])
    if (!Number.isNaN(tmp)) {
      times = tmp
    }
  }
  if (times >= 3) {
    await steam.db.clearAccountInfo(item.account)
    session.sendMsg({
      type: 'string',
      content: `steam account 「${item.account.steamId}」token has expired, now this account binding and subscription has deleted due to none response`,
    })
  } else {
    session.sendMsg({
      type: 'string',
      content: `steam account 「${item.account.steamId}」token has expired, please dm me and follow the instruction with [renew] cmd to refresh it`,
    })
    await steam.db.invalidAccount(item.account.id, item.subscription)
  }
}

const buildMessages = async <CHANNEL>(
  steam: ISteamService,
  api: IAPIService,
  item: {
    account: SteamAccount
    subscription: SteamFamilyLibSubscribe
    channel: CHANNEL
  },
  logger: Logger
) => {
  const { memberDict, wishes, prevWishes } = await prepareFamilyInfo(api, steam)
  logger.debug('success fetch family info')
  logger.info(item.account.familyId)
  const { prevLibs, libs } = await prepareLibData(
    api,
    steam,
    item.account.familyId
  )
  logger.debug('success fetch lib data')

  const { newWishes, modifiedWishes, deletedWishes, wishesDict } = diffWishes(
    prevWishes,
    wishes
  )
  const { modifiedLibs, libDict, newLibs, deletedLibs } = diffLibs(
    prevLibs,
    libs
  )
  const libsUpsert: Partial<SteamFamilyLib>[] = newLibs
    .concat(modifiedLibs)
    .map((it) => ({
      familyId: item.subscription.steamFamilyId,
      name: it.name,
      appId: it.appid,
      steamIds: it.ownerSteamids.sort().join(','),
      type: 'lib',
    }))
  const libsDelete = deletedLibs.map((it) => ({
    familyId: item.subscription.steamFamilyId,
    appId: it.appId,
    type: 'lib',
  }))
  const wishesUpsert: Partial<SteamFamilyLib>[] = newWishes
    .concat(modifiedWishes)
    .map((newItem) => ({
      familyId: item.subscription.steamFamilyId,
      name: newItem.itemInfo?.name as any as string,
      appId: parseInt(newItem.appId),
      steamIds: newItem.wishers.sort().join(','),
      type: 'wish',
    }))
  const wishesDelete = deletedWishes.map((it) => ({
    familyId: item.subscription.steamFamilyId,
    appId: it.appId,
    type: 'wish',
  }))
  await steam.db.FamilyLib.batchUpsertFamilyLib(wishesUpsert.concat(libsUpsert))
  await steam.db.FamilyLib.batchRemoveByAppIdAndFamilyId(
    item.subscription.steamFamilyId,
    wishesDelete.map((it) => it.appId),
    'wish'
  )
  await steam.db.FamilyLib.batchRemoveByAppIdAndFamilyId(
    item.subscription.steamFamilyId,
    libsDelete.map((it) => it.appId),
    'lib'
  )
  logger.debug(
    `「${item.subscription.steamFamilyId}」upsert ${wishesUpsert.length}, remove ${wishesDelete.length}`
  )

  const newWishMsg = newWishes.map((newWish) => {
    const names = newWish.wishers.map(
      (ownerId) => `「${memberDict[ownerId]?.personaName}」`
    )
    const text = `库存愿望单 + 1。${newWish.itemInfo?.name}，by：${names.join('，')}`
    return { text: text, relateAppId: newWish.appId.toString() }
  })

  const deleteWishMsg = deletedWishes.map((deletedWish) => {
    const names = deletedWish?.steamIds
      ?.split(',')
      ?.map((ownerId) => `「${memberDict[ownerId]?.personaName}」`)
    const text = `库存愿望单 - 1。${deletedWish.name}，by：${names.join('，')}`
    return { text: text, relateAppId: deletedWish.appId.toString() }
  })

  const modifiedWishMsg = modifiedWishes.map((modifiedWish) => {
    const prevLib = wishesDict[modifiedWish.appId]
    const newWisherIds = modifiedWish.wishers
    const wisherIds = prevLib?.steamIds?.split(',')
    const newlySteamIds = newWisherIds.filter(
      (item) => !wisherIds.includes(item)
    )
    const removedSteamIds = wisherIds.filter(
      (item) => !newWisherIds.includes(item)
    )
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(
      (id) => `「${memberDict[id]?.personaName}」`
    )
    let text = `愿望单副本 + ${add}。${modifiedWish.itemInfo?.name}，by：${names.join('，')}，当前愿望数：${newWisherIds.length}`
    if (add <= 0) {
      text = `愿望单变动，${modifiedWish.itemInfo?.name} 副本 ${add}。当前愿望数 ${newWisherIds.length}`
    }
    return { text: text, relateAppId: modifiedWish.appId.toString() }
  })

  const newLibMsg = newLibs.map((newlib) => {
    const names = newlib.ownerSteamids.map(
      (ownerId) => `「${memberDict[String(ownerId)]?.personaName}」`
    )
    let text = `感谢富哥${names.join('，')}，库存喜+1。${newlib.name}`
    if (names.length > 1) {
      text += '当前副本数 ' + names.length
    }
    return { text: text, relateAppId: newlib.appid.toString() }
  })

  const deleteLibMsg = deletedLibs.map((deletedLib) => ({
    text: `库存变动，库存 -1。${deletedLib.name}`,
    relateAppId: deletedLib.appId.toString(),
  }))

  const modifiedLibMsg = modifiedLibs.map((modifiedLib) => {
    const prevLib = libDict[modifiedLib.appid]
    const newOwnerIds = modifiedLib.ownerSteamids
    const ownerIds = prevLib?.steamIds?.split(',')
    const newlySteamIds = newOwnerIds.filter(
      (item) => !ownerIds.includes(String(item))
    )
    const removedSteamIds = ownerIds.filter(
      (item) => !newOwnerIds.includes(BigInt(item))
    )
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(
      (id) => `「${memberDict[String(id)]?.personaName}」`
    )
    let text = `感谢富哥${names.join('，')}，副本喜+${add}。${modifiedLib.name}，当前副本数 ${newOwnerIds.length}`
    if (add <= 0) {
      text = `库存变动，${modifiedLib.name} 副本 ${add}。当前副本数 ${newOwnerIds.length}`
    }
    return {
      text,
      relateAppId: modifiedLib.appid.toString(),
    }
  })

  let msgs = [...newLibMsg, ...modifiedLibMsg, ...deleteLibMsg]

  if (item.subscription.subWishes) {
    msgs = msgs.concat([...newWishMsg, ...modifiedWishMsg, ...deleteWishMsg])
  }
  return msgs
}

const handleSubScribe = async <CHANNEL, SESSION extends Session>(
  steam: ISteamService,
  item: {
    account: SteamAccount
    subscription: SteamFamilyLibSubscribe
    channel: SteamRelateChannelInfo<CHANNEL>
  },
  botService: BotService<CHANNEL, SESSION>,
  config: Config,
  logger: Logger
) => {
  logger.debug(`start handle family subscribe ${item.account.familyId}`)

  // if invalid, will auto-renew account token
  const apiServiceResult = await steam.createAPIWithCurAccount(item.account)
  const session = botService.getSessionByChannelInfo(item.channel)
  if (!session) {
    logger.info(
      `it's seem that bot for family 「${item.account.familyId}」have down. skip it`
    )
    return
  }
  if (!apiServiceResult.isSuccess()) {
    await handleTokenInvalid(logger, item, session, steam)
    return
  }
  const msgs = await buildMessages(steam, apiServiceResult.data, item, logger)
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
    const img = getGameCapsule(app)
    return {
      text: msg.text,
      img: img,
    }
  })
  handleMessage(mappedMsgs, session)
}

interface Msg {
  text: string
  img: string
}

const handleMessage = (msgs: Msg[], session: Session) => {
  const send = (msg: Msg) => {
    session.sendMsg({ type: 'string', content: msg.text })
    session.sendMsg({ type: 'image', content: msg.img })
  }
  if (msgs.length > 5) {
    msgs.slice(0, 3).forEach((msg) => send(msg))
    const size = msgs.length - 3
    const t = size > 30 ? '30项' : ''
    session.sendMsg({
      type: 'string',
      content: `愿望单/库存短时间内发生大量变更,共 ${msgs.length} 项，为防止刷屏，仅播报${t}简略信息。`,
    })
    const chunkedText = _.chunk(msgs.slice(3), 10)
      .slice(0, 3)
      .map((appTexts, index) =>
        appTexts
          .map((appText, idx) => `${index * 10 + idx + 1}. ${appText.text}`)
          .join('')
      )
    chunkedText.forEach((text) => {
      session.sendMsg({ type: 'string', content: text })
    })
  } else {
    msgs.forEach((msg) => send(msg))
  }
}
