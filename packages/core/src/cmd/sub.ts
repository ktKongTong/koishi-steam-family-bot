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
        const subWish = options.w ?? false
        const subLib = options.l ?? true
        let preferGameImgType = PreferGameImgType.Library2X
        switch (options.img) {
          case 'main':
            preferGameImgType = PreferGameImgType.Main
            break
          case 'small':
            preferGameImgType = PreferGameImgType.Small
            break
          case 'library':
            preferGameImgType = PreferGameImgType.Library
            break
          case 'library2x':
            preferGameImgType = PreferGameImgType.Library2X
            break
          case 'header':
            preferGameImgType = PreferGameImgType.Header
            break
        }
        const account =
          await steamService.db.Account.getSteamAccountBySessionUid(session.uid)
        if (!account) {
          session.sendQueued(session.text('commands.subscribe.no-binding'))
          // session.sendQueued(
          //   '你暂未绑定Steam账号，无法获取家庭信息，暂时无法进行家庭库订阅'
          // )
          return
        }
        if (account.status === 'un-auth') {
          session.sendQueued(session.text('commands.subscribe.no-auth'))
          // session.sendQueued('仅经过验证的用户可以进行家庭库订阅修改操作')
          return
        }
        const valid = await steamService.validAccount(account)
        if (!valid) {
          session.sendQueued(session.text('commands.subscribe.invalid-token'))
          // session.sendQueued(
          //   '当前账号的 token 已失效，若需继续使用，请通过 login 指令更新该账号的 token'
          // )
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
          //           const text =
          //             `成功更新订阅信息，家庭「${account.familyId}」订阅信息：
          // ${subLib ? '✅' : '❌'} 订阅库存信息${subLib ? `，共计 ${familyLibs.length} 项`:''}
          // ${subWish ? '✅' : '❌'} 订阅愿望单信息${subWish ? `，共计 ${familyWishes.length} 项`:''}
          // 游戏封面偏好：${preferImgStringToEnum(preferGameImgType)}`
          //           session.sendQueued(text)
          const text = session.text('commands.subscribe.update-success', {
            familyId: account.familyId,
            familyLibSize: familyLibs.length,
            familyWishesSize: familyWishes.length,
            subLib: subLib,
            subWishes: subWish,
            preferImgType: preferImgStringToEnum(preferGameImgType),
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
            session.text('commands.subscribe.update-success', {
              familyId: account.familyId,
              familyLibSize: res.libSize,
              familyWishesSize: res.wishSize,
              subLib: subLib,
              subWishes: subWish,
              preferImgType: preferImgStringToEnum(preferGameImgType),
            })
          )
        }
      }
    )
