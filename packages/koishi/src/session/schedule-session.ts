import { Session, tran } from 'steam-family-bot-core'
import { ChannelInfo } from '@/interface'
import { Bot, h } from 'koishi'

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
