import { ISteamFamilyAPI, ProxiedAPIResponse } from '../interface'
import {
  CFamilyGroups_GetPlaytimeSummary_Response,
  CFamilyGroups_GetSharedLibraryApps_Response,
  CPlayer_GetPlayerLinkDetails_Response,
  CStoreBrowse_GetItems_Response,
  PartialMessage,
} from 'node-steam-family-group-api'
import { GameBaseInfoResp } from '@/interface'
import { createFetch, Fetch } from '@/utils/fetch'
import { Logger } from '@/interface/logger'

export class DefaultRemoteFamilyAPI extends ISteamFamilyAPI {
  f: Fetch
  constructor(steamHelperAPIHost: string, logger: Logger) {
    super()
    this.f = createFetch(logger).extend({
      baseURL: `${steamHelperAPIHost}/api/steam`,
    })
  }

  getFamilyMembers(
    memberIds: string[],
    token?: string
  ): Promise<ProxiedAPIResponse<CPlayer_GetPlayerLinkDetails_Response>> {
    return this.f.get(`/player/${memberIds.join(',')}`, {
      query: {
        access_token: token,
      },
    })
  }

  getPlaytimeSummary(
    familyGroupid: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetPlaytimeSummary_Response>> {
    return
  }

  getSteamFamilyGroup(token?: string, steamId?: bigint) {
    return this.f.get(`/family`, {
      query: {
        access_token: token,
      },
    })
  }

  getSteamFamilyGroupLibs(
    familyId: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetSharedLibraryApps_Response>> {
    return this.f.get(`/family/shared/${familyId}`, {
      query: {
        access_token: token,
      },
    })
  }

  getSteamItems(
    appIds: string[]
  ): Promise<ProxiedAPIResponse<CStoreBrowse_GetItems_Response>> {
    return this.f.get(`/items/${appIds.join(',')}`)
  }

  getSteamItemsBaseInfo(
    appIds: number[]
  ): Promise<ProxiedAPIResponse<GameBaseInfoResp>> {
    return this.f.get(`/info/${appIds.join(',')}`)
  }
}
