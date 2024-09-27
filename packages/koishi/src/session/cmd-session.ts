import { Session, tran, TmpFileStorage } from 'steam-family-bot-core'
import { ChannelInfo } from '@/interface'

import { h, Session as KoiSession } from 'koishi'
export class KSession implements Session<ChannelInfo> {
  // create a session Object?
  private readonly session: KoiSession
  uid: string
  lang: string
  store: TmpFileStorage | undefined
  constructor(
    session: KoiSession,
    tmpFileStorage?: TmpFileStorage | undefined
  ) {
    this.session = session
    this.uid = session.uid
    this.lang = 'zh-cn'
    this.store = tmpFileStorage
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
    if (this.store) {
      const url = await this.store.uploadImg(content, mimeType)
      return await this.sendImgUrl(url)
    }
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
