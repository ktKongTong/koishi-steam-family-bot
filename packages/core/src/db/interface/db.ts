import {
  ISteamAccountDAO,
  ISteamFamilyLibSubscribeDAO,
  ISteamFamilySharedLibDAO,
  SteamAccount,
  SubscribeInfo,
} from './index'

export abstract class IDBService {
  Account: ISteamAccountDAO
  FamilyLib: ISteamFamilySharedLibDAO
  Subscription: ISteamFamilyLibSubscribeDAO
  protected constructor(
    accountDAO: ISteamAccountDAO,
    familyLibDAO: ISteamFamilySharedLibDAO,
    subscriptionDAO: ISteamFamilyLibSubscribeDAO
  ) {
    this.Account = accountDAO
    this.FamilyLib = familyLibDAO
    this.Subscription = subscriptionDAO
  }
  abstract clearAccountInfo(account: SteamAccount): Promise<void>
  abstract getAllSubscription<T>(): Promise<SubscribeInfo<T>[]>
  abstract invalidAccount(id: number, subId: number): Promise<void>
}
