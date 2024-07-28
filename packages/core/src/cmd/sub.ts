import { PreferGameImgType } from '@/interface'
import { CommandBuilder } from '@/cmd/builder'
import { preferImgStringToEnum } from '@/utils'

export default () =>
  new CommandBuilder()
    .setName('sub')
    .setDescription('subscribe steam family update')
    .addAlias('sbsub')
    .addOption('img', 'preferImg:string?')
    .addOption('w', 'subWish:boolean?')
    .addOption('l', 'subLib:boolean?')
    .setExecutor(async (c) => {
      const { render, steamService, logger, session, options } = c
      const subWish = options.w ?? false
      const subLib = options.l ?? true
      const preferGameImgType = preferImgStringToEnum(options.img)
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        session.sendQueued(session.text('commands.subscribe.no-binding'))
        return
      }
      if (account.status === 'un-auth') {
        session.sendQueued(session.text('commands.subscribe.no-auth'))
        return
      }
      const valid = await steamService.validAccount(account)
      if (!valid) {
        session.sendQueued(session.text('commands.subscribe.invalid-token'))
        return
      }
      const subscription =
        await steamService.db.Subscription.getSubscriptionByChannelInfoAndFamilyId(
          account.familyId,
          session.getSessionInfo()
        )
      if (subscription) {
        await steamService.db.Subscription.updateSubscription({
          ...subscription,
          steamFamilyId: account.familyId,
          subWishes: subWish,
          subLib,
          active: true,
          preferGameImgType,
        })
        const familyLibAndWishes =
          await steamService.db.FamilyLib.getSteamFamilyLibByFamilyId(
            account.familyId
          )
        const familyLibs = familyLibAndWishes.filter((it) => it.type == 'lib')
        const familyWishes = familyLibAndWishes.filter(
          (it) => it.type == 'wish'
        )
        const text = session.text('commands.subscribe.update-success', {
          familyId: account.familyId,
          familyLibSize: familyLibs.length,
          familyWishesSize: familyWishes.length,
          subLib: subLib,
          subWishes: subWish,
          preferGameImgType: preferGameImgType,
        })
        await session.sendQueued(text)
      } else {
        const res = await steamService.subscribeFamilyLibByAccount(
          account,
          session.getSessionInfo(),
          preferGameImgType,
          subLib,
          subWish
        )

        await session.sendQuote(
          session.text('commands.subscribe.subscribe-success', {
            familyName: res.familyName,
            familyLibSize: res.libSize,
            familyWishesSize: res.wishSize,
            subLib: subLib,
            subWishes: subWish,
            preferGameImgType: preferGameImgType,
          })
        )
      }
    })
