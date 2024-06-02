import { SteamFamilyLib } from '../interface'

export * from './results/stats'

export * from './components/app'
export interface SteamFamilyLibForStats extends SteamFamilyLib {
  ownerSteamids: string[]
  mappedTags: string[]
  rtTimeAcquired: number
}
