import { Context, Logger } from 'koishi'
import { ISteamService, Config } from '../interface'

// todo
//  this is a command for user that need to remove dirty data
export function ClearCmd(
  ctx: Context,
  cfg: Config,
  logger: Logger,
  steamService: ISteamService
) {
  const clearCmd = ctx
    .command('slm.clear')
    .alias('sbclear')
    .action(async ({ session, options }, input) => {
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        session.sendQueued('你还没有绑定 steam 账户，暂时不需要清除数据')
        return
      }
      if (account.status == 'un-auth') {
        session.sendQueued(
          '没有找到经过验证的 steam 账户，无需使用 clear 指令。如需清除当前账号，使用 unbind 指令'
        )
        return
      }
      await steamService.db.clearAccountInfo(account)
      session.sendQueued(
        `清除完成，已移除账户「${account.accountName}(${account.steamId})」`
      )
      return
    })
}
