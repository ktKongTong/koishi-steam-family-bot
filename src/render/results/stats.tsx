/** @jsxImportSource react */
import {Context} from "koishi";
import React from "react";
import {renderImg} from "../utils";
import {FamilyGames} from "../../interface/stats";
import Graph from "../components/graph";
import * as _ from 'lodash'
import {
  CFamilyGroups_GetFamilyGroupForUser_Response,
  CFamilyGroups_GetPlaytimeSummary_Response,
  CFamilyGroups_PlaytimeEntry,
  CPlayer_GetPlayerLinkDetails_Response
} from "node-steam-family-group-api";
import {Player} from "../types/player";
import {SteamFamilyLib} from "../../index";
import {SteamFamilyLibForStats} from "../index";
import {shaDigestAvatarToStrAvatarHash} from "node-steam-family-group-api";


const getPlaytime = (data:CFamilyGroups_GetPlaytimeSummary_Response)=> {
  const appids:number[] = data!.entries.flatMap((it:any)=>it.appid)
  const appidsByOwner = data!.entriesByOwner.flatMap(it => it.appid!)
  const allIds = _.uniq(appids.concat(appidsByOwner))
  const appPlaytimeDict = _.groupBy(data!.entries,'appid')
  const appPlaytimeByOwnerDict = _.groupBy(data!.entriesByOwner, 'appid')
  return allIds.map(id=> {
    let res:any[] = []
    let owners = appPlaytimeByOwnerDict[id]
    let players = appPlaytimeDict[id]
    if(owners) {
      res = res.concat(owners.map(owner => ({...owner, isOwner: true}))
      )
    }
    if(players) {
      res = res.concat(players.map(player => ({...player, isOwner: false})))
    }
    return {
      appid: id,
      players: res as (CFamilyGroups_PlaytimeEntry & {isOwner:boolean})[],
    }
  })
}

const getPlayer = (familyInfo:CFamilyGroups_GetFamilyGroupForUser_Response, memberInfos:CPlayer_GetPlayerLinkDetails_Response)=> {

  let familyData = familyInfo?.familyGroup!
  const memberFamilyInfos = _.keyBy(familyData.members, 'steamid')
  const members:Player[] = memberInfos.accounts.map((account:any)=> {
    const id = account?.publicData?.steamid!
    const avatar_hash = shaDigestAvatarToStrAvatarHash(account?.publicData?.shaDigestAvatar)
    return {
      ...account.publicData,
      avatar_hash,
      ...memberFamilyInfos[id]
    }
  })
  return members
}

const getLibs = (libs:SteamFamilyLib[]):SteamFamilyLibForStats[] => {
  return libs.map(it=> ({
    ...it,
    rtTimeAcquired: it.rtTimeAcquired ?? 0,
    ownerSteamids: it.steamIds.split(','),
    mappedTags: it.tags.split(',')
  }))
}

function Stats({
  familyGames
}:{
  familyGames: FamilyGames
}) {
  const bg = `https://www.loliapi.com/acg/pe/`
  const player = getPlayer(familyGames.familyInfo,familyGames.members)
  const recentAppDetail = familyGames.recentAppDetail.storeItems
  return (
    <div className={'flex min-h-screen flex-col items-center justify-between'}>
      <Graph
        players={player}
        libsPlaytime={getPlaytime(familyGames.playtimeSummary)}
        family={familyGames.familyInfo}
        bg={bg}
        libs={getLibs(familyGames.games)}
        recentLibs={recentAppDetail}
      />
    </div>
  )
}


export const renderStatsImg = (ctx: Context, games: FamilyGames, onStart?: ()=>void, onError?: ()=> void) => {
  // getSteamItems

  // collect data
  // 1. family info
  // 2. family Shared App
  // 3.
  return renderImg(ctx, <Stats familyGames={games}/>, onStart, onError)
}
