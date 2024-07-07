import { Logger } from '@/interface/logger'
import { ISteamService, Session } from '@/interface'

export const handleTokenInvalid = async <CHANNEL>(
  logger: Logger,
  item,
  session: Session,
  steam: ISteamService<CHANNEL>
) => {
  logger.info(
    `account 「${item.account.id}」steamId「${item.account.steamId}」token is invalid`
  )
  const timesStr = item.account.status.split('.')?.[1]
  let times = 0
  if (!timesStr) {
    const tmp = parseInt(item.account.status.split('.')[1])
    if (!Number.isNaN(tmp)) {
      times = tmp
    }
  }
  if (times >= 3) {
    await steam.db.clearAccountInfo(item.account)
    session.send(
      `steam account 「${item.account.steamId}」token has expired, now this account binding and subscription has deleted due to none response`
    )
  } else {
    session.send(
      `steam account 「${item.account.steamId}」token has expired, please dm me and follow the instruction with [renew] cmd to refresh it`
    )
    await steam.db.invalidAccount(item.account.id, item.subscription)
  }
}
