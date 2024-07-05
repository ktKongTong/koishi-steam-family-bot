import {
  ISteamFamilyAPI,
  ProxiedAPIResponse,
  Config,
  GameBaseInfoResp,
} from '../interface'
import {
  CPlayer_GetPlayerLinkDetails_Response,
  CFamilyGroups_GetPlaytimeSummary_Response,
  CFamilyGroups_GetSharedLibraryApps_Response,
  CStoreBrowse_GetItems_Response,
  CFamilyGroups_GetFamilyGroupForUser_Response,
} from 'node-steam-family-group-api'
import { HTTP } from '@koishijs/plugin-http'
import { Context } from 'koishi'

export class KoishiRemoteFamilyAPI extends ISteamFamilyAPI {
  http: HTTP
  remoteHost: string
  constructor(ctx: Context, config: Config) {
    super()
    this.http = ctx.http
    this.remoteHost = `${config.SteamHelperAPIHost}/api/steam`
  }

  getFamilyMembers(
    memberIds: string[],
    token?: string
  ): Promise<ProxiedAPIResponse<CPlayer_GetPlayerLinkDetails_Response>> {
    return this.http.get<
      ProxiedAPIResponse<CPlayer_GetPlayerLinkDetails_Response>
    >(`${this.remoteHost}/player/${memberIds.join(',')}?access_token=${token}`)
  }

  getPlaytimeSummary(
    familyGroupid: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetPlaytimeSummary_Response>> {
    return
  }

  getSteamFamilyGroup(token?: string, steamId?: bigint) {
    return this.http.get<
      ProxiedAPIResponse<CFamilyGroups_GetFamilyGroupForUser_Response>
    >(`${this.remoteHost}/family?access_token=${token}`)
  }

  getSteamFamilyGroupLibs(
    familyId: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetSharedLibraryApps_Response>> {
    return this.http.get<
      ProxiedAPIResponse<CFamilyGroups_GetSharedLibraryApps_Response>
    >(`${this.remoteHost}/family/shared/${familyId}?access_token=${token}`)
  }

  getSteamItems(
    appIds: string[]
  ): Promise<ProxiedAPIResponse<CStoreBrowse_GetItems_Response>> {
    return this.http.get<ProxiedAPIResponse<CStoreBrowse_GetItems_Response>>(
      `${this.remoteHost}/items/${appIds.join(',')}`
    )
  }

  getSteamItemsBaseInfo(
    appIds: number[]
  ): Promise<ProxiedAPIResponse<GameBaseInfoResp>> {
    return this.http.get<ProxiedAPIResponse<GameBaseInfoResp>>(
      `${this.remoteHost}/info/${appIds.join(',')}`
    )
  }
}
