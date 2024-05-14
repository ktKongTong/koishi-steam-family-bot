import {Context, h} from "koishi";
import {Config} from "../config";
import {APIService} from "../service";
import {APIResp, SteamFamily} from "../interface/family";
import {SharedLibResp} from "../interface/shared-lib";
import {SteamFamilyLib} from "../index";

export function SubCmd(ctx:Context,cfg:Config) {
  const subcmd = ctx
    .command('slm.sub')
    .alias('sbsub')
    .option('w', '<subWish:boolean>')
    .option('l', '<subLib:boolean>')
    .action(async ({ session, options }, input) => {
      let subWish = options.w ?? false
      let subLib = options.l ?? true

      const accounts = await ctx.database.get('SteamAccount', {
        uid: session.uid,
      })
      if (accounts.length === 0) {
        session.sendQueued('你暂未绑定Steam账号，无法获取家庭信息，暂时无法进行家庭库订阅')
        return
      }

      if (accounts.length > 1) {
        session.sendQueued('你当前绑定多个账号，请输入序号选择 steam 账号进行家庭库订阅')
        const res = await session.prompt(30 * 1000)
      }
      let account =  accounts[0]
      const apiServiceResult = await APIService.create(ctx,cfg, account)
      if(!apiServiceResult.isSuccess()) {
        session.sendQueued('当前账号的 token 已失效，若需继续使用，请通过 renew 指令更新该账号的 token')
        return
      }
      let api = apiServiceResult.data

      const steamFamily:APIResp<SteamFamily> = await api.Steam.getSteamFamily()
      const familyId = steamFamily.data.familyGroupid
      if(!familyId) {
        session.sendQueued('暂时无法获取家庭，可能是因为网络问题或 token 失效，请稍后重试或 renew token')
        return
      }
      const steamSharedLibs: APIResp<SharedLibResp> = await api.Steam.getFamilyLibs(familyId)
      const steamAccountId = steamSharedLibs.data.ownerSteamid
      let dbContent:Omit<SteamFamilyLib, 'id'>[] = []
      let wishesSize = 0
      if (subWish) {
        const memberIds = steamFamily.data.familyGroup.members.map(member=>member.steamid)
        const wishes = (await api.Steam.getSteamWishes(memberIds)).data
        dbContent = dbContent.concat(wishes.map(wish=> {
          return {
            familyId: familyId,
            appId: parseInt(wish.appId),
            name: wish.itemInfo?.name as any as string,
            steamIds: wish.wishers.sort().join(','),
            type: 'wish'
          }
        }))
        wishesSize = dbContent.length
      }
      const apps = steamSharedLibs.data.apps
        .filter((item)=> item.excludeReason == undefined || item.excludeReason == 0)
        .map(item=> ({
          familyId: familyId,
          appId: item.appid,
          name: item.name,
          steamIds: item.ownerSteamids.sort().join(','),
          type: 'lib'
        }))

      dbContent = dbContent.concat(apps as any)
      const insertRes = await ctx.database.upsert('SteamFamilyLib',dbContent)


      const subscribe = await ctx.database.get('SteamFamilyLibSubscribe', {
        channelId: session.channelId,
        steamFamilyId: account.familyId,
        active: true
      })


      if(subscribe.length !== 0 && subscribe[0]) {
        let subscribeItem = subscribe[0]
        const data = {
          id: subscribeItem.id,
          "uid": session.uid,
          'channelId': session.event.channel.id,
          "selfId": session.bot.selfId,
          "platform": session.platform,
          'steamFamilyId': subscribeItem.steamFamilyId,
          'steamAccountId': subscribeItem.steamAccountId,
          'accountId': account.id,
          "subLib":subLib,
          'subWishes': subWish,
          active: true
        }
        await ctx.database.upsert("SteamFamilyLibSubscribe", [data])
      }else {
        await ctx.database.upsert("SteamFamilyLibSubscribe", [{
          "uid": session.uid,
          'channelId': session.event.channel.id,
          "selfId": session.bot.selfId,
          "platform": session.platform,
          'steamFamilyId': familyId,
          'steamAccountId': steamAccountId,
          'accountId': account.id,
          "subLib":subLib,
          'subWishes':subWish,
          active: true
        }])
      }

      session.sendQueued(
        h('message',
          h('quote', {id:session.messageId}),
          `hello，「${steamFamily.data.familyGroup.name}」的成员，成功订阅家庭游戏库更新，已获取库存 ${apps.length} 项${subWish ? `，愿望单 ${wishesSize} 项`:''}`,
        )
      )
    })
}
