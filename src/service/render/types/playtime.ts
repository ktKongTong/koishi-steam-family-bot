import { CFamilyGroups_PlaytimeEntry } from 'node-steam-family-group-api'

export interface SteamPlaytimeResponse {
  data: {
    entries: SteamPlaytimeItem[]
    entriesByOwner: SteamPlaytimeItem[]
  }
}
export interface SteamPlaytimeItem {
  steamid: string
  appid: number
  firstPlayed: number
  lastPlayed: number
  secondsPlayed: number
}

export interface ExtendedSteamPlaytimeItem extends CFamilyGroups_PlaytimeEntry {
  isOwner: boolean
}
export interface SteamAppPlaytime {
  appid: number
  players: ExtendedSteamPlaytimeItem[]
}
