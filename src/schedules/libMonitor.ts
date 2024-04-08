import {$, Context, h} from "koishi";
import {APIService} from "../service";
import _ from "lodash";
import {getGameCapsule} from "../utils";
import {Config} from "../config";
import {SteamAccount, SteamFamilyLib, SteamFamilyLibSubscribe} from "../index";
import {SteamSharedLib} from "../interface/shared-lib";
import {WishItem} from "../interface/wish";

const libMonitor = (ctx:Context,config:Config) => async ()=> {
  console.log('trigger lib monitor')
  const selection = ctx.database.join(['SteamAccount','SteamFamilyLibSubscribe'])
  const subscribe = await selection.where(row=> $.eq(row.SteamFamilyLibSubscribe.steamAccountId,row.SteamAccount.id)).execute()
  const subscribes = subscribe.map(item=> ({
    ...item.SteamFamilyLibSubscribe,
    account:item.SteamAccount
  }))
  for (const item of subscribes) {
    handleSubScribe(item, ctx,config)
  }
}

export default libMonitor


const prepareFamilyInfo = async (api:APIService,ctx:Context) => {
  const family = await api.Steam.getSteamFamily()
  const memberIds = family.data.familyGroup.members.map(member=>member.steamid?.toString())
  const [wishes, members] =await Promise.all([(await api.Steam.getSteamWishes(memberIds)).data, (await api.Steam.getFamilyMember(memberIds)).data])
  const m = members.accounts.map(acc=>acc.publicData)
  const memberDict = _.keyBy(m, 'steamid')
  const prevWishes = await ctx.database.get('SteamFamilyLib', {
    familyId: family.data.familyGroupid,
    type: 'wish'
  })
  return {
    family,
    memberDict,
    wishes,
    prevWishes
  }
}

const prepareData = async (api:APIService, familyId:string, ctx:Context) => {
  const prevLibs = ctx.database.get('SteamFamilyLib', {
    familyId: familyId,
    type: 'lib'
  })
  const libs = api.Steam.getFamilyLibs(familyId)
    .then(res=>
      res.data.apps.filter(app=>app.excludeReason == undefined || app.excludeReason == 0)
    )
  const [awaitedPrevLibs,awaitedLibs] = await Promise.all([prevLibs, libs])
  return {prevLibs:awaitedPrevLibs, libs:awaitedLibs}
}

const diffWishes = (prevWishes:SteamFamilyLib[],wishes:WishItem[]) => {
  // filter libs not in prevLibs
  const newWishes = wishes.filter(item=>
    !prevWishes.some(preItem=> preItem.appId.toString() == item.appId)
  )
  // filter libs in prevLib but ownerId not match
  const modifiedWishes = wishes.filter(item=>
    prevWishes.some(preItem=> preItem.appId.toString() == item.appId
      && preItem.steamIds != item.wishers.sort().join(','))
  )
  const wishesDict = _.keyBy(prevWishes, 'appId')
  // diff {
  //  new: wisher
  // removed:wisher
  // }
  // filter libs in prevLib but not ownerId diff
  const deletedWishes = prevWishes.filter(item=>
    !wishes.some(newItem=> newItem.appId == item.appId.toString())
  )
  return {
    newWishes,
    deletedWishes,
    modifiedWishes,
    wishesDict,
  }
}
const diffLibs = (prevLibs:SteamFamilyLib[],libs:SteamSharedLib[]) => {
  // filter libs not in prevLibs
  const newLibs = libs.filter(item=>
    !prevLibs.some(preItem=> preItem.appId == item.appid)
  )
  // filter libs in prevLib but ownerId not match
  const modifiedLibs = libs.filter(item=>
    prevLibs.some(preItem=> preItem.appId == item.appid && preItem.steamIds != item.ownerSteamids.sort().join(','))
  )
  const libDict = _.keyBy(prevLibs, 'appId')
  // filter libs in prevLib but not ownerId diff
  const deletedLibs = prevLibs.filter(item=>
    !libs.some(newItem=> newItem.appid == item.appId)
  )
  return {
    newLibs,
    modifiedLibs,
    libDict,
    deletedLibs,
  }
}

const handleSubScribe = async (item: {
  account: SteamAccount
} & SteamFamilyLibSubscribe, ctx:Context, config:Config) => {

  const api = new APIService(ctx,config,item.account)
  // 判断是否有效
  const {family, memberDict,wishes,prevWishes,} =
    await prepareFamilyInfo(api,ctx)
  const {prevLibs, libs} = await prepareData(api, item.account.familyId, ctx)

  const {newWishes,modifiedWishes, deletedWishes,wishesDict} = diffWishes(prevWishes,wishes)
  const {modifiedLibs,libDict,newLibs, deletedLibs} = diffLibs(prevLibs, libs)
  const libsUpsert = newLibs.concat(modifiedLibs).map(it=>(
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
  const wishesUpsert =  newWishes.map(newItem=>(
    {
      familyId: item.steamFamilyId,
      name: newItem.itemInfo?.name as any as string,
      appId: parseInt(newItem.appId),
      steamIds: newItem.wishers.sort().join(','),
      type: 'wish'
    }
  ))
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

  const newWishMsg = newWishes.map(newWish => {
    const names = newWish.wishers.map(ownerId => `「${memberDict[ownerId]?.personaName}」`)
    let text= `库存愿望单 + 1。${newWish.itemInfo?.name}，by：${names.join('，')}`
    return { text: text, relateAppId: newWish.appId.toString() }
  })
  const deleteWishMsg = deletedWishes.map(deletedWish => {
    const names = deletedWish.steamIds.split(',').map(ownerId => `「${memberDict[ownerId]?.personaName}」`)
    let text= `库存愿望单 - 1。${deletedWish.name}，by：${names.join('，')}`
    return { text: text, relateAppId: deletedWish.appId.toString() }
  })
  const modifiedWishMsg = modifiedWishes.map(modifiedWish => {
    const prevLib = libDict[modifiedWish.appId]
    const newWisherIds = modifiedWish.wishers
    const wisherIds = prevLib.steamIds.split(',')
    const newlySteamIds = newWisherIds.filter(item=> !wisherIds.includes(item))
    const removedSteamIds = wisherIds.filter(item=> !newWisherIds.includes(item))
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(id=>`「${memberDict[id]?.personaName}」`)
    let text= `愿望单副本 + ${add}。${modifiedWish.itemInfo?.name}，by：${names.join('，')}，当前愿望数：${newWisherIds.length}`
    if(add <= 0) {
      text= `愿望单变动，${modifiedWish.itemInfo?.name} 副本 - ${add}。当前愿望数 ${newWisherIds.length}`
    }
    return { text: text, relateAppId: modifiedWish.appId.toString() }
  })
  const newLibMsg = newLibs.map(newlib=> {
    const names = newlib.ownerSteamids.map(ownerId => `「${memberDict[ownerId]?.personaName}」`)
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
    const ownerIds = prevLib.steamIds.split(',')
    const newlySteamIds = newOwnerIds.filter(item=> !ownerIds.includes(item))
    const removedSteamIds = ownerIds.filter(item=> !newOwnerIds.includes(item))
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(id=>`「${memberDict[id]?.personaName}」`)
    let text= `感谢富哥${names.join("，")}，副本喜+${add}。${modifiedLib.name}，当前副本数 ${newOwnerIds.length}`
    if(add <= 0) {
      text= `库存变动，${modifiedLib.name} 副本 -${add}。当前副本数 ${newOwnerIds.length}`
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
  const bot = ctx.platform(item.platform).channel(item.channelId).bots?.[0]
  if(!bot) {return}
  const apps = msgs.map(msg=>msg.relateAppId)
  const appDetails = (await Promise.all(_.chunk(apps, 30).map(appChunk => api.Steam.getSteamItems(appChunk))))
    .flatMap(it=>it.data.storeItems)
  const appDetailsDict = _.keyBy(appDetails, 'appid')
  msgs.forEach(msg=> {
    const app = appDetailsDict[msg.relateAppId]
    const img = getGameCapsule(app)

    bot.sendMessage(item.channelId, h('message',msg.text))
    bot.sendMessage(item.channelId, h('img',{src: img}))
  })

}
