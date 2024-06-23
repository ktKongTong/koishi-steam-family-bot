// eslint-disable
import { ImgRender } from '@/render'
import { ISteamService, Session } from '@/interface'
import { Logger } from '@/interface/logger'

export type CmdExecutor<OPT extends object = object> = (
  render: ImgRender,
  steamService: ISteamService,
  logger: Logger,
  session: Session,
  options: OPT,
  input: string,
  rawInput: string
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
export interface Command {
  name: string
  description: string
  aliases: CmdAlias[]
  options: CmdOption[]
  callback: CmdExecutor
  children: Command[]
}
