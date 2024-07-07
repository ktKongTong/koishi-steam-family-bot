import { Session } from 'steam-family-bot-core'
import { ChannelInfo } from '@/db'
import { CommandInteraction } from 'discord.js'

export class DiscordSession implements Session<ChannelInfo> {
  interaction: CommandInteraction
  uid: string
  private replyCnt: number = 0
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction
    this.uid = interaction.user.id.toString()
  }

  getSessionInfo(): any {
    return {
      uid: this.uid,
      channelId: this.interaction.channelId.toString(),
      selfId: 'bs-bot',
      platform: 'cf-discord',
    }
  }
  private async sendAnyway(msg: any) {
    this.replyCnt++
    await this.interaction.followUp(msg)
  }
  async send(msg: string): Promise<void> {
    await this.sendAnyway(msg)
  }

  async sendImageUrl(url: string): Promise<void> {
    const buf = await fetch(url).then((res) => res.arrayBuffer())
    await this.sendAnyway({
      files: [{ attachment: Buffer.from(buf), name: 'image.png' }],
    })
  }

  async sendImgBuffer(content: any, mimeType?: string): Promise<void> {
    await this.sendAnyway({
      files: [{ attachment: content, name: 'image.png' }],
    })
  }
  async sendQueued(msg: string): Promise<void> {
    await this.sendAnyway(msg)
  }

  async sendQuote(msg: string): Promise<void> {
    await this.sendAnyway(msg)
  }

  text(path: string, params?: object): string {
    return ''
  }

  sendImgUrl(url: string): Promise<void> {
    return Promise.resolve(undefined)
  }
}
