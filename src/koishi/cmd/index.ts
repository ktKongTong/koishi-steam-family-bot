import { Context, Logger } from 'koishi'
import { Config } from '../interface'
import { ISteamService } from '../interface'
import { SteamService } from '../services'

export * from './unsub'
export * from './sub'
export * from './login'
export * from './statistic'
export * from './refresh'
export * from './clear'
export * from './query'
export default class Cmd {
  private readonly config: Config
  private readonly ctx: Context
  private readonly logger: Logger
  private readonly steam: ISteamService
  constructor(ctx: Context, config: Config, logger: Logger) {
    this.config = config
    this.ctx = ctx
    this.logger = logger.extend('cmd')
    this.steam = new SteamService(ctx, config)
  }
  apply(
    fc: (
      ctx: Context,
      cfg: Config,
      logger: Logger,
      service: ISteamService
    ) => void
  ) {
    fc(this.ctx, this.config, this.logger, this.steam)
    return this
  }
}
