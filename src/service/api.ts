import {BeatLeaderPlayerScoreRequest, Leaderboard} from "koishi-plugin-beatsaber-bot/lib/types/beatleader";
import {wrapperErr} from "koishi-plugin-beatsaber-bot/lib/service/utils/handlerError";
import {Context} from "koishi";
import {APIResp, SteamFamily} from "../interface/family";
import {SharedLibResp} from "../interface/shared-lib";
import {SteamPlayers} from "../interface/players";
import {SteamAppDetails} from "../interface/steam-app-details";
import {Config} from "../config";
import {WishItem} from "../interface/wish";
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
      return (await http.get(`${host}/wishlist/${playerIds.join(',')}`))
    })
  return {
    getSteamFamily,
    getFamilyLibs,
    getFamilyMember,
    getSteamItems,
    getSteamWishes
  }
}
