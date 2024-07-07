import { CommandBuilder } from '@/cmd/builder'
import SteamID from 'steamid'
const cmd = new CommandBuilder()
  .setName('bind')
  .setDescription('bind to an steamid without auth')
  .addAlias('sbbind')
  .setExecutor(async (c) => {
    const { steamService, logger, session, options, input } = c
    const steamAccount =
      await steamService.db.Account.getSteamAccountBySteamId(input)
    if (steamAccount) {
      session.sendQueued(
        session.text('commands.bind.conflict', { steamId: input })
      )
      return
    }
    const id = new SteamID(input)
    if (!id.isValid()) {
      session.sendQueued(session.text('commands.bind.not-steamid', { input }))
      return
    }
    const account = await steamService.db.Account.getSteamAccountBySessionUid(
      session.uid
    )
    if (account && account.status !== 'un-auth') {
      session.sendQueued(
        session.text('commands.bind.bind-auth', { steamId: account.steamId })
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
    session.sendQueued(
      session.text('commands.bind.bind-success', { steamId: input })
    )
  })

export default () => cmd
