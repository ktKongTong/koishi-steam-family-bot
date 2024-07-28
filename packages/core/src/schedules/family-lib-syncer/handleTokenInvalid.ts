import { Logger } from '@/interface/logger'
import { ISteamService, Session, SubscribeInfo } from '@/interface'

export const handleTokenInvalid = async <CHANNEL>(
  logger: Logger,
  item: SubscribeInfo<CHANNEL>,
  session: Session,
  steam: ISteamService<CHANNEL>
) => {
  logger.info(
    `account 「${item.account.id}」steamId「${item.account.steamId}」token is invalid`
  )
  // retry refresh
  const res = await steam.createAPIWithCurAccount(item.account)
  if (!res.isSuccess()) {
    await session.send(
      `steam account 「${item.account.steamId}」token has expired`
    )
    await steam.db.invalidAccount(item.account.id, item.subscription.id)
  }

  // const timesStr = item.account.status.split('.')?.[1]
  // let times = 0
  // if (!timesStr) {
  //   const tmp = parseInt(item.account.status.split('.')?.[1])
  //   if (!Number.isNaN(tmp)) {
  //     times = tmp
  //   }
  // }
  // if (times >= 3) {
  //   await steam.db.clearAccountInfo(item.account)
  //   session.send(
  //     `steam account 「${item.account.steamId}」token has expired, now this account binding and subscription has deleted due to none response`
  //   )
  // } else {

  // }
}
