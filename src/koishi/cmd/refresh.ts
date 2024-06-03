import { Context, h, Logger } from 'koishi'
import { ISteamService, Config } from '../interface'

// todo
//  this is a command for user that need to remove dirty data
export function refreshCmd(
  ctx: Context,
  cfg: Config,
  logger: Logger,
  steamService: ISteamService
) {
  const log = logger.extend('subscribe')
  const subcmd = ctx
    .command('slm.refresh')
    .alias('sbrefresh')
    .option('w', '<wish:boolean>')
    .action(async ({ session, options }, input) => {
      try {
        const account =
          await steamService.db.Account.getSteamAccountBySessionUid(session.uid)
        if (!account) {
          session.sendQueued('你还没有绑定 steam 账户，暂时不需要刷新数据')
          return
        }

        if (account.status == 'un-auth') {
          session.sendQueued('你还没有绑定经过验证的 steam 账户，无法刷新数据')
          return
        }

        const valid = await steamService.validAccount(account)
        if (!valid) {
          session.sendQueued(
            '当前账号的 token 已失效，若需继续使用，请通过 renew 指令更新该账号的 token'
          )
          return
        }
        const res = await steamService.refreshFamilyLibByAccount(
          account,
          options.w ?? false
        )
        session.sendQueued(
          `家庭「${res.familyId}」库存刷新成功，共 ${res.libSize} 项${options.w ? `，愿望单 ${res.wishSize} 项` : ''}`
        )
        return
      } catch (e) {
        logger.error(`refresh lib failed, ${e}`)
        session.sendQueued('刷新失败，原因未知，如有需要请检查日志')
      }
    })
}
