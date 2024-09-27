import { Session, tran, TmpFileStorage } from 'steam-family-bot-core'
import { ChannelInfo } from '@/interface'
import { Bot, h } from 'koishi'

export class KoishiSession implements Session<ChannelInfo> {
  bot: Bot
  channelInfo: ChannelInfo
  uid: string
  lang: string
  store: TmpFileStorage | undefined

  constructor(bot: Bot, channelInfo: ChannelInfo, store?: TmpFileStorage) {
    this.lang = 'zh-cn'
    this.bot = bot
    this.uid = channelInfo.uid
    this.channelInfo = channelInfo
    this.store = store
  }

  async sendImgUrl(url: string): Promise<void> {
    await this.bot.sendMessage(
      this.channelInfo.channelId,
      h('message', [h('img', { src: url })])
    )
  }

  async sendImgBuffer(content: Buffer, mimeType?: string): Promise<void> {
    if (this.store) {
      const url = await this.store.uploadImg(content, mimeType)
      return await this.sendImgUrl(url)
    }
    await this.bot.sendMessage(
      this.channelInfo.channelId,
      h.image(content, mimeType ?? 'image/png')
    )
  }
  getSessionInfo(): ChannelInfo {
    return this.channelInfo
  }

  async send(msg: string): Promise<void> {
    await this.bot.sendMessage(this.channelInfo.channelId, msg)
  }

  async sendQueued(msg: string): Promise<void> {
    await this.bot.sendMessage(this.channelInfo.channelId, msg)
  }

  sendQuote(msg: string): Promise<void> {
    throw Error('unsupport quote reply in passive msg')
  }

  text(path: string, params: object = {}): string {
    const res = tran(path, params, 'zh-cn')
    return res ?? path
  }
}
