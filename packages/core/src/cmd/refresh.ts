import { CommandBuilder } from '@/cmd/builder'

// todo
//  this is a command for user that need to remove dirty data
export default () =>
  new CommandBuilder()
    .setName('refresh')
    .addAlias('sbrefresh')
    .setDescription('refresh family lib info')
    .addOption('w', 'wish:boolean?')
    .setExecutor(async (c) => {
      const { steamService, logger, session, options } = c
      try {
        const account =
          await steamService.db.Account.getSteamAccountBySessionUid(session.uid)
        if (!account) {
          await session.sendQueued(session.text('commands.refresh.no-binding'))
          return
        }

        if (account.status == 'un-auth') {
          await session.sendQueued(
            session.text('commands.refresh.no-auth-binding')
          )
          return
        }

        const valid = await steamService.validAccount(account)
        if (!valid) {
          await session.sendQueued(
            session.text('commands.refresh.token-invalid')
          )
          return
        }
        const res = await steamService.refreshFamilyLibByAccount(
          account,
          options.w ?? false
        )
        await session.sendQueued(
          session.text('commands.refresh.refresh-success', {
            familyId: res.familyId,
            libSize: res.libSize,
            wishes: options.w,
            wishesSize: res.wishSize,
          })
        )
        return
      } catch (e) {
        logger.error(`refresh lib failed, ${e}`)
        await session.sendQueued(session.text('commands.refresh.error'))
      }
    })
