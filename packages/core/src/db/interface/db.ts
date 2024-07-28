import {
  ISteamAccountDAO,
  ISteamFamilyLibSubscribeDAO,
  ISteamFamilySharedLibDAO,
  SteamAccount,
  SubscribeInfo,
} from './index'

export abstract class IDBService<T> {
  Account: ISteamAccountDAO<T>
  FamilyLib: ISteamFamilySharedLibDAO
  Subscription: ISteamFamilyLibSubscribeDAO<T>
  protected constructor(
    accountDAO: ISteamAccountDAO<T>,
    familyLibDAO: ISteamFamilySharedLibDAO,
    subscriptionDAO: ISteamFamilyLibSubscribeDAO<T>
  ) {
    this.Account = accountDAO
    this.FamilyLib = familyLibDAO
    this.Subscription = subscriptionDAO
  }
  abstract clearAccountInfo(account: SteamAccount): Promise<void>
  abstract getAllSubscription(): Promise<SubscribeInfo<T>[]>
  abstract invalidAccount(id: number, subId: number): Promise<void>
}
