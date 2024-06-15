import { Context } from 'koishi'
import { DBService } from '../db/koishi-impls'
import { jwtDecode } from '@/service/utils/jwt'
import { now } from 'lodash'
import { APIService } from '@/service'
import {
  IAPIService,
  Result,
  Config,
  ISteamService,
  SteamAccount,
} from '@/service'

export class SteamService extends ISteamService {
  ctx: Context
  cfg: Config
  constructor(ctx: Context, config: Config) {
    const db = new DBService(ctx)
    const api = APIService.createWithoutToken(config)
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
    const instance = APIService.create(account, this.cfg)
    return Result.success(instance)
  }
}
