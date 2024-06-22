type ChannelInfo = any

// now it's only for initiative message
export interface BotService<T extends ChannelInfo, S extends Session<T>> {
  getSessionByChannelInfo(channelInfo: T): S
}

export interface Msg {
  type: 'string' | 'image'
  content: string
  // quote
}

// @ts-ignore
export interface Session<T extends any = any> {
  uid: string
  getSessionInfo(): T
  sendMsg(msg: Msg): Promise<void>
  // send
  send(msg: string): Promise<void>
  sendQueued(msg: string): Promise<void>
  sendQuote(msg: string): Promise<void>
}

enum MessageType {
  LibMonitorGameChange,
  LibMonitorGameImage,
  LibMonitorGameStore,
}
