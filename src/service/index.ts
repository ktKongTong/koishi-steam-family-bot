import {Context} from "koishi";
import {Config} from "../config";
import {libApi} from "./api";

interface AccountInfo {
  steamId: string,
  steamAccessToken: string,
  steamRefreshToken: string,
  lastRefreshTime: string,
}

export class APIService {
  Steam: ReturnType<typeof libApi>
  constructor(ctx:Context, cfg: Config, account:AccountInfo) {
    this.Steam = libApi(ctx,cfg,account.steamAccessToken)
  }
}
