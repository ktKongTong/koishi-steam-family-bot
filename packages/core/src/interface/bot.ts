type ChannelInfo = any

// now it's only for initiative message
export interface BotService<T extends ChannelInfo, S extends Session> {
  getSessionByChannelInfo(channelInfo: T): S
}

export interface Msg {
  type: 'string' | 'image'
  content: string
  // quote
}

export interface Session {
  sendMsg(msg: Msg): Promise<void>
}

enum MessageType {
  LibMonitorGameChange,
  LibMonitorGameImage,
  LibMonitorGameStore,
}
