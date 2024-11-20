import {
  CFamilyGroups_GetFamilyGroupForUser_Response,
  CStoreBrowse_GetItems_Request,
  PartialMessage,
  CFamilyGroups_GetPlaytimeSummary_Response,
  CFamilyGroups_GetSharedLibraryApps_Response,
  CPlayer_GetPlayerLinkDetails_Response,
  CStoreBrowse_GetItems_Response,
} from 'node-steam-family-group-api'
import { APIResp, WishItem } from './types'
import _ from 'lodash'
import { GameBaseInfoResp } from '../../interface'

export interface ProxiedAPIResponse<T> {
  ok: boolean
  status: number
  message: string
  data: null | T
}
export * from './types'

const sleep = async (millSec: number = 300) => {
  return new Promise((resolve, reject) => setTimeout(resolve, millSec))
}

export interface IAPIService {
  Steam: ISteamFamilyAPI
}

export abstract class ISteamFamilyAPI {
  token?: string
  steamId?: bigint
  abstract getSteamFamilyGroup(
    token?: string,
    steamId?: bigint
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetFamilyGroupForUser_Response>>
  abstract getPlaytimeSummary(
    familyGroupid: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetPlaytimeSummary_Response>>
  abstract getSteamFamilyGroupLibs(
    familyId: bigint,
    token?: string
  ): Promise<ProxiedAPIResponse<CFamilyGroups_GetSharedLibraryApps_Response>>
  abstract getFamilyMembers(
    memberIds: string[],
    token?: string
  ): Promise<ProxiedAPIResponse<CPlayer_GetPlayerLinkDetails_Response>>
  abstract getSteamItems(
    appIds: string[],
    params?: PartialMessage<CStoreBrowse_GetItems_Request>
  ): Promise<ProxiedAPIResponse<CStoreBrowse_GetItems_Response>>

  abstract getSteamItemsBaseInfo(
    appIds: number[]
  ): Promise<ProxiedAPIResponse<GameBaseInfoResp>>

  // for wishlist larger than 50 items, same request may give different response item in a short time.
  // it's really an annoyed bug. but steam didn't fix it for a long time.
  // check this: https://steamcommunity.com/sharedfiles/filedetails/?id=1746978201
  getSteamWishesByPage = async (id: string, page: number) => {
    const url = `https://store.steampowered.com/wishlist/profiles/${id}/wishlistdata/?p=${page}&v=1`
    try {
      const res = await fetch(url).then((res) => res.json())
      // filter keys equal success
      if (res['success']) {
        return []
      }
      return res
    } catch (e) {
      console.log(e)
      console.log(url)
      return null
    }
  }

  retry = async <T>(func: () => T, times = 3) => {
    let time = 0
    try {
      let res = null
      while (!res && time < times) {
        time++
        await sleep()
        res = await func()
      }
      return res
    } catch (e) {
      return null
    }
  }

  getOnePlayersSteamWishes = async (id: string) => {
    let page = 0
    let hasMore = true
    let appIds: string[] = []
    const appMaps = new Map<string, any>()
    while (hasMore) {
      const res: Record<string, any> = await this.retry(() =>
        this.getSteamWishesByPage(id, page)
      )
      if (res) {
        if (res instanceof Array) {
          hasMore = false
          continue
        }
        Object.keys(res).forEach((key) => {
          appMaps.set(key, res[key])
        })
        appIds = appIds.concat(Object.keys(res))
        page++
      } else {
        console.log(`unexpect error, ${id}, ${page}`)
        hasMore = false
      }
    }
    return appIds.map((appId) => ({
      wisher: id,
      item: appMaps.get(appId),
      appId: appId,
    }))
  }

  async getSteamWishesByPlayerIds(
    playerIds: string[]
  ): Promise<APIResp<WishItem[]>> {
    const wishesByPlayer = (
      await Promise.all(
        playerIds.map((it) => this.getOnePlayersSteamWishes(it))
      )
    )
      .flatMap((it) => it)
      .filter((app) => app.appId !== 'success')

    const wishes = wishesByPlayer.flatMap((wish) => wish)
    const groupedWishes = _.groupBy(wishes, 'appId')
    const appIds = Object.keys(groupedWishes)
    console.log(`total wishes count ${wishes.length}`)
    const finalWishes = appIds.map((appId) => {
      const items = groupedWishes[appId]
      return {
        wishers: items.map((item) => item.wisher),
        appId: appId,
        itemInfo: items[0].item,
      }
    })
    return {
      data: finalWishes,
    }
  }
}

enum ReqResultStatus {
  Success,
  NotMatch,
  NetworkError,
}

export class NetReqResult<T> {
  data?: T | null
  private status: ReqResultStatus
  msg: string
  static failed<T>(reason: string): NetReqResult<T> {
    return new NetReqResult<T>(null, ReqResultStatus.NetworkError, reason)
  }
  static success<T>(data: T): NetReqResult<T> {
    return new NetReqResult(data, ReqResultStatus.Success, 'ok')
  }
  constructor(data: T, status: ReqResultStatus, message: string) {
    this.data = data
    this.status = status
    this.msg = message
  }

  successOr(data: T) {
    if (this.isSuccess()) {
      return this.data
    }
    return data
  }

  isSuccess() {
    return this.status === ReqResultStatus.Success
  }

  isNetworkError() {
    return this.status === ReqResultStatus.NetworkError
  }

  isNotMatch() {
    return this.status === ReqResultStatus.NotMatch
  }
}
