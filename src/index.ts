import {Context} from 'koishi'
import {schedules} from "./schedules";
import {Config} from "./config";
import Cmd, {LoginCmd, SubCmd} from "./cmd";
import {Account} from "./interface/players";
export const name = 'koishi-steam-family-lib-monitor'


export const inject = ['database','puppeteer']

declare module 'koishi' {
  interface Tables {
    SteamAccount:SteamAccount,
    SteamFamilyLibSubscribe: SteamFamilyLibSubscribe,
    SteamFamilyLib:SteamFamilyLib,
    SteamFamilyWishes: SteamFamilyWishes
  }
  interface User {
    // accounts: Account[];
  }
}

interface SteamAccount {
  id: number,
  familyId: string,
  steamId: string,
  steamAccessToken: string,
  steamRefreshToken: string,
  lastRefreshTime: string,
  valid: string
}
interface SteamFamilyWishes {

  id: number,
  familyId: string,
  name: string,
  appId: number,
  //
  wisherSteamIds: string,
}
interface SteamFamilyLib {
  id: number,
  familyId: string,
  // name: string,
  appId: number,
  //
  ownerSteamIds: string,
  // wisherSteamIds: string[],
  // type: lib/wishes
}
interface SteamFamilyLibSubscribe {
  id: number,
  platform: string,
  selfId: string,
  channelId: string|null,
  uid: string,
  steamFamilyId: string,
  steamAccountId: string,
  subLib: boolean,
  subWishes: boolean
}
export * from './config'

//
function pluginInit(ctx: Context, config:Config) {
  // const zhLocal = require('./locales/zh-CN')
  // ctx.i18n.define('zh-CN', zhLocal)
  ctx.model.extend('SteamFamilyLib', {
    familyId: 'string',
    appId: 'integer',
    ownerSteamIds: 'string',
  },{
    primary: ['familyId', 'appId'],
  })
  ctx.model.extend('SteamAccount', {
    id: 'unsigned',
    familyId: 'string',
    steamId: 'string',
    steamAccessToken: 'string',
    steamRefreshToken: 'string',
    lastRefreshTime: 'string',
    valid:'string',

  }, {

  })
  ctx.model.extend('SteamFamilyLibSubscribe', {
    // 各字段的类型声明
    id: 'unsigned',
    uid: 'string',
    channelId: 'string',
    selfId: 'string',
    platform: 'string',
    steamFamilyId: 'string',
    // steamAccountId: 'string',
    // subLib: 'boolean',
    // subWishes: 'boolean'
  },{
    autoInc: true
  })
  ctx.model.extend('SteamFamilyWishes', {
    name: 'string',
    familyId: 'string',
    appId: 'integer',
    wisherSteamIds: 'string',
  },{
    primary: ['familyId', 'appId'],
  })
}

export function apply(ctx: Context, config: Config) {
  pluginInit(ctx, config)
  const cmd = new Cmd(ctx,config)
  cmd.apply(SubCmd)
  cmd.apply(LoginCmd)
  ctx.command('slm <prompts:text>')
  .alias('slm')
  .action(async ({ session, options }, input) => {
    session.send(input)
  })
  schedules(ctx,config)
}
