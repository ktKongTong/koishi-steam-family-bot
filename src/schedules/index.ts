import { Context } from 'koishi'
import { Config } from '../config'
import libMonitor from './libMonitor'
import libTagSyncer from './libTagSyncer'
import { SteamService } from '../service'

export default function schedules(ctx: Context, config: Config) {
  const steam = new SteamService(ctx, config)
  ctx.cron(config.libMonitorCron, libMonitor(ctx, config, steam))
  ctx.cron(config.libTagsSyncCron, libTagSyncer(ctx, config, steam))
}
