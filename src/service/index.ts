import {Context} from "koishi";
import {Config} from "../config";
import {libApi} from "./api";
import { jwtDecode } from "jwt-decode";
import {now} from "lodash";
import {EAuthTokenPlatformType, LoginSession} from "steam-session";
import {Result} from "../interface/result";
interface AccountInfo {
  id: number,
  steamId: string,
  steamAccessToken: string,
  steamRefreshToken: string,
  lastRefreshTime: string,
}

export class APIService {
  Steam: ReturnType<typeof libApi>
  private constructor(ctx:Context, cfg: Config, account:AccountInfo) {
    this.Steam = libApi(ctx,cfg,account.steamAccessToken)
  }

  /**
   * async create an API Service
   * auto check token valid after generated
   * @param ctx
   * @param cfg
   * @param account
   */
  static async create(ctx: Context, cfg: Config, account: AccountInfo):Promise<Result<APIService>> {
    // check if token valid
    const res = await ctx.database.get('SteamAccount', {
      id: account.id
    })
    if (res.length <= 0) {
      return Result.failed(`cannot find account {id = ${account.id}}`)
    }
    try {
      const res = jwtDecode(account.steamAccessToken)
      let nt = now()
      let needRefresh = (res.exp - 900) * 1000 < nt
      if (needRefresh) {
        await APIService.renew(ctx, cfg, account)
      }
    }catch (e) {
      return Result.failed(e?.toString())
    }
    const instance =  new APIService(ctx,cfg,account)
    return Result.success(instance)
  }
  static async renew(ctx:Context, cfg: Config, account: AccountInfo) {
    const session = new LoginSession(EAuthTokenPlatformType.SteamClient)
    session.refreshToken = account.steamRefreshToken
    await session.refreshAccessToken()
    ctx.database.set('SteamAccount', {
      id: account.id,
    }, {
      steamAccessToken: session.accessToken,
    })
    account.steamAccessToken = session.accessToken
  }
}
