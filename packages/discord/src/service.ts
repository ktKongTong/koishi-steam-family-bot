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

export class SteamService<CHANNEL> extends ISteamService<CHANNEL> {
  cfg: Config
  constructor(config: Config) {
    // create Dizzle client
    //     // const client = new Client({ connectionString: c });
    //     // await client.connect();
    const db = new DBService<CHANNEL>(url)
    const api = APIService.createWithoutToken(config)
    super(db, api)
    this.cfg = config
  }

  createAPIWithCurAccount(account: SteamAccount): Promise<Result<IAPIService>> {
    //@ts-ignore
    return Promise.resolve(undefined)
  }
}
