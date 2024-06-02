import { IAPIService, ISteamFamilyAPI } from './interface'
import { LocalFamilyAPI } from './impls/local'
import { DefaultRemoteFamilyAPI } from './impls/remote'
import { Config } from '../interface'
import { createProxiedAPIService, ServiceWithAPIHelper } from './helper'

interface AccountInfo {
  id: number
  steamId: string
  steamAccessToken: string
  steamRefreshToken: string
  lastRefreshTime: string
}

export class APIService implements IAPIService {
  Steam: ServiceWithAPIHelper<ISteamFamilyAPI>

  private constructor(
    cfg: Config,
    steam?: ISteamFamilyAPI,
    account?: AccountInfo
  ) {
    if (steam) {
      this.Steam = steam as unknown as ServiceWithAPIHelper<ISteamFamilyAPI>
    } else {
      if (cfg.steamDataFetchMode == 'local') {
        this.Steam = new LocalFamilyAPI(
          cfg.SteamHelperAPIHost,
          account?.steamAccessToken
        ) as unknown as ServiceWithAPIHelper<ISteamFamilyAPI>
      } else if (cfg.steamDataFetchMode == 'remote') {
        this.Steam = new DefaultRemoteFamilyAPI(
          cfg.SteamHelperAPIHost
        ) as unknown as ServiceWithAPIHelper<ISteamFamilyAPI>
      }
    }
  }
  private static createWrapperAPIService(instance: APIService) {
    return new Proxy<APIService>(instance, {
      get(target, prop, receiver) {
        const member = target[prop]
        if (member) {
          return createProxiedAPIService(member)
        }
        return undefined
      },
      set(target, property, value, receiver) {
        return false
      },
    })
  }
  static create(account: AccountInfo, config: Config): IAPIService {
    const instance = new APIService(config, undefined, account)
    return APIService.createWrapperAPIService(instance)
  }
  static createWithoutToken(config: Config): IAPIService {
    return APIService.createWrapperAPIService(new APIService(config))
  }
  static createWithProvideAPI(
    config: Config,
    steam: ISteamFamilyAPI
  ): IAPIService {
    return APIService.createWrapperAPIService(new APIService(config, steam))
  }
}
