import { IAPIService, ISteamFamilyAPI } from './interface'
import { LocalFamilyAPI } from './impls/local'
import { DefaultRemoteFamilyAPI } from './impls/remote'
import { Config } from '../interface'
import { Logger } from '@/interface/logger'

interface AccountInfo {
  id: number
  steamId: string
  steamAccessToken: string
  steamRefreshToken: string
  lastRefreshTime: string
}

export class APIService implements IAPIService {
  Steam: ISteamFamilyAPI

  private constructor(
    cfg: Config,
    steam?: ISteamFamilyAPI,
    account?: AccountInfo,
    logger?: Logger
  ) {
    if (steam) {
      this.Steam = steam
    } else {
      if (cfg.steamDataFetchMode == 'local') {
        this.Steam = new LocalFamilyAPI(
          cfg.SteamHelperAPIHost,
          logger,
          account?.steamAccessToken
        )
      } else if (cfg.steamDataFetchMode == 'remote') {
        this.Steam = new DefaultRemoteFamilyAPI(cfg.SteamHelperAPIHost, logger)
      }
    }
  }

  static create(
    account: AccountInfo,
    config: Config,
    logger: Logger
  ): IAPIService {
    const instance = new APIService(config, undefined, account, logger)
    return instance
  }
  static createWithoutToken(config: Config, logger: Logger): IAPIService {
    return new APIService(config, undefined, undefined, logger)
  }
  static createWithProvideAPI(
    config: Config,
    steam: ISteamFamilyAPI,
    logger: Logger
  ): IAPIService {
    return new APIService(config, steam, undefined, logger)
  }
}
