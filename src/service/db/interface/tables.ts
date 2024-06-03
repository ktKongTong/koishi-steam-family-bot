export enum PreferGameImgType {
  Header = 'header',
  Main = 'mainCapsule',
  Small = 'smallCapsule',
  Library = 'libraryCapsule',
  Library2X = 'libraryCapsule2x',
  Hero = 'heroCapsule',
  Hero2X = 'heroCapsule2x',
  LibHero = 'libraryHero',
  LibHero2x = 'libraryHero2x',
}

export interface SteamAccount {
  id: number
  accountName: string
  steamId: string
  steamAccessToken: string
  steamRefreshToken: string
  lastRefreshTime: string
  status: string
}

export interface SteamAccountFamilyRel {
  steamId: string
  // accountName: string
  familyId: string
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
  preferGameImgType: string
  active: boolean
}

export interface GameInfo {
  appid: number
  name: string
  aliases: string
  top20Tags: string
  lastRefreshedAt: number
}

export interface SubscribeInfo<T> {
  account: SteamAccount
  steamAndFamilyRel: SteamAccountFamilyRel
  subscription: SteamFamilyLibSubscribe
  channel: T
}
export type SteamRelateChannelInfo<T> = {
  // reference to steamAccount or subscription
  refId: number
  type: 'account' | 'sub'
} & T
