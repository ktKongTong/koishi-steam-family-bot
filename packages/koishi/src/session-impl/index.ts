import { BotService, Msg, Session } from '@/interface'
import { Bot, Context, h } from 'koishi'
import { ChannelInfo } from '@/interface'

declare module 'koishi' {
  interface Context {
    bots: Bot[]
  }
}

export class KoishiSession implements Session {
  bot: Bot
  channelInfo: ChannelInfo
  constructor(bot: Bot, channelInfo: ChannelInfo) {
    this.bot = bot
    this.channelInfo = channelInfo
  }
  async sendMsg(msg: Msg): Promise<void> {
    await this.bot.sendMessage(
      this.channelInfo.channelId,
      h('message', [
        msg.type == 'image' ? h('img', { src: msg.content }) : msg.content,
      ])
    )
  }
}

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
