import { CommandBuilder } from '@/cmd/builder'

export default () =>
  new CommandBuilder()
    .setName('slm.unsub')
    .setDescription('remove subscribe info')
    .addAlias('sbunsub')
    .addOption('w', 'subWish:boolean?')
    .addOption('l', 'subLib:boolean?')
    .setExecutor(
      async (render, steam, logger, session, options, input, rawInput) => {
        const account = await steam.db.Account.getSteamAccountBySessionUid(
          session.uid
        )
        if (!account) {
          session.send('你暂未绑定Steam账号，暂时无法进行家庭库订阅/取消操作')
          return
        }
        if (account.status === 'un-auth') {
          session.sendQueued('仅经过验证的用户可以取消家庭库订阅')
          return
        }
        const subscription =
          await steam.db.Subscription.getSubscriptionBySessionUId(session.uid)
        if (!subscription) {
          session.send('没有任何家庭库订阅，暂时无法进行家庭库订阅/取消操作')
          return
        }
        if (!options.l && !options.w) {
          await steam.db.Subscription.removeSubscriptionBySteamId(
            account.steamId
          )
          session.send('成功取消订阅')
        }
        if (!options.l && options.w) {
          await steam.db.Subscription.updateSubscription({
            ...subscription,
            subWishes: false,
          })
          session.send('成功取消愿望单订阅')
        }
      }
    )
