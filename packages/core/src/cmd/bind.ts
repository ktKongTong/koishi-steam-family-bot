import { CommandBuilder } from '@/cmd/builder'
import SteamID from 'steamid'
const cmd = new CommandBuilder()
  .setName('slm.bind')
  .setDescription('bind to an steamid without auth')
  .addAlias('sbbind')
  .setExecutor(
    async (render, steamService, logger, session, options, input, rawInput) => {
      const steamAccount =
        await steamService.db.Account.getSteamAccountBySteamId(input)
      // platform.getSessionInfo
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
        session.getSessionInfo()
      )
      session.sendQueued(`成功新增账号「${input}」`)
    }
  )

export default () => cmd
