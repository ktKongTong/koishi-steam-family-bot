import {$, Context, h, Logger} from "koishi";
import {APIService} from "../service";
import _ from "lodash";
import {getGameCapsule} from "../utils";
import {Config} from "../config";
import {SteamAccount, SteamFamilyLibSubscribe} from "../index";
import {diffLibs, diffWishes} from "./utils";

const libMonitor = (ctx:Context,config:Config) => async ()=> {
  const logger = ctx.logger('steam-family-bot.libMonitor');
  logger.info('trigger lib monitor')
  // batch valid account
  // subscribes account
  // valid account
  // check account valid

  const selection = ctx.database.join(['SteamAccount','SteamFamilyLibSubscribe'])
  const subscribe = await selection.where(row=>
  $.and(
      $.eq(row.SteamFamilyLibSubscribe.accountId,row.SteamAccount.id),
      $.eq( row.SteamAccount.valid,'valid'))
  ).execute()
  const subscribes = subscribe.map(item=> ({
    ...item.SteamFamilyLibSubscribe,
    account:item.SteamAccount
  }))

  for (const item of subscribes) {
    try {
      handleSubScribe(item, ctx,config,logger)
    }catch (e) {
      logger.error(`some error occur during handle steam subscription familyId: ${item.account.familyId}`, e)
    }

  }
}

export default libMonitor


const prepareFamilyInfo = async (api:APIService,ctx:Context,logger:Logger) => {
  const family = await api.Steam.getSteamFamilyGroup()
  const memberIds = family.data.familyGroup.members.map(member=>member.steamid?.toString())
  const [wishes, members] =await Promise.all([(await api.Steam.getSteamWishes(memberIds)).data, (await api.Steam.getFamilyMembers(memberIds)).data])
  const m = members.accounts.map(acc=>acc.publicData)
  const memberDict = _.keyBy(m, 'steamid')
  const prevWishes = await ctx.database.get('SteamFamilyLib', {
    familyId: family.data.familyGroupid.toString(),
    type: 'wish'
  })
  logger.debug(`prepare FamilyData prevWishes:${prevWishes?.length} wishes: ${wishes?.length}`)
  return {
    family,
    memberDict,
    wishes,
    prevWishes
  }
}

const prepareData = async (api:APIService, familyId:string, ctx:Context,logger:Logger) => {
  const prevLibs = ctx.database.get('SteamFamilyLib', {
    familyId: familyId,
    type: 'lib'
  })
  const libs = api.Steam.getSteamFamilyGroupLibs(BigInt(familyId))
    .then(res=>
      res?.data.apps.filter(app=>app.excludeReason == undefined || app.excludeReason == 0)
    )
  const [awaitedPrevLibs,awaitedLibs] = await Promise.all([prevLibs, libs])
  logger.info(`prepare Data prevlibs:${awaitedPrevLibs?.length} libs: ${awaitedLibs?.length}`)
  return {prevLibs:awaitedPrevLibs, libs:awaitedLibs}
}



const handleSubScribe = async (item: {
  account: SteamAccount
} & SteamFamilyLibSubscribe, ctx:Context, config:Config, logger:Logger) => {

  logger.debug(`start handle family subscribe ${item.steamFamilyId}`)

  const apiServiceResult = await APIService.create(ctx,config,item.account)

  // try to get bot
  const bot = ctx.bots[`${item.platform}:${item.selfId}`]
  if(!bot) {return}

  if(!apiServiceResult.isSuccess()) {
    logger.debug(`account 「${item.account.id}」steamId「${item.account.steamId}」token is invalid`)
    let timesStr = item.account.valid.split('.')?.[1]
    let times = 0
    if (!timesStr) {
      let tmp = parseInt(item.account.valid.split('.')[1])
      if(!Number.isNaN(tmp)) {times = tmp}
    }
    if (times >= 3) {
      bot.sendMessage(item.channelId,h(
        'message',
        [
          h('at',
            {id: item.account.uid
            }),
          `steam account 「${item.account.steamId}」token has expired, now this account binding and subscription has deleted due to none response`
        ]
      ))
      ctx.database.remove('SteamAccount', {
        id: item.account.id,
      })
      ctx.database.remove('SteamFamilyLibSubscribe', {
        accountId: item.account.id,
      })
    }else {
      bot.sendMessage(item.channelId, h(
        'message',
        [
          h('at',
            {id: item.account.uid
            }),
          `steam account 「${item.account.steamId}」token has expired, please dm me and follow the instruction with [renew] cmd to refresh it`
        ]
      ))
      ctx.database.set('SteamAccount', {
        id: item.account.id,
      }, {
        valid: `invalid-notified.${times+1}`
      })
      ctx.database.set('SteamFamilyLibSubscribe', {
        accountId: item.account.id,
      }, {active: false})
    }
    return
  }

  let api = apiServiceResult.data
  const {family, memberDict,wishes,prevWishes,} =
    await prepareFamilyInfo(api,ctx,logger)
  logger.debug('success fetch family info')
  logger.info(item.account.familyId)
  const {prevLibs, libs} = await prepareData(api, item.account.familyId, ctx,logger)
  logger.debug('success fetch lib data')

  const {newWishes,modifiedWishes, deletedWishes,wishesDict} = diffWishes(prevWishes,wishes)
  const {modifiedLibs,libDict,newLibs, deletedLibs} = diffLibs(prevLibs, libs)
  const libsUpsert = newLibs
    .concat(modifiedLibs)
    .map(it=>(
    {
      familyId: item.steamFamilyId,
      name: it.name,
      appId: it.appid,
      steamIds: it.ownerSteamids.sort().join(','),
      type: 'lib'
    }
  ))
  const libsDelete = deletedLibs.map(it=> ({
    familyId: item.steamFamilyId,
    appId: it.appId,
    type: 'lib'
  }))
  const wishesUpsert =  newWishes
    .concat(modifiedWishes)
    .map(newItem=>({
      familyId: item.steamFamilyId,
      name: newItem.itemInfo?.name as any as string,
      appId: parseInt(newItem.appId),
      steamIds: newItem.wishers.sort().join(','),
      type: 'wish'
    }))
  const wishesDelete = deletedWishes.map(it=> ({
    familyId: item.steamFamilyId,
    appId: it.appId,
    type: 'wish'
  }))

  const upsert = wishesUpsert.concat(libsUpsert)
  ctx.database.upsert('SteamFamilyLib', upsert)
  const res = await ctx.database.remove( 'SteamFamilyLib',
    {
      appId:wishesDelete.map(it=>it.appId),
      familyId: item.steamFamilyId,
      type: 'wish'
    })
    ctx.database.remove( 'SteamFamilyLib',
    {
      appId:libsDelete.map(it=>it.appId),
      familyId: item.steamFamilyId,
      type: 'lib'
    })
  logger.debug(`「${item.steamFamilyId}」upsert ${wishesUpsert.length}, remove ${wishesDelete.length}`)


  const newWishMsg = newWishes.map(newWish => {
    const names = newWish.wishers.map(ownerId => `「${memberDict[ownerId]?.personaName}」`)
    let text= `库存愿望单 + 1。${newWish.itemInfo?.name}，by：${names.join('，')}`
    return { text: text, relateAppId: newWish.appId.toString() }
  })


  const deleteWishMsg = deletedWishes.map(deletedWish => {
    const names = deletedWish?.steamIds?.split(',')?.map(ownerId => `「${memberDict[ownerId]?.personaName}」`)
    let text= `库存愿望单 - 1。${deletedWish.name}，by：${names.join('，')}`
    return { text: text, relateAppId: deletedWish.appId.toString() }
  })
  const modifiedWishMsg = modifiedWishes.map(modifiedWish => {
    const prevLib = wishesDict[modifiedWish.appId]
    const newWisherIds = modifiedWish.wishers
    const wisherIds = prevLib?.steamIds?.split(',')
    const newlySteamIds = newWisherIds.filter(item=> !wisherIds.includes(item))
    const removedSteamIds = wisherIds.filter(item=> !newWisherIds.includes(item))
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(id=>`「${memberDict[id]?.personaName}」`)
    let text= `愿望单副本 + ${add}。${modifiedWish.itemInfo?.name}，by：${names.join('，')}，当前愿望数：${newWisherIds.length}`
    if(add <= 0) {
      text= `愿望单变动，${modifiedWish.itemInfo?.name} 副本 ${add}。当前愿望数 ${newWisherIds.length}`
    }
    return { text: text, relateAppId: modifiedWish.appId.toString() }
  })
  const newLibMsg = newLibs.map(newlib=> {
    const names = newlib.ownerSteamids.map(ownerId => `「${memberDict[String(ownerId)]?.personaName}」`)
    let text= `感谢富哥${names.join('，')}，库存喜+1。${newlib.name}`
    if (names.length > 1) {
      text +=  "当前副本数 "+names.length
    }
    return { text: text, relateAppId: newlib.appid.toString() }
  })
  const deleteLibMsg = deletedLibs.map(deletedLib => ({text:`库存变动，库存 -1。${deletedLib.name}`, relateAppId: deletedLib.appId.toString()}))
  const modifiedLibMsg =  modifiedLibs.map(modifiedLib=> {
    const prevLib = libDict[modifiedLib.appid]
    const newOwnerIds = modifiedLib.ownerSteamids
    const ownerIds = prevLib?.steamIds?.split(',')
    const newlySteamIds = newOwnerIds.filter(item=> !ownerIds.includes(String(item)))
    const removedSteamIds = ownerIds.filter(item=> !newOwnerIds.includes(BigInt(item)))
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(id=>`「${memberDict[String(id)]?.personaName}」`)
    let text= `感谢富哥${names.join("，")}，副本喜+${add}。${modifiedLib.name}，当前副本数 ${newOwnerIds.length}`
    if(add <= 0) {
      text= `库存变动，${modifiedLib.name} 副本 ${add}。当前副本数 ${newOwnerIds.length}`
    }
    return {
      text,
      relateAppId: modifiedLib.appid.toString()
    }
  })
  let msgs = [
    ...newLibMsg, ...modifiedLibMsg, ...deleteLibMsg
  ]
  if(item.subWishes) {
    msgs = msgs.concat([...newWishMsg,...modifiedWishMsg,  ...deleteWishMsg])
  }
  logger.info(`steam 家庭「${item.steamFamilyId}」库存/愿望单变更 ${msgs.length}`)
  const apps = msgs.map(msg=>msg.relateAppId)
  const appDetails = (await Promise.all(_.chunk(apps, 30).map(appChunk => api.Steam.getSteamItems(appChunk))))
    .flatMap(it=>it.data.storeItems)
  const appDetailsDict = _.keyBy(appDetails, 'appid')
  if(msgs.length > 5) {
    msgs.slice(0, 3).forEach((msg)=> {
        const app = appDetailsDict[msg.relateAppId]
        const img = getGameCapsule(app)
        bot.sendMessage(item.channelId,h('message',msg.text))
        bot.sendMessage(item.channelId,h('img',{src: img}))
      })
    bot.sendMessage(item.channelId,h('message',`愿望单/库存短时间内发生大量变更,共 ${msgs.length} 项，为防止刷屏，不再播报详情`))
  } else {
    msgs.forEach(msg=> {
      const app = appDetailsDict[msg.relateAppId]
      const img = getGameCapsule(app)
      bot.sendMessage(item.channelId,h('message',msg.text))
      bot.sendMessage(item.channelId,h('img',{src: img}))
    })
  }
}
