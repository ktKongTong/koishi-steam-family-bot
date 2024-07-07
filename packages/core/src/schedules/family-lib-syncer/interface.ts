import {
  SteamAccount,
  SteamAccountFamilyRel,
  SteamFamilyLibSubscribe,
} from '@/db/interface'

export interface DBItem<CHANNEL> {
  account: SteamAccount
  subscription: SteamFamilyLibSubscribe
  steamAndFamilyRel: SteamAccountFamilyRel
  channel: CHANNEL
}
