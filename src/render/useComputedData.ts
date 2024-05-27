import { SteamAppPlaytime } from './types/playtime'
import * as _ from 'lodash'
import { Player } from './types/player'
import { convertTag } from '../utils/tag-dict'
import { SteamFamilyLibForStats } from './index'
import { StoreItem } from 'node-steam-family-group-api'

export const useComputedData = (
  libs: SteamFamilyLibForStats[],
  recentLibDetails: StoreItem[],
  filteredPlayer: any[],
  players: Player[],
  libsPlaytime: SteamAppPlaytime[]
) => {
  const names = players.map((account) => ({
    id: account.steamid,
    name: account.personaName,
  }))
  const libPlaytimePlayerSummary = _.keyBy(libsPlaytime, 'appid')
  const appsForUse = libs
    .filter((item) => {
      return (
        filteredPlayer.filter((player) =>
          item.ownerSteamids.includes(player.steamid.toString())
        ).length > 0
      )
    })
    .sort((a, b) => b.rtTimeAcquired - a.rtTimeAcquired)
    .map((item) => {
      return {
        playtime: libPlaytimePlayerSummary[item.appId.toString()],
        ...item,
      }
    })
  const games = appsForUse.flatMap((item) => {
    return item.ownerSteamids.map((it: any) => ({
      ...item,
      ownerSteamid: it,
    }))
  })

  const gameById = _.countBy(games, (game) => game.ownerSteamid.toString())

  const cntData = filteredPlayer
    .map((gamer) => ({
      gamer,
      cnt: gameById[gamer.steamid?.toString()],
      name: names.find((it) => it.id?.toString() == gamer.steamid?.toString())
        ?.name,
    }))
    .sort((a, b) => a.cnt - b.cnt)

  const tags = appsForUse.flatMap((app) =>
    app.mappedTags.map((it) => parseInt(it)).slice(0, 10)
  )

  const dict = _.countBy(tags, (it) => it)
  const dicts = Object.keys(dict)
    .map((item) => ({ value: dict[item], text: convertTag(item) }))
    .sort((a, b) => b.value - a.value)

  const allPlayTimeData = libsPlaytime.flatMap((it) => it.players)
  const playersPlayData = _.groupBy(allPlayTimeData, 'steamid')
  const playtimeData = _.keys(playersPlayData).map((key) => {
    const it = playersPlayData[key]
    const asOwnerLendTime = it
      .filter((item) => item.isOwner)
      .reduce((acc, cur) => acc + cur.secondsPlayed!, 0)
    const asPlayerTime = it
      .filter((item) => !item.isOwner)
      .reduce((acc, cur) => acc + cur.secondsPlayed!, 0)
    return {
      asOwnerLendTime,
      asPlayerTime,
      steamid: key,
    }
  })
  const recentLibs = appsForUse
    .sort((a, b) => {
      return (b.rtTimeAcquired ?? 0) - (a.rtTimeAcquired ?? 0)
    })
    .slice(0, 12)

  const libDetailDict = _.keyBy(recentLibDetails, 'appid')

  const mappedRecentLibs = recentLibs.map((it) => {
    const detail = libDetailDict[it.appId]
    return {
      ...it,
      owners: it.ownerSteamids.map((it) =>
        players.find((player) => player.steamid.toString() == it)
      ),
      detail,
    }
  })

  return {
    cntData,
    dicts,
    playtimeData,
    appsForUse,
    mappedRecentLibs,
  }
}
