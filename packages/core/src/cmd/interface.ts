// eslint-disable
import { ImgRender } from '@/render'
import { ISteamService, Session } from '@/interface'
import { Logger } from '@/interface/logger'

interface CmdContext<CHANNEL, OPT extends object = object> {
  render: ImgRender
  steamService: ISteamService<CHANNEL>
  logger: Logger
  session: Session
  options: OPT
  input: string
  rawInput: string
}

export type CmdExecutor<CHANNEL, OPT extends object = object> = (
  c: CmdContext<CHANNEL, OPT>
) => Promise<void>

export interface CmdOption {
  type: 'boolean' | 'number' | 'string' | 'null' | 'undefined'
  name: string
  short?: string
  description?: string
  required?: boolean
}

export type CmdAlias = {
  alias: string
  option?: object
}

export interface Command<CHANNEL> {
  name: string
  description: string
  aliases: CmdAlias[]
  options: CmdOption[]
  callback: CmdExecutor<CHANNEL>
  children: Command<CHANNEL>[]
}
