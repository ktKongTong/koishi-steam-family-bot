import { Context } from 'koishi'
import schedules from './schedules'

import {
  SteamFamilyLibSubscribe,
  SteamAccount,
  SteamFamilyLib,
  SteamRelateChannelInfo,
  GameInfo,
  ChannelInfo,
  Config,
} from './interface'

import {} from 'koishi-plugin-cron'
import {} from 'koishi-plugin-puppeteer'
import { dbInit } from '@/db'
import {
  steamCommands,
  Command,
  SteamAccountFamilyRel,
} from 'steam-family-bot-core'
import { SteamService } from '@/services'
import { KSession } from '@/session-impl'
import { KoishiImgRender } from '@/utils/render'
export * from './config'

export const name = 'koishi-steam-family-lib-monitor'

export const inject = ['database', 'puppeteer', 'cron']

declare module 'koishi' {
  interface Tables {
    SteamAccount: SteamAccount
    SteamFamilyLibSubscribe: SteamFamilyLibSubscribe
    SteamFamilyLib: SteamFamilyLib
    SteamRelateChannelInfo: SteamRelateChannelInfo<ChannelInfo>
    SteamGameInfo: GameInfo
    SteamAccountFamilyRel: SteamAccountFamilyRel
  }
  interface Context {
    http: any
  }
}

export function apply(ctx: Context, config: Config) {
  // @ts-ignore
  const baseLogger = ctx.logger('steam-family-lib-monitor')
  dbInit(ctx, config)
  const logger = baseLogger.extend('cmd')
  const steam = new SteamService<ChannelInfo>(ctx, config)
  const render = new KoishiImgRender(ctx, config)
  steamCommands<ChannelInfo>().forEach((c: Command<ChannelInfo>) => {
    let cmd = ctx.command(c.name)
    for (const alias of c.aliases) {
      if (alias.option) {
        cmd = cmd.alias(alias.alias, alias.option)
      } else {
        cmd = cmd.alias(alias.alias)
      }
    }
    for (const option of c.options) {
      let desc = option.description
      const regex = /^(.+):(.+?)\??$/
      const [, fullname, type] = regex.exec(desc)
      const optional = desc.endsWith('?')
      desc = `${fullname}:${type}`
      if (optional) {
        desc = `[${desc}]`
      } else {
        desc = `<${desc}>`
      }
      cmd = cmd.option(option.name, desc)
    }
    cmd.action(async ({ session, options }, input) => {
      const kSession = new KSession(session)
      await c.callback(render, steam, logger, kSession, options, input, input)
    })
  })
  ctx
    .command('slm <prompts:text>')
    .alias('slm')
    .action(async ({ session, options }, input) => {
      await session.send(input)
    })
  schedules(ctx, config, baseLogger)
}
