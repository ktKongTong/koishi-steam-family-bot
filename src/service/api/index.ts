import { Context } from 'koishi'
import { Config } from '../../config'
import { IAPIService, ISteamFamilyAPI } from './interface'
import { LocalFamilyAPI } from './impls/local'
interface AccountInfo {
  id: number
  steamId: string
  steamAccessToken: string
  steamRefreshToken: string
  lastRefreshTime: string
}

export class APIService implements IAPIService {
  Steam: ISteamFamilyAPI

  private constructor(ctx: Context, cfg: Config, account?: AccountInfo) {
    this.Steam = new LocalFamilyAPI(account?.steamAccessToken)
  }

  static create(ctx: Context, cfg: Config, account: AccountInfo): IAPIService {
    return new APIService(ctx, cfg, account)
  }
  static createWithoutToken(ctx: Context, cfg: Config): IAPIService {
    return new APIService(ctx, cfg)
  }
}
