import { Context } from 'koishi'
import schedules from './schedules'
import Cmd, {
  BindCmd,
  ClearCmd,
  InfoCmd,
  LoginCmd,
  QueryCmd,
  refreshCmd,
  StatisticCmd,
  SubCmd,
  UnBindCmd,
  UnSubCmd,
} from './cmd'

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
  const cmd = new Cmd(ctx, config, baseLogger)
  cmd
    .apply(SubCmd)
    .apply(UnSubCmd)
    .apply(LoginCmd)
    .apply(StatisticCmd)
    .apply(refreshCmd)
    .apply(ClearCmd)
    .apply(QueryCmd)
    .apply(InfoCmd)
    .apply(BindCmd)
    .apply(UnBindCmd)
  ctx
    .command('slm <prompts:text>')
    .alias('slm')
    .action(async ({ session, options }, input) => {
      await session.send(input)
    })
  schedules(ctx, config, baseLogger)
}
