export interface SteamSharedLib {
  appid: number,
  ownerSteamids: string[],
  name: string,
  imgIconHash: string,
  rtTimeAcquired: number,
  capsuleFilename?: string,
  excludeReason?: any,
  [property: string]: any;
}

export interface SharedLibResp {
  apps: SteamSharedLib[],
  ownerSteamid: string,
}
