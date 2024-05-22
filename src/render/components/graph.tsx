/** @jsxImportSource react */
import {Piegraph} from "./(chart)/piegraph";
import {PlaytimeGraph} from "./(chart)/playtimeGraph";
import React from "react";
import Game from "./game";
import {Player} from "../types/player";
import {SteamAppPlaytime} from "../types/playtime";
import PlayerItem from "./Player";
import {useComputedData} from "../useComputedData";
import {
  StoreItem,
  CFamilyGroups_GetFamilyGroupForUser_Response
} from "node-steam-family-group-api"
import WordCloud from "./(chart)/echart-wordcloud";


export default function Graph({
  libs,
  players,
  libsPlaytime,
  family,
  bg,
  recentLibs
}:{
  libs: any[],
  recentLibs: StoreItem[],
  players: Player[],
  libsPlaytime: SteamAppPlaytime[],
  family: CFamilyGroups_GetFamilyGroupForUser_Response,
  bg: string
}) {
  const filteredPlayer = players
  const {
    cntData,
    dicts,
    playtimeData,
    mappedRecentLibs
  } = useComputedData(libs,recentLibs,filteredPlayer,players, libsPlaytime)

  // get recent app detail

  return (
    <div className={"relative z-10 overflow-hidden w-full h-full"} id={'data-graph'}>
      <div className={'bg-blend-darken dark bg-black/[.6] z-10 rounded-lg flex flex-col items-center justify-center mx-auto space-y-2 p-1 md:p-4 w-full h-full'}>
        <div className={"text-xl text-white  mx-auto"}> {family.familyGroup.name}</div>
        <div className={"grid grid-cols-2 sm:grid-cols-3 justify-evenly items-center w-full gap-1 mx-auto px-4 place-items-center"}>
          {
            players.map(player => (<PlayerItem key={player.steamid} player={player}/>))
          }
        </div>
        <Piegraph
          countData={cntData}
          style={{height: 400, width: 1000}}
        />
        <PlaytimeGraph
          playtime={playtimeData}
          players={players}
          style={{height: 400, width: 1000}}
        />
        <WordCloud words={dicts} height={800} width={800}
                   className={'flex items-center'}/>
        <div className={'grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-2 lg:gap-2 '}>
          {
            mappedRecentLibs
              .map(app => <Game key={app.appId} game={app} players={players}/>)
          }
        </div>
      </div>
      <img
        src={bg}
        crossOrigin="anonymous"
        style={{
          objectFit: "cover",
          inset: 0,
          height: '100%'
        }}
        className={'inset-0 absolute -z-10 object-cover h-full'}
        loading={'eager'}/>

    </div>
  )
}
