/** @jsxImportSource react */

import dayjs from "dayjs";
import React from "react";
import {App, Player} from "../types/player";
interface GameProps {
  game: any,
  players:Player[]
}

const getAvatar = (hash:string) => `https://avatars.akamai.steamstatic.com/${hash}_full.jpg`
const getGameAsset = (game:App, filename:string) => {
  const format = game.detail.assets?.assetUrlFormat
  const prefix = "https://cdn.akamai.steamstatic.com/"
  const url = format?.replace("${FILENAME}", filename)
  return prefix + url
}
const getGameTrailer = (game:App) => {
  try {
    const format = game.detail.trailers?.highlights?.[0]!.trailerUrlFormat!
    const prefix = "https://cdn.akamai.steamstatic.com/"
    //
    // https://cdn.akamai.steamstatic.com/steam/apps/256689996/microtrailer.webm
    const filename = game.detail.trailers?.highlights?.[0]!.microtrailer[0].filename!
    const url = format.replace("${FILENAME}", filename)
    return prefix + url
  }catch (e) {
    return null
  }

}
const getGameHeader = (game:App) => {
  return getGameAsset(game,game.detail.assets?.header!)
}

const getGameCapsule = (game:App) => {
  return getGameAsset(game,game.detail.assets?.libraryCapsule??'')
}
interface Media {
  src: string
  type:'video'|'img'
}

export default function Game({
game,
players
}: GameProps
) {
  return (
    <div key={game.appid}
         className={'relative w-24 sm:w-36 md:w-36 aspect-[6/9] rounded-lg text-xs text-zinc-600/60'}>
      <div className={'w-full h-full relative'}>
        <img
          src={getGameCapsule(game)}
          className={' rounded-lg absolute z-0 inset-0'}
          loading={'eager'}
        />
        <div className={'absolute text-white text-[8px] top-0 left-0 bg-zinc-700/50 px-1 py-0.5 rounded-md text-xs'}>
          <div>{dayjs.unix(game.rtTimeAcquired!).format('YY年MM月DD日')}</div>
        </div>
        <div className={'absolute bottom-0 left-0 p-1 flex text-white space-x-2'}>
          {
            game.playtime &&
            (
              <div>
                {game.playtime.players.map((playtime:any) => {
                  const player = players.find(it=>it.steamid?.toString() == playtime.steamid)
                  return (
                    <div key={playtime.steamid}>
                      {player?.personaName}: {(playtime.secondsPlayed/3600).toFixed(1)} h
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
        <div className={' absolute bottom-0 right-0 p-1 flex text-white space-x-2'}>
          <div className={'mt-auto ml-auto flex flex-col group '}>
            {
              game.owners.map((it, index) =>
                < div key={index}>
                  <div className={'h-6 w-6 border-[2px] border-zinc-700 -mt-[10px] group-hover:mb-[10px]  transition-all ease-in-out rounded-full'}>
                    <img src={getAvatar(it?.avatar_hash??"")} alt={`@${it?.personaName}`} className={'h-6 w-6 rounded-full' } loading={'eager'}/>
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </div>


    </div>
  )
}
