import { ScheduleTaskCtx } from '@/interface/schedule'

export const tokenRefresh = async <CHANNEL>(c: ScheduleTaskCtx<CHANNEL>) =>
  // async () =>
  {
    const { steam, botService, config, logger } = c
    logger.info('trigger token refresher')
    const accounts = await steam.db.Account.getAllSteamAccount()
    const invalidAccount = accounts.filter(
      (account) => account.status === 'invalid'
    )

    for (const account of invalidAccount) {
      try {
        await steam.renewAccountToken(account)
        logger.info(`token for 「${account.steamId} refreshed successfully`)
      } catch (e) {
        logger.info(`token for 「${account.steamId}」 refreshed failed`, e)
      }
    }
  }
