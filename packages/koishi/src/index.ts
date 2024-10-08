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
  loadI18nConfig,
} from './interface'

import {} from 'koishi-plugin-cron'
import { dbInit } from '@/db'
import {
  steamCommands,
  Command,
  SteamAccountFamilyRel,
  TmpFileStorage,
} from 'steam-family-bot-core'
import { SteamService } from '@/services'
import { KSession } from '@/session'
import { KoishiImgRender } from '@/utils/render'
import { load } from 'js-yaml'
export * from './config'

export const name = 'koishi-steam-family-lib-monitor'

export const inject = {
  required: ['database', 'cron'],
  optional: ['puppeteer'],
}

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
  const i18n = config.i18nMap
  Object.keys(i18n).forEach((k) => {
    try {
      const v = i18n[k]
      loadI18nConfig(k, load(v))
    } catch (e) {
      baseLogger.error(`load i18n ${k} error`, e)
    }
  })
  dbInit(ctx, config)
  const registerCmd = registerFn(ctx, config)
  steamCommands<ChannelInfo>().map(registerCmd)
  ctx
    .command('slm <prompts:text>')
    .alias('slm')
    .action(async ({ session, options }, input) => {
      await session.send(input)
    })
  schedules(ctx, config, baseLogger)
}

const regex = /^(.+):(.+?)\??$/
function extractKoiOptionDesc(description: string) {
  let desc = description
  const [, fullname, type] = regex.exec(desc)
  const optional = desc.endsWith('?')
  desc = `${fullname}:${type}`
  desc = optional ? `[${desc}]` : `<${desc}>`
  return desc
}

const registerFn = (ctx: Context, config: Config) => {
  //@ts-ignore
  const baseLogger = ctx.logger('steam-family-lib-monitor')
  const logger = baseLogger.extend('cmd')
  const steamService = new SteamService<ChannelInfo>(ctx, config)
  const render = new KoishiImgRender(ctx, config)
  let tmpFileStorage
  if (config.uploadImageToS3.enable) {
    tmpFileStorage = new TmpFileStorage(config)
  }
  return (c: Command<ChannelInfo>) => {
    let cmd = ctx.command(`slm.${c.name}`)
    cmd = c.aliases.reduce(
      (acc, alias) =>
        alias.option
          ? acc.alias(alias.alias, alias.option)
          : acc.alias(alias.alias),
      cmd
    )

    cmd = c.options.reduce(
      (acc, option) =>
        acc.option(option.name, extractKoiOptionDesc(option.description)),
      cmd
    )

    cmd.action(async ({ session, options }, input) => {
      const kSession = new KSession(session, tmpFileStorage)
      await c.callback({
        render,
        steamService,
        logger,
        session: kSession,
        options,
        input,
        rawInput: input,
      })
    })
  }
}
