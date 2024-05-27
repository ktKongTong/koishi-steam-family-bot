import { Context, Logger } from 'koishi'
import { Config } from '../config'
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
  constructor(ctx: Context, config: Config) {
    this.config = config
    this.ctx = ctx
    this.logger = this.ctx.logger('steam-family-lib.monitor.cmd')
  }
  apply(fc: (Context, Config, Logger) => void) {
    fc(this.ctx, this.config, this.logger)
    return this
  }
}
