import { Context, Logger } from 'koishi'
import { Config, ISteamService } from '../../service'
import { preferImgStringToEnum } from '../../service/utils'

export function InfoCmd(
  ctx: Context,
  cfg: Config,
  logger: Logger,
  steamService: ISteamService
) {
  const log = logger.extend('info')
  const subcmd = ctx
    .command('slm.info')
    .alias('sbme')
    .alias('sbinfo')
    .action(async ({ session, options }, input) => {
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        session.sendQueued('你暂未绑定Steam账号，无法获取更多信息')
        return
      }
      const sub =
        await steamService.db.Subscription.getSubscriptionByChannelInfoAndFamilyId(
          account.familyId,
          {
            uid: session.uid,
            channelId: session.channelId,
            selfId: session.selfId,
            platform: session.platform,
          }
        )
      if (!sub) {
        session.sendQueued(`当前账号「${account.steamId}」在该频道暂无订阅信息`)
        return
      }
      const familyLibAndWishes =
        await steamService.db.FamilyLib.getSteamFamilyLibByFamilyId(
          sub.steamFamilyId
        )
      const familyLibs = familyLibAndWishes.filter((it) => it.type == 'lib')
      const familyWishes = familyLibAndWishes.filter((it) => it.type == 'wish')
      const text =
        `当前家庭「${sub.steamFamilyId}」，` +
        `库存共计 ${familyLibs.length} 项\n` +
        `${sub.subWishes ? `愿望单共计 ${familyWishes.length} 项` : ''}` +
        `订阅信息：\n` +
        `${sub.subLib ? '✅' : '❌'} 订阅库存信息 \n` +
        `${sub.subWishes ? '✅' : '❌'} 订阅愿望单信息\n` +
        `游戏封面偏好：${preferImgStringToEnum(sub.preferGameImgType)}`
      session.sendQueued(text)
    })
}
