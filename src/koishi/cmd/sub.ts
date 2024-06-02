import { Context, h, Logger } from 'koishi'
import { ISteamService, Config } from '../interface'

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
    .option('w', '<subWish:boolean>')
    .option('l', '<subLib:boolean>')
    .action(async ({ session, options }, input) => {
      const subWish = options.w ?? false
      const subLib = options.l ?? true
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        session.sendQueued(
          '你暂未绑定Steam账号，无法获取家庭信息，暂时无法进行家庭库订阅'
        )
        return
      }
      // if (accounts.length > 1) {
      //   session.sendQueued('你当前绑定多个账号，请输入序号选择 steam 账号进行家庭库订阅')
      //   const res = await session.prompt(30 * 1000)
      // }
      const valid = await steamService.validAccount(account)
      if (!valid) {
        session.sendQueued(
          '当前账号的 token 已失效，若需继续使用，请通过 renew 指令更新该账号的 token'
        )
        return
      }
      const res = await steamService.subscribeFamilyLibByAccount(
        account,
        {
          uid: session.uid,
          channelId: session.channelId,
          selfId: session.selfId,
          platform: session.platform,
        },
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
    })
}
