import {BeatLeaderPlayerScoreRequest, Leaderboard} from "koishi-plugin-beatsaber-bot/lib/types/beatleader";
import {wrapperErr} from "koishi-plugin-beatsaber-bot/lib/service/utils/handlerError";
import {Context} from "koishi";
import {APIResp, SteamFamily} from "../interface/family";
import {SharedLibResp} from "../interface/shared-lib";
import {SteamPlayers} from "../interface/players";
import {SteamAppDetails} from "../interface/steam-app-details";
import {Config} from "../config";
import {WishItem} from "../interface/wish";
import _ from "lodash";
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
  const getSteamWishes = async (playerIds:string[]):Promise<APIResp<WishItem[]>> =>
    wrapperErr(async ()=>{
      // return (await http.get(`${host}/items/${appIds.join(',')}?access_token=${access_token}`))
      const wishesByPlayer = await Promise.all(playerIds.map(async (id)=>{
              const url = `https://store.steampowered.com/wishlist/profiles/${id}/wishlistdata/?p=0&v=`
              const res = await fetch(url).then(res => res.json())
              const appIds = Object.keys(res)
              return appIds.map(appId=>({
                wisher: id,
                item:res[appId],
                appId:appId
              })).filter(app=>app.appId !== "success")
          }))
      const wishes = wishesByPlayer.flatMap(wish=>wish)

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
