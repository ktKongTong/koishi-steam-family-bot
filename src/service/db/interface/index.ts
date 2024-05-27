import {
  GameInfo,
  SteamAccount,
  SteamFamilyLib,
  SteamFamilyLibSubscribe,
} from './tables'

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export * from './db'
export * from './tables'
export interface ISteamAccountDAO {
  getSteamAccountBySessionUid(uid: string): Promise<SteamAccount>
  getSteamAccountBySteamId(steamid: string): Promise<SteamAccount>
  getSteamAccountBySteamIdAndSessionId(
    steamid: string,
    uid: string
  ): Promise<SteamAccount>
  upsertSteamAccount(
    account: Partial<SteamAccount>,
    channelInfo: any
  ): Promise<void>
  updateSteamAccountToken(
    accountId: number,
    account: Partial<SteamAccount>
  ): Promise<void>
  invalidAccount(id: number): Promise<void>
}

export interface ISteamFamilySharedLibDAO {
  refreshLibByFamilyId(
    familyId: string,
    dbContent: SteamFamilyLib[],
    withWishes?: boolean
  ): Promise<void>
  getSteamFamilyLibByFamilyId(
    uid: string
  ): Promise<(SteamFamilyLib & { info: GameInfo })[]>
  getUnSyncedTagLib(): Promise<SteamFamilyLib[]>
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
    infos: PartialBy<GameInfo, 'aliases' | 'tags'>[]
  ): Promise<void>
}

export interface ISteamFamilyLibSubscribeDAO {
  getSubscriptionBySessionUId(uid: string): Promise<SteamFamilyLibSubscribe>
  removeSubscriptionBySessionUId(uid: string): Promise<void>
  removeSubscriptionBySteamId(uid: string): Promise<void>
  updateSubscription(sub: SteamFamilyLibSubscribe): Promise<void>
  inactiveSubscription(subId: number): Promise<void>
  getSubscriptionByChannelInfoAndFamilyId<T>(
    familyId: string,
    channelInfo: T
  ): Promise<SteamFamilyLibSubscribe>
  addSubscription<T>(
    sub: Partial<SteamFamilyLibSubscribe>,
    channelInfo: T
  ): Promise<void>
}
