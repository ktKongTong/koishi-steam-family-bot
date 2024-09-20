import { BotService, Config, ISteamService, Session } from '@/interface'
import { Logger } from '@/interface/logger'

export type ScheduleTaskCtx<CHANNEL> = {
  steam: ISteamService<CHANNEL>
  botService: BotService<CHANNEL, Session<CHANNEL>>
  logger: Logger
  config: Config
}

export type ScheduleTask = {
  name: string
  cron: string
  enable: boolean
  handler: <T>(c: ScheduleTaskCtx<T>) => Promise<void>
}
