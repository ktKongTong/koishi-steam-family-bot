import { BotService, Session, tran } from '@/interface'
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
  lang: string
  constructor(session: KoiSession) {
    this.session = session
    this.uid = session.uid
    this.lang = 'zh-cn'
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
  async sendImgUrl(url: string): Promise<void> {
    await this.session.send(h('message', [h('img', { src: url })]))
  }
  async sendImgBuffer(content: any, mimeType?: string): Promise<void> {
    await this.session.send(h.image(content, mimeType ?? 'image/png'))
  }
  async sendQueued(msg: string): Promise<void> {
    await this.session.sendQueued(msg)
  }

  async sendQuote(msg: string): Promise<void> {
    await this.session.sendQueued(msg)
  }

  text(path: string, params: object = {}): string {
    const res = tran(path, params, this.lang)
    return res ?? path
  }
}

export class KoishiSession implements Session<ChannelInfo> {
  bot: Bot
  channelInfo: ChannelInfo
  uid: string
  lang: string
  constructor(bot: Bot, channelInfo: ChannelInfo) {
    this.lang = 'zh-cn'
    this.bot = bot
    this.uid = channelInfo.uid
    this.channelInfo = channelInfo
  }

  async sendImgUrl(url: string): Promise<void> {
    await this.bot.sendMessage(
      this.channelInfo.channelId,
      h('message', [h('img', { src: url })])
    )
  }
  async sendImgBuffer(content: any, mimeType?: string): Promise<void> {
    await this.bot.sendMessage(
      this.channelInfo.channelId,
      h.image(content, mimeType ?? 'image/png')
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

  text(path: string, params: object = {}): string {
    const res = tran(path, params, 'zh-cn')
    return res ?? path
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
