import { SteamFamilyLib } from '../index'

export * from './results/stats'

export interface SteamFamilyLibForStats extends SteamFamilyLib {
  ownerSteamids: string[]
  mappedTags: string[]
  rtTimeAcquired: number
}
