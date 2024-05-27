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
  tags: string
  aliases: string
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
export type SteamRelateChannelInfo = {
  // reference to steamAccount or subscription
  refId: number
  type: 'account' | 'sub'
} & ChannelInfo

export interface ChannelInfo {
  uid: string
  channelId: string
  selfId: string
  platform: string
}
