type ChannelInfo = any

// now it's only for initiative message
export interface BotService<T extends ChannelInfo, S extends Session<T>> {
  getSessionByChannelInfo(channelInfo: T): S
}

// @ts-ignore
export interface Session<T extends any = any> {
  uid: string
  getSessionInfo(): T
  sendImgBuffer(content: any, mimeType?: string): Promise<void>
  sendImgUrl(url: string): Promise<void>
  // i18n
  text(path: string, params?: object): string
  send(msg: string): Promise<void>
  sendQueued(msg: string): Promise<void>
  sendQuote(msg: string): Promise<void>
}

enum MessageType {
  LibMonitorGameChange,
  LibMonitorGameImage,
  LibMonitorGameStore,
}
