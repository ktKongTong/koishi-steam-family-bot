import { ISteamFamilyAPI, ProxiedAPIResponse } from '../interface'
import {
  CFamilyGroups_GetPlaytimeSummary_Response,
  CFamilyGroups_GetSharedLibraryApps_Response,
  CPlayer_GetPlayerLinkDetails_Response,
  CStoreBrowse_GetItems_Response,
  PartialMessage,
} from 'node-steam-family-group-api'
import { GameBaseInfoResp } from '@/interface'

export class DefaultRemoteFamilyAPI extends ISteamFamilyAPI {
  remoteHost: string
  constructor(steamHelperAPIHost: string) {
    super()
    this.remoteHost = `${steamHelperAPIHost}/api/steam`
  }

  getFamilyMembers(
    memberIds: string[],
    token?: string
  ): Promise<ProxiedAPIResponse<CPlayer_GetPlayerLinkDetails_Response>> {
    // <ProxiedAPIResponse<CPlayer_GetPlayerLinkDetails_Response>>
    return fetch(
      `${this.remoteHost}/player/${memberIds.join(',')}?access_token=${token}`,
      {
        method: 'GET',
        headers: {},
      }
    ).then((res) => res.json())
  }

  getPlaytimeSummary(
    familyGroupid: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetPlaytimeSummary_Response>> {
    return
  }

  getSteamFamilyGroup(token?: string, steamId?: bigint) {
    return fetch(`${this.remoteHost}/family?access_token=${token}`, {
      method: 'GET',
      headers: {},
    }).then((res) => res.json())
  }

  getSteamFamilyGroupLibs(
    familyId: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetSharedLibraryApps_Response>> {
    return fetch(
      `${this.remoteHost}/family/shared/${familyId}?access_token=${token}`,
      {
        method: 'GET',
        headers: {},
      }
    ).then((res) => res.json())
  }

  getSteamItems(
    appIds: string[]
  ): Promise<ProxiedAPIResponse<CStoreBrowse_GetItems_Response>> {
    return fetch(`${this.remoteHost}/items/${appIds.join(',')}`, {
      method: 'GET',
      headers: {},
    }).then((res) => res.json())
  }

  getSteamItemsBaseInfo(
    appIds: number[]
  ): Promise<ProxiedAPIResponse<GameBaseInfoResp>> {
    return fetch(`${this.remoteHost}/info/${appIds.join(',')}`, {
      method: 'GET',
      headers: {},
    }).then((res) => res.json())
  }
}
