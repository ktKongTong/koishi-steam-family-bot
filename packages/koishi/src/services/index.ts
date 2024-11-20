import { Context } from 'koishi'
import { DBService } from '@/db/koishi-impls'

import {
  APIService,
  IAPIService,
  Result,
  Config,
  ISteamService,
  SteamAccount,
  tokenNeedRefresh,
} from 'steam-family-bot-core'

export class SteamService<T> extends ISteamService<T> {
  ctx: Context
  cfg: Config
  constructor(ctx: Context, config: Config) {
    const db = new DBService<T>(ctx)
    // @ts-ignore
    const logger = ctx.logger('slm')
    const api = APIService.createWithoutToken(config, logger)
    super(db, api)
    this.ctx = ctx
    this.cfg = config
  }

  async createAPIWithCurAccount(
    account: SteamAccount
  ): Promise<Result<IAPIService>> {
    // @ts-ignore
    const logger = this.ctx.logger('slm')
    try {
      const needRefresh = tokenNeedRefresh(account.steamAccessToken)
      if (needRefresh) {
        await this.renewAccountToken(account)
      }
    } catch (e) {
      return Result.failed(e?.toString())
    }
    const instance = APIService.create(account, this.cfg, logger)
    return Result.success(instance)
  }
}
