import { CommandBuilder } from '@/cmd/builder'

export default () =>
  new CommandBuilder()
    .setName('unbind')
    .setDescription('remove bind info')
    .addAlias('sbunbind')
    .setExecutor(async (c) => {
      const { steamService, session } = c
      const steamAccount =
        await steamService.db.Account.getSteamAccountBySessionUid(session.uid)
      if (!steamAccount) {
        await session.sendQueued(session.text('commands.unbind.no-binding'))
      }
      if (steamAccount.status !== 'un-auth') {
        await session.sendQueued(
          session.text('commands.unbind.no-binding', {
            steamId: steamAccount.steamId,
          })
        )
        return
      }
      await steamService.db.Account.removeUnAuthAccount(steamAccount.id)
      await session.sendQueued(
        session.text('commands.unbind.success', {
          steamId: steamAccount.steamId,
        })
      )
    })
