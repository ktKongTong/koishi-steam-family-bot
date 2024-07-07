import { Context, Logger } from 'koishi'
import { ChannelInfo, Config } from '@/interface'
import { SteamService } from '@/services'
import { libInfoSyncer, libMonitor } from 'steam-family-bot-core/schedules'
import { KoishiBotService, KoishiSession } from '@/session'

export default function schedules(
  ctx: Context,
  config: Config,
  baseLogger: Logger
) {
  const steam = new SteamService<ChannelInfo>(ctx, config)
  const botService = new KoishiBotService(ctx)
  const logger = baseLogger.extend('schedules')
  ctx.cron(
    config.libMonitorCron,
    libMonitor<ChannelInfo, KoishiSession>(
      steam,
      botService,
      config,
      logger.extend('lib-monitor')
    )
  )
  ctx.cron(
    config.libInfoSyncerCron,
    libInfoSyncer(logger.extend('lib-info-syncer'), config, steam)
  )
}
