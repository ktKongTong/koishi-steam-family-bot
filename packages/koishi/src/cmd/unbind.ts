import { Context, Logger } from 'koishi'
import { Config, ISteamService } from 'steam-family-bot-core'

export function UnBindCmd(
  ctx: Context,
  cfg: Config,
  logger: Logger,
  steamService: ISteamService
) {
  const log = logger.extend('unbind')
  const subcmd = ctx
    .command('slm.unbind')
    .alias('sbunbind')
    .action(async ({ session, options }, input) => {
      const steamAccount =
        await steamService.db.Account.getSteamAccountBySessionUid(session.uid)
      if (!steamAccount) {
        session.sendQueued(`当前还未绑定 steamID`)
      }
      if (steamAccount.status !== 'un-auth') {
        session.sendQueued(
          `「${steamAccount.steamId}」是经过验证的账户，不应该使用 unbind 指令，应使用 clear 指令`
        )
        return
      }
      await steamService.db.Account.removeUnAuthAccount(steamAccount.id)

      session.sendQueued(`成功移除账号信息「${steamAccount.steamId}」`)
    })
}
