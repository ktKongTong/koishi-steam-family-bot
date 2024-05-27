import { APIResp } from '../interface'
import { WishItem } from '../interface'
import _ from 'lodash'
import { jwtDecode } from 'jwt-decode'
import {
  CStoreBrowse_GetItems_Request,
  PartialMessage,
  SteamAPI,
} from 'node-steam-family-group-api'
import { ISteamFamilyAPI } from '../interface'

const sleep = (sec: number = 1) => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, sec * 1000)
  })
}
export class LocalFamilyAPI extends ISteamFamilyAPI {
  steamAPI: SteamAPI
  constructor(token?: string) {
    super()
    this.updateSteamToken(token)
  }
  updateSteamToken(token: string) {
    this.token = token
    this.steamAPI = new SteamAPI(token)
    // use steam-family-lib-viewer's api to proxy some proto api
    try {
      const tokenInfo = jwtDecode(token ?? '')
      this.steamId = BigInt(tokenInfo.sub)
    } catch (e) {
      //   ignore for non token
    }
  }

  getSteamFamilyGroup = (token = this.token, steamId: bigint = this.steamId) =>
    this.steamAPI.familyGroup.getFamilyGroupForUser(
      { steamid: steamId, includeFamilyGroupResponse: true },
      token
    )

  getPlaytimeSummary = (familyGroupid: bigint, token = this.token) =>
    this.steamAPI.familyGroup.getFamilyGroupPlaytimeSummary(
      { familyGroupid: familyGroupid },
      token
    )

  getSteamFamilyGroupLibs = (familyId: bigint, token = this.token) =>
    this.steamAPI.familyGroup.getFamilyGroupShardLibrary(
      {
        familyGroupid: familyId,
        includeOwn: true,
        includeExcluded: true,
        language: 'schinese',
      },
      token
    )

  getFamilyMembers = (memberIds: string[], token = this.token) =>
    this.steamAPI.common.getSteamPlayerLinkDetails(
      { steamids: memberIds.map((it) => BigInt(it)) },
      token
    )

  getSteamItems = async (
    appIds: string[],
    params?: PartialMessage<CStoreBrowse_GetItems_Request>
  ) =>
    this.steamAPI.common.getSteamItemsById(
      params ?? {
        ids: appIds
          .map((it) => parseInt(it))
          .filter((it) => !Number.isNaN(it))
          .map((it) => ({ appid: it })),
        context: {
          language: 'schinese',
          countryCode: 'US',
          steamRealm: 1,
        },
        dataRequest: {
          includeAssets: true,
          includeRelease: true,
          includePlatforms: true,
          includeScreenshots: true,
          includeTrailers: true,
          includeIncludedItems: true,
          includeTagCount: 20,
        },
      }
    )

  // const getSteamItems = async (appIds:string[]) => wrapperErr(
  //   () => http.get<APIResp<SteamAppDetails>>(`${host}/items/${appIds.join(',')}?access_token=${access_token}`)
  // )
}
