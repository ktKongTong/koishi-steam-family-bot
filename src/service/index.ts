import { jwtDecode } from 'jwt-decode'
import { now } from 'lodash'
import { Context } from 'koishi'
import { Config } from '../config'
import { DBService } from './db/koishi-impls'
import { IAPIService, ISteamService, SteamAccount, Result } from './interface'
import { APIService } from './api'

export class SteamService extends ISteamService {
  ctx: Context
  cfg: Config
  constructor(ctx: Context, config: Config) {
    const db = new DBService(ctx)
    const api = APIService.createWithoutToken(ctx, config)
    super(db, api)
    this.ctx = ctx
    this.cfg = config
  }

  async createAPIWithCurAccount(
    account: SteamAccount
  ): Promise<Result<IAPIService>> {
    try {
      const res = jwtDecode(account.steamAccessToken)
      const nt = now()
      const needRefresh = (res.exp - 900) * 1000 < nt
      if (needRefresh) {
        await this.renewAccountToken(account)
      }
    } catch (e) {
      return Result.failed(e?.toString())
    }
    const instance = APIService.create(this.ctx, this.cfg, account)
    return Result.success(instance)
  }
}
