import { Msg, Session } from 'steam-family-bot-core'
import { ChannelInfo } from '../db'
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
    console.log(`reply, ${this.replyCnt}`)
    await this.interaction.followUp(msg)
  }
  async send(msg: string): Promise<void> {
    await this.sendAnyway(msg)
  }

  async sendMsg(msg: Msg): Promise<void> {
    if (msg.type === 'image') {
      const buf = await fetch(msg.content).then((res) => res.arrayBuffer())
      await this.sendAnyway({
        files: [{ attachment: Buffer.from(buf), name: 'image.png' }],
      })
    } else {
      await this.sendAnyway(msg.content)
    }
  }

  async sendQueued(msg: string): Promise<void> {
    await this.sendAnyway(msg)
  }

  async sendQuote(msg: string): Promise<void> {
    await this.sendAnyway(msg)
  }
}
