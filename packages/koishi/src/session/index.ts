import { BotService } from '@/interface'
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
  constructor(ctx: Context) {
    this.ctx = ctx
  }
  getSessionByChannelInfo(channelInfo: ChannelInfo): KoishiSession {
    const bot = this.ctx.bots[`${channelInfo.platform}:${channelInfo.selfId}`]
    if (bot) {
      return new KoishiSession(bot, channelInfo)
    }
    return undefined
  }
}
