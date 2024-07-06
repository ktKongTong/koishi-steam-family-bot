import { CommandBuilder } from '@/cmd/builder'
import { preferImgStringToEnum } from '@/utils'

export default () =>
  new CommandBuilder()
    .setName('info')
    .setDescription('show steam family subscribe info')
    .addAlias('sbinfo')
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
        const account =
          await steamService.db.Account.getSteamAccountBySessionUid(session.uid)
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
          // session.sendQueued(
          //   `当前账号「${account.steamId}」在该频道暂无订阅信息`
          // )
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
        const familyWishes = familyLibAndWishes.filter(
          (it) => it.type == 'wish'
        )
        // const text =
        //   `当前家庭「${sub.steamFamilyId}」，` +
        //   `库存共计 ${familyLibs.length} 项\n` +
        //   `${sub.subWishes ? `愿望单共计 ${familyWishes.length} 项` : ''}` +
        //   `订阅信息：\n` +
        //   `${sub.subLib ? '✅' : '❌'} 订阅库存信息 \n` +
        //   `${sub.subWishes ? '✅' : '❌'} 订阅愿望单信息\n` +
        //   `游戏封面偏好：${preferImgStringToEnum(sub.preferGameImgType)}`

        const text = session.text('commands.info.info', {
          familyId: sub.steamFamilyId,
          familyLibSize: familyLibs.length,
          familyWishesSize: familyWishes.length,
          subLib: sub.subLib,
          subWishes: sub.subWishes,
          preferImgType: preferImgStringToEnum(sub.preferGameImgType),
        })

        session.sendQueued(text)
      }
    )
