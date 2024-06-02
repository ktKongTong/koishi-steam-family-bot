export interface SteamAccount {
  id: number
  accountName: string
  familyId: string
  steamId: string
  steamAccessToken: string
  steamRefreshToken: string
  lastRefreshTime: string
  valid: string
}

export interface GameInfo {
  appid: number
  name: string
  aliases: string
  top20tags: string
  lastRefreshedAt: number
}

export interface SteamFamilyLib {
  rtTimeAcquired: number
  familyId: string
  name?: string
  appId: number
  steamIds: string
  type: 'lib' | 'wish'
  lastModifiedAt: number
}
export interface SteamFamilyLibSubscribe {
  id: number
  steamFamilyId: string
  steamAccountId: string
  accountId: number
  subLib: boolean
  subWishes: boolean
  active: boolean
}

export interface SubscribeInfo<T> {
  account: SteamAccount
  subscription: SteamFamilyLibSubscribe
  channel: T
}
export type SteamRelateChannelInfo<T> = {
  // reference to steamAccount or subscription
  refId: number
  type: 'account' | 'sub'
} & T
