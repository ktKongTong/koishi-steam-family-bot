import { CommandBuilder } from '@/cmd/builder'
import { preferImgStringToEnum } from '@/utils'

export default () =>
  new CommandBuilder()
    .setName('info')
    .setDescription('show steam family subscribe info')
    .addAlias('sbinfo')
    .setExecutor(async (c) => {
      const { steamService, logger, session } = c
      const account = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        await session.sendQueued(session.text('commands.info.no-binding'))
        return
      }
      const sub =
        await steamService.db.Subscription.getSubscriptionByChannelInfoAndFamilyId(
          account.familyId,
          session.getSessionInfo()
        )
      if (!sub) {
        await session.sendQueued(
          session.text('commands.info.no-sub-in-channel', {
            steamId: account.steamId,
          })
        )
        return
      }
      const familyLibAndWishes =
        await steamService.db.FamilyLib.getSteamFamilyLibByFamilyId(
          sub.steamFamilyId
        )
      const familyLibs = familyLibAndWishes.filter((it) => it.type == 'lib')
      const familyWishes = familyLibAndWishes.filter((it) => it.type == 'wish')

      const text = session.text('commands.info.info', {
        familyId: sub.steamFamilyId,
        familyLibSize: familyLibs.length,
        familyWishesSize: familyWishes.length,
        subLib: sub.subLib,
        subWishes: sub.subWishes,
        preferGameImgType: preferImgStringToEnum(sub.preferGameImgType),
      })

      session.sendQueued(text)
    })
