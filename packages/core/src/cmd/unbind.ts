import { CommandBuilder } from '@/cmd/builder'

export default () =>
  new CommandBuilder()
    .setName('unbind')
    .setDescription('remove bind info')
    .addAlias('sbunbind')
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
        const steamAccount =
          await steamService.db.Account.getSteamAccountBySessionUid(session.uid)
        if (!steamAccount) {
          session.sendQueued(session.text('commands.unbind.no-binding'))
          // session.sendQueued(`当前还未绑定 steamID`)
        }
        if (steamAccount.status !== 'un-auth') {
          session.sendQueued(
            session.text('commands.unbind.no-binding', {
              steamId: steamAccount.steamId,
            })
          )
          // session.sendQueued(
          //   `「${steamAccount.steamId}」是经过验证的账户，不应该使用 unbind 指令，应使用 clear 指令`
          // )
          return
        }
        await steamService.db.Account.removeUnAuthAccount(steamAccount.id)
        session.sendQueued(
          session.text('commands.unbind.success', {
            steamId: steamAccount.steamId,
          })
        )
        // session.sendQueued(`成功移除账号信息「${steamAccount.steamId}」`)
      }
    )
