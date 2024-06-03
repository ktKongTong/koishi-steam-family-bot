import { Context, h, Logger } from 'koishi'
import { ISteamService, Config, PreferGameImgType } from '../interface'

export function SubCmd(
  ctx: Context,
  cfg: Config,
  logger: Logger,
  steamService: ISteamService
) {
  const log = logger.extend('subscribe')
  const subcmd = ctx
    .command('slm.sub')
    .alias('sbsub')
    .option('img', '<preferImg:string>')
    .option('w', '<subWish:boolean>')
    .option('l', '<subLib:boolean>')
    .action(async ({ session, options }, input) => {
      const subWish = options.w ?? false
      const subLib = options.l ?? true
      let preferGameImgType = PreferGameImgType.Library2X
      switch (options.img) {
        case 'main':
          preferGameImgType = PreferGameImgType.Main
          break
        case 'small':
          preferGameImgType = PreferGameImgType.Small
          break
        case 'library':
          preferGameImgType = PreferGameImgType.Library
          break
        case 'library2x':
          preferGameImgType = PreferGameImgType.Library2X
          break
        case 'header':
          preferGameImgType = PreferGameImgType.Header
          break
      }
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        session.sendQueued(
          '你暂未绑定Steam账号，无法获取家庭信息，暂时无法进行家庭库订阅'
        )
        return
      }
      if (account.status === 'un-auth') {
        session.sendQueued('仅经过验证的用户可以进行家庭库订阅修改操作')
        return
      }
      const valid = await steamService.validAccount(account)
      if (!valid) {
        session.sendQueued(
          '当前账号的 token 已失效，若需继续使用，请通过 renew 指令更新该账号的 token'
        )
        return
      }

      const channelInfo = {
        uid: session.uid,
        channelId: session.channelId,
        selfId: session.selfId,
        platform: session.platform,
      }
      const subscription =
        await steamService.db.Subscription.getSubscriptionByChannelInfoAndFamilyId(
          account.familyId,
          channelInfo
        )
      if (subscription) {
        await steamService.db.Subscription.updateSubscription({
          ...subscription,
          steamFamilyId: account.familyId,
          subWishes: subWish,
          subLib,
          preferGameImgType,
        })
        session.send('成功更新订阅信息。')
      } else {
        const res = await steamService.subscribeFamilyLibByAccount(
          account,
          channelInfo,
          preferGameImgType,
          subLib,
          subWish
        )
        session.sendQueued(
          h(
            'message',
            h('quote', { id: session.messageId }),
            `hello，「${res.familyName}」的成员，成功订阅家庭游戏库更新，已获取库存 ${res.libSize} 项${subWish ? `，愿望单 ${res.wishSize} 项` : ''}`
          )
        )
      }
    })
}
