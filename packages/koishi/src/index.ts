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
import { dbInit } from './db'
import { SteamAccountFamilyRel } from 'steam-family-bot-core'
import { steamCommands } from 'steam-family-bot-core'
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
  const steam = new SteamService(ctx, config)
  const render = new KoishiImgRender(ctx, config)
  steamCommands.forEach((c, idx: number) => {
    ctx.command(c.name).action(async ({ session, options }, input) => {
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
