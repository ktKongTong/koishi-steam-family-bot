import { CommandBuilder } from '@/cmd/builder'

// todo
//  this is a command for user that need to remove dirty data
export default () =>
  new CommandBuilder()
    .setName('refresh')
    .addAlias('sbrefresh')
    .setDescription('refresh family lib info')
    .addOption('w', 'wish:boolean?')
    .setExecutor(
      async (
        render,
        steamService,
        logger,
        session,
        options,
        input,
        rawInput
      ) => {
        try {
          const account =
            await steamService.db.Account.getSteamAccountBySessionUid(
              session.uid
            )
          if (!account) {
            session.sendQueued(session.text('commands.refresh.no-binding'))
            return
          }

          if (account.status == 'un-auth') {
            session.sendQueued(session.text('commands.refresh.no-auth-binding'))
            return
          }

          const valid = await steamService.validAccount(account)
          if (!valid) {
            session.sendQueued(session.text('commands.refresh.token-invalid'))
            return
          }
          const res = await steamService.refreshFamilyLibByAccount(
            account,
            options.w ?? false
          )
          // session.sendQueued(
          //   `家庭「${res.familyId}」库存刷新成功，共 ${res.libSize} 项${options.w ? `，愿望单 ${res.wishSize} 项` : ''}`
          // )
          session.sendQueued(
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
          session.sendQueued(session.text('commands.refresh.error'))
        }
      }
    )
