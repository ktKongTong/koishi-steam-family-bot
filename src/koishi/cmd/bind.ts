import { Context, Logger } from 'koishi'
import { Config, ISteamService } from '../../service'
import SteamID from 'steamid'

export function BindCmd(
  ctx: Context,
  cfg: Config,
  logger: Logger,
  steamService: ISteamService
) {
  const log = logger.extend('bind')
  const subcmd = ctx
    .command('slm.bind')
    .alias('sbbind')
    .action(async ({ session, options }, input) => {
      const steamAccount =
        await steamService.db.Account.getSteamAccountBySteamId(input)
      if (steamAccount) {
        session.sendQueued(`「${input}」已被绑定`)
        return
      }
      const id = new SteamID(input)
      if (!id.isValid()) {
        session.sendQueued(`「${input}」似乎不是一个 steamID`)
        return
      }
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (account && account.status !== 'un-auth') {
        session.sendQueued(
          `你当前已经绑定了一个经过验证的账号「${account.steamId}」，目前还不支持多账号绑定。`
        )
        return
      }
      await steamService.db.Account.upsertSteamAccount(
        {
          accountName: '',
          steamId: input,
          lastRefreshTime: new Date().getTime().toFixed(),
          status: 'un-auth',
        },
        {
          uid: session.uid,
          channelId: session.channelId,
          selfId: session.selfId,
          platform: session.platform,
        }
      )

      session.sendQueued(`成功新增账号「${input}」`)
    })
}
