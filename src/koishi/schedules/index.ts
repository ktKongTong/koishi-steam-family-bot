import { Context } from 'koishi'
import { ChannelInfo, Config } from '../interface'
import { SteamService } from '../services'
import { libInfoSyncer, libMonitor } from '../../service/schedules'
import { KoishiBotService, KoishiSession } from '../session-impl'

export default function schedules(ctx: Context, config: Config) {
  const steam = new SteamService(ctx, config)
  const botService = new KoishiBotService(ctx)
  const logger = ctx.logger('steam-family-bot.lib-monitor')
  ctx.cron(
    config.libMonitorCron,
    libMonitor<ChannelInfo, KoishiSession>(steam, botService, config, logger)
  )
  ctx.cron(config.libInfoSyncerCron, libInfoSyncer(logger, config, steam))
}
