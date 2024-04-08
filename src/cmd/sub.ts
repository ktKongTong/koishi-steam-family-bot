import {Context, h} from "koishi";
import {Config} from "../config";
import {APIService} from "../service";
import {APIResp, SteamFamily} from "../interface/family";
import {SharedLibResp} from "../interface/shared-lib";

export function SubCmd(ctx:Context,cfg:Config) {
  const subcmd = ctx
    .command('slm.sub')
    .alias('sbsub')
    .userFields(['steamAccessToken'])
    .action(async ({ session, options }, input) => {

      let channelSub = true
      // verified if valid

      const api = new APIService(ctx,cfg, session.user.steamAccessToken)
      const steamFamily:APIResp<SteamFamily> = await api.Steam.getSteamFamily()
      const familyId = steamFamily.data.familyGroupid
      const steamSharedLibs: APIResp<SharedLibResp> = await api.Steam.getFamilyLibs(familyId)
      const apps = steamSharedLibs.data.apps
        .filter((item)=> item.excludeReason == undefined || item.excludeReason == 0)
        .map(item=> ({
          familyId: familyId,
          appId: item.appid,
          ownerSteamIds: item.ownerSteamids.sort().join(','),
        }))

      const insertRes = await ctx.database.upsert('SteamFamilyLib', apps)

      const  res = await ctx.database.upsert("SteamFamilyLibSubscribe", [{
        "uid": session.userId,
        'username': session.username,
        'channelId': channelSub ? session.event.channel.id:null,
        "selfId": session.bot.selfId,
        "platform": session.platform,
        'steamFamilyId': familyId
      }])

      session.send(
        h('message',
          h('quote', {id:session.messageId}),
          `hello，${steamFamily.data.familyGroup.name} 的成员，成功订阅家庭游戏库，已获取 ${apps.length} 项作品`,
        )
      )


    })
}
