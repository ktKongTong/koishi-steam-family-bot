import {
  CFamilyGroups_GetSharedLibraryApps_Response_SharedApp,
  FamilyGroupMember,
  StoreItem,
  CPlayer_GetPlayerLinkDetails_Response_PlayerLinkDetails_AccountPublicData,
} from 'node-steam-family-group-api'

export type Player = FamilyGroupMember &
  CPlayer_GetPlayerLinkDetails_Response_PlayerLinkDetails_AccountPublicData & {
    avatar_hash: string
  }

export type App = CFamilyGroups_GetSharedLibraryApps_Response_SharedApp & {
  detail: StoreItem
} & { owners: Player[] } & { playtime?: any }
