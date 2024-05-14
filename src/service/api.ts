
import {Context} from "koishi";
import {APIResp, SteamFamily} from "../interface/family";
import {SharedLibResp} from "../interface/shared-lib";
import {SteamPlayers} from "../interface/players";
import {SteamAppDetails} from "../interface/steam-app-details";
import {Config} from "../config";
import {WishItem} from "../interface/wish";
import _ from "lodash";
import {wrapperErr} from "./utils";
export const libApi = (ctx:Context,config:Config,token:string)=> {
  const http = ctx.http
  const access_token = token
  let host =  "https://steam-family-lib-viewer.ktlab.io/api/steam"

  const getSteamFamily = async ():Promise<APIResp<SteamFamily>> =>
    wrapperErr(async ()=>{
      return  (await http.get(`${host}/family?access_token=${access_token}`))
    })
  const getFamilyLibs = async (familyId:string):Promise<APIResp<SharedLibResp>> =>
    wrapperErr(async ()=>{
      return  (await http.get(`${host}/family/shared/${familyId}?access_token=${access_token}`))
    })
  const getFamilyMember = async (memberIds:string[]):Promise<APIResp<SteamPlayers>> =>
    wrapperErr(async ()=>{
      return  (await http.get(`${host}/player/${memberIds.join(',')}?access_token=${access_token}`))
    })
  const getSteamItems = async (appIds:string[]):Promise<APIResp<SteamAppDetails>> =>
    wrapperErr(async ()=>{
      return (await http.get(`${host}/items/${appIds.join(',')}?access_token=${access_token}`))
    })


  const getSteamWishesByPage= async (id:string,page:number)=> {
    const url = `https://store.steampowered.com/wishlist/profiles/${id}/wishlistdata/?p=${page}&v=`
    try {
      const res = await fetch(url).then(res => res.json())
      return res
    }catch (e) {
      console.log(e)
      console.log(url)
      return null
    }
  }

  const getOnePlayersSteamWishes = async (id: string) => {
    let page = 0
    let hasMore = true
    let apps:Record<string, any> = {}
    let appIds:string[] = []
    const appMaps = new Map<string, any>();
    while (hasMore) {

      const res:Record<string, any> = await getSteamWishesByPage(id, page)
      if(res) {
        // res expect as an object, only when no more page return empty as an array
        if(res instanceof Array){
          hasMore = false
        }
        Object.keys(res).forEach(key=> {appMaps.set(key, res[key]);})
        appIds = appIds.concat(Object.keys(res))
        page++
      }else {
        // logger
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
      // return (await http.get(`${host}/items/${appIds.join(',')}?access_token=${access_token}`))
      const wishesByPlayer =
        (await Promise.all(playerIds.map(it=> getOnePlayersSteamWishes(it))))
          .flatMap(it=>it)
          .filter(app=>app.appId !== "success")

      const wishes = wishesByPlayer
        .flatMap(wish=>wish)

      const groupedWishes = _.groupBy(wishes,'appId')
      const appIds = Object.keys(groupedWishes)
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
    getSteamFamily,
    getFamilyLibs,
    getFamilyMember,
    getSteamItems,
    getSteamWishes
  }
}
