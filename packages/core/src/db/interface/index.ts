import {
  GameInfo,
  SteamAccount,
  SteamAccountFamilyRel,
  SteamFamilyLib,
  SteamFamilyLibSubscribe,
  SteamRelateChannelInfo,
} from './tables'

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export * from './db'
export * from './tables'

export type SteamAccountWithFamilyId = SteamAccount & {
  familyId?: string
}

export interface ISteamAccountDAO<T> {
  getAuthedSteamAccountByFamilyId(
    familyId: string
  ): Promise<SteamAccountWithFamilyId>
  getSteamAccountBySessionUid(
    uid: string
  ): Promise<SteamAccountWithFamilyId & { channel: SteamRelateChannelInfo<T> }>
  getSteamAccountBySteamId(steamid: string): Promise<SteamAccountWithFamilyId>
  getSteamAccountBySteamIdAndSessionId(
    steamid: string,
    uid: string
  ): Promise<SteamAccountWithFamilyId>
  upsertSteamAccount(
    account: Partial<SteamAccount>,
    channelInfo: any
  ): Promise<void>
  updateSteamAccountToken(
    accountId: number,
    account: Partial<SteamAccount>
  ): Promise<void>
  invalidAccount(id: number): Promise<void>
  removeUnAuthAccount(accountId: number): Promise<void>
}

export interface ISteamFamilySharedLibDAO {
  refreshLibByFamilyId(
    familyId: string,
    dbContent: SteamFamilyLib[],
    withWishes?: boolean
  ): Promise<void>
  getSteamFamilyLibByFamilyId(
    familyId: string,
    type?: 'lib' | 'wish'
  ): Promise<(SteamFamilyLib & { info: GameInfo })[]>
  getUnSyncedLib(limit?: number): Promise<SteamFamilyLib[]>
  getLibByKeywordAndFamilyId(
    familyId: string,
    queryKey: string
  ): Promise<SteamFamilyLib[]>
  getFamilyWishes(familyId: string): Promise<SteamFamilyLib[]>
  batchRemoveByAppIdAndFamilyId(
    steamFamilyId: string,
    numbers: number[],
    type?: 'lib' | 'wish'
  ): Promise<void>
  batchUpsertFamilyLib(libs: Partial<SteamFamilyLib>[]): Promise<void>
  batchUpsertLibInfo(
    infos: PartialBy<GameInfo, 'aliases' | 'top20Tags'>[]
  ): Promise<void>
}

export interface ISteamFamilyLibSubscribeDAO<T> {
  getSubscriptionBySessionUId(uid: string): Promise<SteamFamilyLibSubscribe>
  removeSubscriptionBySessionUId(uid: string): Promise<void>
  removeSubscriptionBySteamId(uid: string): Promise<void>
  updateSubscription(sub: SteamFamilyLibSubscribe): Promise<void>
  inactiveSubscription(subId: number): Promise<void>
  getSubscriptionByChannelInfoAndFamilyId(
    familyId: string,
    channelInfo: T
  ): Promise<SteamFamilyLibSubscribe>
  addSubscription(
    sub: Partial<SteamFamilyLibSubscribe>,
    channelInfo: T
  ): Promise<void>
  addFamilyAccountRel(items: SteamAccountFamilyRel[]): Promise<void>
}
