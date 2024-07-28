import { CommandBuilder } from '@/cmd/builder'

export default () =>
  new CommandBuilder()
    .setName('unsub')
    .setDescription('remove subscribe info')
    .addAlias('sbunsub')
    .addOption('w', 'subWish:boolean?')
    .addOption('l', 'subLib:boolean?')
    .setExecutor(async (c) => {
      const { steamService: steam, session, options } = c
      const account = await steam.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        session.sendQueued(session.text('commands.unsub.no-binding'))
        return
      }
      if (account.status === 'un-auth') {
        session.sendQueued(session.text('commands.unsub.no-auth'))
        return
      }
      const subscription =
        await steam.db.Subscription.getSubscriptionBySessionUId(session.uid)
      if (!subscription) {
        session.sendQueued(session.text('commands.unsub.no-sub'))
        return
      }
      if (!options.l && !options.w) {
        await steam.db.Subscription.removeSubscriptionBySteamId(account.steamId)
        session.sendQueued(session.text('commands.unsub.success'))
      }
      if (!options.l && options.w) {
        await steam.db.Subscription.updateSubscription({
          ...subscription,
          subWishes: false,
        })
        session.sendQueued(session.text('commands.unsub.unsub-wishes-success'))
      }
    })
