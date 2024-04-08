import {Context, h} from "koishi";
import _ from "lodash";
import {Config} from "./config";
import {getGameCapsule} from "./utils";
import {APIService} from "./service";

export function schedules(ctx:Context,config:Config) {

  ctx.setInterval(async ()=> {
    console.log('trigger')
    // 群聊发送
    const allSubscribe = await ctx.database.get('SteamFamilyLibSubscribe', {})


    for (const item of allSubscribe) {
      const api = new APIService(ctx,config,item.uid)
      const family = await api.Steam.getSteamFamily()
      if(family?.data?.familyGroup == undefined) {
        // try renew token
        console.log('seem token expired')
        return
      }
      const memberIds = family.data.familyGroup.members.map(member=>member.steamid?.toString())
      const members = (await api.Steam.getFamilyMember(memberIds)).data
      const m = members.accounts.map(acc=>acc.publicData)
      const memberDict = _.keyBy(m, 'steamid')
      // members
      const prevLibs = ctx.database.get('SteamFamilyLib', {
        familyId: item.steamFamilyId
      })
      const libs = api.Steam.getFamilyLibs(item.steamFamilyId).then(res=>res.data.apps.filter(app=>app.excludeReason == undefined || app.excludeReason == 0))
      const [awaitedPrevLibs,awaitedLibs] = await Promise.all([prevLibs, libs])
      // filter libs not in prevLibs
      const newLib = awaitedLibs.filter(item=>
        !awaitedPrevLibs.some(preItem=> preItem.appId == item.appid)
      )
      // filter libs in prevLib but not ownerId diff
      const modifiedLibs = awaitedLibs.filter(item=>
        awaitedPrevLibs.some(preItem=> preItem.appId == item.appid && preItem.ownerSteamIds != item.ownerSteamids.sort().join(','))
      )
      const libDict = _.keyBy(awaitedPrevLibs, 'appId')

      // filter libs in prevLib but not ownerId diff
      const deletedLibs = awaitedPrevLibs.filter(item=>
        awaitedLibs.some(newItem=> newItem.appId == item.appId)
      )
      const awaitedModifiedDBLibs = modifiedLibs.map(modifiedItem=>(
        {
          familyId: item.steamFamilyId,
          appId: modifiedItem.appid,
          ownerSteamIds: modifiedItem.ownerSteamids.sort().join(','),
        }
      ))
      const awaitedDBLibs = newLib.map(newItem=>(
        {
          familyId: item.steamFamilyId,
          appId: newItem.appid,
          ownerSteamIds: newItem.ownerSteamids.sort().join(','),
        }
      )).concat(awaitedModifiedDBLibs)
      if(awaitedDBLibs.length>0) {
        ctx.database.upsert('SteamFamilyLib', awaitedDBLibs)
      }else {
        return
      }
      const ctx2 = ctx.platform(item.platform).channel(item.channelId)
      const bots = ctx2.bots
      const bot = ctx.bots[`${item.platform}:${item.selfId}`]
      if(!bot) {
        continue
      }
      for (const newlib of newLib) {
        const id = newlib.ownerSteamids[0]
        const names = newlib.ownerSteamids.map(ownerId => `「${memberDict[ownerId]?.personaName}」`)
        let text= `感谢富哥${names.join('，')}，库存喜+1。${newlib.name}`
        if (names.length > 1) {
          text +=  "当前副本数 "+names.length
        }
        const appDetail = await api.Steam.getSteamItems([newlib.appid.toString()])
        const app = appDetail.data.storeItems[0]
        const img = getGameCapsule(app)
        bot.sendMessage(item.channelId, h('message', text))
        bot.sendMessage(item.channelId, h('img', { src: img }))
      }

      for (const deletedLib of deletedLibs) {
        const id = deletedLib.appId
        const appDetail = await api.Steam.getSteamItems([id.toString()])
        const app = appDetail.data.storeItems[0]
        const text= `库存变动，库存 -1。${app.name}`
        const img = getGameCapsule(app)
        bot.sendMessage(item.channelId, h('message', text))
        bot.sendMessage(item.channelId, h('img', { src: img }))
        ctx.database.remove('SteamFamilyLib', {
          familyId: deletedLib.familyId,
          appId: deletedLib.appId,
        })
      }
      for (const modifiedLib of modifiedLibs) {
        const prevLib = libDict[modifiedLib.appid]
        const newOwnerIds = modifiedLib.ownerSteamids
        const ownerIds = prevLib.ownerSteamIds.split(',')
        const newlySteamIds = newOwnerIds.filter(item=> !ownerIds.includes(item))
        const removedSteamIds = ownerIds.filter(item=> !newOwnerIds.includes(item))
        const add = newlySteamIds.length - removedSteamIds.length
        const names = newlySteamIds.map(id=>`「${memberDict[id]?.personaName}」`)
        let text= `感谢富哥${names.join("，")}，副本喜+${add}。${modifiedLib.name}，当前副本数 ${newOwnerIds.length}`
        if(add <= 0) {
          text= `库存变动，${modifiedLib.name} 副本 -${add}。当前副本数 ${newOwnerIds.length}`
        }
        const appDetail = await api.Steam.getSteamItems([modifiedLib.appid.toString()])
        const app = appDetail.data.storeItems[0]
        const img = getGameCapsule(app)
        bot.sendMessage(item.channelId, h('message', text))
        bot.sendMessage(item.channelId, h('img', { src: img }))
      }
    }
  },config.TriggerInterval)
}
