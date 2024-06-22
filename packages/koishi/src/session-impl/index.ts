import { BotService, Msg, Session } from '@/interface'
import { Bot, Context, h, Session as KoiSession } from 'koishi'
import { ChannelInfo } from '@/interface'

declare module 'koishi' {
  interface Context {
    bots: Bot[]
  }
}

export class KSession implements Session<ChannelInfo> {
  // create a session Object?
  private readonly session: KoiSession
  uid: string
  constructor(session: KoiSession) {
    this.session = session
    this.uid = session.uid
  }
  getSessionInfo(): ChannelInfo {
    return {
      uid: this.session.uid,
      channelId: this.session.channelId,
      selfId: this.session.selfId,
      platform: this.session.platform,
    }
  }

  async send(msg: string): Promise<void> {
    await this.session.send(msg)
  }

  async sendMsg(msg: Msg): Promise<void> {
    await this.session.send(
      h('message', [
        msg.type == 'image' ? h('img', { src: msg.content }) : msg.content,
      ])
    )
  }

  async sendQueued(msg: string): Promise<void> {
    await this.session.sendQueued(msg)
  }

  async sendQuote(msg: string): Promise<void> {
    await this.session.sendQueued(msg)
  }
}
export class KoishiSession implements Session<ChannelInfo> {
  bot: Bot
  channelInfo: ChannelInfo
  uid: string
  constructor(bot: Bot, channelInfo: ChannelInfo) {
    this.bot = bot
    this.uid = channelInfo.uid
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

  getSessionInfo(): ChannelInfo {
    return this.channelInfo
  }

  send(msg: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  sendQueued(msg: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  sendQuote(msg: string): Promise<void> {
    return Promise.resolve(undefined)
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
