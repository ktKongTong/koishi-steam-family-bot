import { Context } from 'koishi'
import { Config } from '../config'
import libMonitor from './libMonitor'
import libTagSyncer from './libTagSyncer'

export default function schedules(ctx: Context, config: Config) {
  ctx.cron(config.libMonitorCron, libMonitor(ctx, config))
  ctx.cron(config.libTagsSyncCron, libTagSyncer(ctx, config))
}
