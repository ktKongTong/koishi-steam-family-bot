import { Context } from 'koishi'
import schedules from './schedules'
import Cmd, {
  ClearCmd,
  LoginCmd,
  QueryCmd,
  refreshCmd,
  StatisticCmd,
  SubCmd,
  UnSubCmd,
} from './cmd'

import {
  SteamFamilyLibSubscribe,
  SteamAccount,
  SteamFamilyLib,
  SteamRelateChannelInfo,
  GameInfo,
  ChannelInfo,
} from './interface'

import {} from 'koishi-plugin-cron'
import {} from 'koishi-plugin-puppeteer'
import { Config } from './interface'
import { dbInit } from './db'
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
  }
}

export function apply(ctx: Context, config: Config) {
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
  ctx
    .command('slm <prompts:text>')
    .alias('slm')
    .action(async ({ session, options }, input) => {
      await session.send(input)
    })
  schedules(ctx, config, baseLogger)
}
