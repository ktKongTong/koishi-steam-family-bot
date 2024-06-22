import {
  APIService,
  Config,
  IAPIService,
  ISteamService,
  Result,
  SteamAccount,
} from 'steam-family-bot-core'
import { DBService } from './db'
const url = process.env.DB_URL
export class SteamService extends ISteamService {
  cfg: Config
  constructor(config: Config) {
    // create Dizzle client
    const db = new DBService(url)
    const api = APIService.createWithoutToken(config)
    super(db, api)
    this.cfg = config
  }

  createAPIWithCurAccount(account: SteamAccount): Promise<Result<IAPIService>> {
    //@ts-ignore
    return Promise.resolve(undefined)
  }
}
