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
        session.send('你暂未绑定Steam账号，无法获取家庭信息，暂时无法进行家庭库订阅')
        return
      }
      let account =  accounts[0]
      if (accounts.length > 1) {
        session.send('你当前绑定多个账号，请输入序号选择 steam 账号进行家庭库订阅')
        // const res = await session.prompt(30 * 1000)
      }
      //
      // session.send(`将要订阅「${account.steamId}」的家庭更新，请在 30s 内输入：\n1. 仅订阅家庭库更新\n2. 仅订阅成员愿望单更新\n3. 订阅家庭库和成员愿望单更新\n默认仅订阅家庭库更新`)
      const api = new APIService(ctx,cfg, account)

      const steamFamily:APIResp<SteamFamily> = await api.Steam.getSteamFamily()
      const familyId = steamFamily.data.familyGroupid
      const steamSharedLibs: APIResp<SharedLibResp> = await api.Steam.getFamilyLibs(familyId)
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

      const  res = await ctx.database.upsert("SteamFamilyLibSubscribe", [{
        "uid": session.uid,
        'channelId': session.event.channel.id,
        "selfId": session.bot.selfId,
        "platform": session.platform,
        'steamFamilyId': familyId,
        'steamAccountId': account.id,
        "subLib":subLib,
        'subWishes':subWish
      }])

      session.send(
        h('message',
          h('quote', {id:session.messageId}),
          `hello，${steamFamily.data.familyGroup.name} 的成员，成功订阅家庭游戏库更新，已获取库存 ${apps.length} 项作品 ${subWish ? `愿望单 ${wishesSize} 项`:''}`,
        )
      )


    })
}
