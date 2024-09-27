import { Context, Logger } from 'koishi'
import { ChannelInfo, Config } from '@/interface'
import { SteamService } from '@/services'
import { getScheduleTasks } from 'steam-family-bot-core/schedules'
import { KoishiBotService } from '@/session'

export default function schedules(
  ctx: Context,
  config: Config,
  baseLogger: Logger
) {
  const steam = new SteamService<ChannelInfo>(ctx, config)
  const botService = new KoishiBotService(ctx, config)
  const logger = baseLogger.extend('schedules')
  const baseCtx = {
    config: config,
    botService: botService,
    steam,
  }
  const tasks = getScheduleTasks(config).filter((it) => it.enable)
  for (const task of tasks) {
    const scheduleContext = {
      ...baseCtx,
      logger: logger.extend(task.name),
    }
    ctx.cron(task.cron, () => task.handler(scheduleContext))
  }
}
