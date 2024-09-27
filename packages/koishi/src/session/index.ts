import { BotService, Config, TmpFileStorage } from '@/interface'
import { Bot, Context } from 'koishi'
import { ChannelInfo } from '@/interface'
import { KoishiSession } from '@/session/schedule-session'

declare module 'koishi' {
  interface Context {
    bots: Bot[]
  }
}

export * from './schedule-session'
export * from './cmd-session'

export class KoishiBotService
  implements BotService<ChannelInfo, KoishiSession>
{
  ctx: Context
  config: Config
  tmpFileStorage: TmpFileStorage | undefined
  constructor(ctx: Context, config: Config) {
    this.ctx = ctx
    this.config = config
    if (config.uploadImageToS3.enable) {
      this.tmpFileStorage = new TmpFileStorage(config)
    }
  }
  getSessionByChannelInfo(channelInfo: ChannelInfo): KoishiSession {
    const bot = this.ctx.bots[`${channelInfo.platform}:${channelInfo.selfId}`]
    if (bot) {
      return new KoishiSession(bot, channelInfo, this.tmpFileStorage)
    }
    return undefined
  }
}
