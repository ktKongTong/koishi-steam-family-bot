
import {Context} from "koishi";
import {APIResp, SteamFamily} from "../interface/family";
import {SharedLibResp} from "../interface/shared-lib";
import {SteamPlayers} from "../interface/players";
import {Config} from "../config";
import {WishItem} from "../interface/wish";
import _ from "lodash";
import {wrapperErr} from "./utils";
import {SteamAPI} from "node-steam-family-group-api";
import {jwtDecode} from "jwt-decode";

import {
  CStoreBrowse_GetItems_Request,
  PartialMessage
} from "node-steam-family-group-api";
export const libApi = (ctx:Context,config:Config,token:string)=> {
  const http = ctx.http
  const steamAPI = new SteamAPI(token)
  const access_token = token
  // currently, using steam-family-lib-viewer's api to proxy some proto api
  let host =  `${config.SteamHelperAPIHost}/api/steam`
  let steamid = ""
  try {
    const tokenInfo = jwtDecode(token??"")
    steamid = tokenInfo.sub
  }catch (e) {
    //   ignore for non token api
  }
  const getSteamFamilyGroup = ()=>steamAPI.familyGroup
    .getFamilyGroupForUser({steamid: BigInt(steamid), includeFamilyGroupResponse: true}, token)

  const getPlaytimeSummary = (familyGroupid: bigint)=>steamAPI.familyGroup
    .getFamilyGroupPlaytimeSummary({familyGroupid: familyGroupid},token)

  const getSteamFamilyGroupLibs = (familyId:bigint)=> steamAPI.familyGroup
    .getFamilyGroupShardLibrary({
      familyGroupid: familyId,
      includeOwn: true,
      includeExcluded: true,
      language: 'schinese',
    }, token)


  const getFamilyMembers = (memberIds:string[]) => steamAPI.common
    .getSteamPlayerLinkDetails({steamids: memberIds.map(it=>BigInt(it))}, token)


  const getSteamItems = async (appIds:string[],params?:PartialMessage<CStoreBrowse_GetItems_Request>) => steamAPI.common
    .getSteamItemsById(params ?? {
      ids: appIds.map(it=> parseInt(it)).filter(it => !Number.isNaN(it))
        .map(it=>({appid: it})),
      context: {
        language: 'schinese',
        countryCode: 'US',
        steamRealm: 1
      },
      dataRequest: {
        includeAssets: true,
        includeRelease: true,
        includePlatforms: true,
        includeScreenshots: true,
        includeTrailers: true,
        includeIncludedItems: true,
        includeTagCount: 20
      }
    })

  const getSteamFamily = async () => wrapperErr(
    () => http.get<APIResp<SteamFamily>>(`${host}/family?access_token=${access_token}`)
  )
  const getFamilyLibs = async (familyId:string) => wrapperErr(
    () => http.get<APIResp<SharedLibResp>>(`${host}/family/shared/${familyId}?access_token=${access_token}`)
  )
  const getFamilyMember = async (memberIds:string[]) => wrapperErr(
      () => http.get<APIResp<SteamPlayers>>(`${host}/player/${memberIds.join(',')}?access_token=${access_token}`)
  )
  // const getSteamItems = async (appIds:string[]) => wrapperErr(
  //   () => http.get<APIResp<SteamAppDetails>>(`${host}/items/${appIds.join(',')}?access_token=${access_token}`)
  // )

  // for wishlist larger than 50 items, same request may give different response item in a short time.
  // it's really an annoyed bug. but steam didn't fix it for a long time.
  // check this: https://steamcommunity.com/sharedfiles/filedetails/?id=1746978201
  const getSteamWishesByPage = async (id:string,page:number)=> {
    const url = `https://store.steampowered.com/wishlist/profiles/${id}/wishlistdata/?p=${page}&v=1`
    try {
      const res = await fetch(url).then(res => res.json())
      // filter keys equal success
      if(res["success"]) {
        return []
      }
      return res
    }catch (e) {
      console.log(e)
      console.log(url)
      return null
    }
  }

  const sleep = (sec: number = 1)=> {
    return new Promise<void>((resolve,reject) => {
      setTimeout(resolve, sec * 1000)
    })
  }

  const withRetry = async <T>(func:()=>T, times= 3) => {
    let time = 0
    try {
      let res = null
      while(!res && time < times) {
        time++
        await sleep()
        res = await func()
      }
      return res
    }catch (e) {
      return null
    }
  }

  const getOnePlayersSteamWishes = async (id: string) => {
    let page = 0
    let hasMore = true
    let appIds:string[] = []
    const appMaps = new Map<string, any>();
    while (hasMore) {
      const res:Record<string, any> = await withRetry(()=>getSteamWishesByPage(id, page))
      if(res) {
        // res expect as an object, only when no more page return empty as an array
        if(res instanceof Array){
          hasMore = false
          continue
        }
        Object.keys(res).forEach(key=> {appMaps.set(key, res[key]);})
        // console.log(`${id}, ${page}, ${Object.keys(res).length}`)
        appIds = appIds.concat(Object.keys(res))
        page++
      }else {
        // logger
        console.log(`unexpect error, ${id}, ${page}`)
        // unexpect change, need to resolve
        hasMore = false
      }
    }
    return appIds
    .map(appId=>({
      wisher: id,
      item:appMaps.get(appId),
      appId:appId
    }))
  }

  const getSteamWishes = async (playerIds:string[]):Promise<APIResp<WishItem[]>> =>
    wrapperErr(
      async ()=>{
      const wishesByPlayer =
        (await Promise.all(playerIds.map(it=> getOnePlayersSteamWishes(it))))
          .flatMap(it=>it)
          .filter(app=>app.appId !== "success")

      const wishes = wishesByPlayer
        .flatMap(wish=>wish)
      const groupedWishes = _.groupBy(wishes,'appId')
      const appIds = Object.keys(groupedWishes)
        console.log(`total wishes count ${wishes.length}`)
      const finalWishes = appIds.map(appId => {
        const items = groupedWishes[appId]
        return {
          wishers: items.map(item=>item.wisher),
          appId: appId,
          itemInfo: items[0].item
        }
      })
      return {
        data: finalWishes,
      }
    })
  return {
    getPlaytimeSummary,
    getSteamFamilyGroup,
    // getSteamFamily,
    // getFamilyLibs,
    getSteamFamilyGroupLibs,
    // getFamilyMember,
    getFamilyMembers,
    getSteamItems,
    getSteamWishes
  }
}
