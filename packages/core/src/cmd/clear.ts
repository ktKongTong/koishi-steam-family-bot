import { ISteamService, Session } from '@/interface'
import { CommandBuilder } from '@/cmd/builder'

// todo
//  this is a command for user that need to remove dirty data
export default () =>
  new CommandBuilder()
    .setName('clear')
    .setDescription('clear an auth account relate info')
    .addAlias('sbclear')
    .setExecutor(async (c) => {
      const { steamService, logger, session, options, input } = c
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        session.sendQueued(session.text('commands.clear.no-binding'))
        return
      }
      if (account.status == 'un-auth') {
        session.sendQueued(session.text('commands.clear.no-auth-binding'))
        return
      }
      await steamService.db.clearAccountInfo(account)
      session.sendQueued(
        session.text('commands.clear.clear-success', {
          accountName: account.accountName,
          accountId: account.steamId,
        })
      )
      return
    })
