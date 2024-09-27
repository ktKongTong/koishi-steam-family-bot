import {
  CFamilyGroups_GetFamilyGroupForUser_Response,
  CFamilyGroups_GetPlaytimeSummary_Response,
  CPlayer_GetPlayerLinkDetails_Response,
  CStoreBrowse_GetItems_Response,
} from 'node-steam-family-group-api'
import { GameInfo, SteamFamilyLib } from '@/db/interface'

export * from './service'
export * from '../api/interface'
export * from '../db/interface'
export * from '../render/types/player'
export * from '../render/types/playtime'
export enum SteamAccountStatus {
  OK = 'ok',
  // notify times
  INVALIDStep1 = 'invalid.1',
  INVALIDStep2 = 'invalid.2',
  INVALIDStep3 = 'invalid.3',
}
export interface FamilyGames {
  familyInfo: CFamilyGroups_GetFamilyGroupForUser_Response
  members: CPlayer_GetPlayerLinkDetails_Response
  // todo combine game base info, like alias, game
  games: (SteamFamilyLib & {
    info?: GameInfo
  })[]
  playtimeSummary: CFamilyGroups_GetPlaytimeSummary_Response
  recentAppDetail: CStoreBrowse_GetItems_Response
}

export type GameBaseInfoResp = {
  appId: number
  name: number
  aliases: string
  top20Tags: string[]
  lastRefreshedAt: string
  createdAt: string
}[]

interface ScheduleTaskConfig {
  cron: string
  enable: boolean
}

export interface Config {
  SteamHelperAPIHost: string
  libMonitorCron: ScheduleTaskConfig
  libInfoSyncerCron: ScheduleTaskConfig
  tokenRefreshCron: ScheduleTaskConfig
  //assume value is yaml
  i18nMap: Record<string, string>
  steamDataFetchMode: 'remote' | 'local'
  preferPuppeteerMode: 'local-plugin' | 'remote'
  broswerlessWSEndpoint: string
  uploadImageToS3: {
    enable: boolean
    s3AccessKey: string
    s3SecretKey: string
    endpoint: string
    region: string | undefined
    bucketName: string
    keyPrefix: string
    baseURL: string
  }
}

export * from './bot'
