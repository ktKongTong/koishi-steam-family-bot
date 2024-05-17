import {Context} from 'koishi'
import schedules from "./schedules/index";
import {Config} from "./config";
import Cmd, {LoginCmd, SubCmd} from "./cmd";
export const name = 'koishi-steam-family-lib-monitor'

import {} from 'koishi-plugin-cron'


export const inject = ['database','cron']

declare module 'koishi' {
  interface Tables {
    SteamAccount:SteamAccount,
    SteamFamilyLibSubscribe: SteamFamilyLibSubscribe,
    SteamFamilyLib:SteamFamilyLib,
  }
}

export interface SteamAccount {
  id: number,
  uid: string,
  accountName: string,
  familyId: string,
  steamId: string,
  steamAccessToken: string,
  steamRefreshToken: string,
  lastRefreshTime: string,
  valid: string
}
export interface SteamFamilyLib {
  id: number,
  familyId: string,
  name?: string,
  appId: number,
  // for wishes -> wisherSteamIds / lib -> ownerSteamIds
  steamIds: string,
  type: 'lib'|'wish'
}
export interface SteamFamilyLibSubscribe {
  id: number,
  platform: string,
  selfId: string,
  channelId: string|null,
  uid: string,
  steamFamilyId: string,
  steamAccountId: string,
  accountId: number,
  subLib: boolean,
  subWishes: boolean,
  active: boolean,
}
export * from './config'

//
function pluginInit(ctx: Context, config:Config) {
  // const zhLocal = require('./locales/zh-CN')
  // ctx.i18n.define('zh-CN', zhLocal)
  ctx.model.extend('SteamFamilyLib', {
    familyId: 'string',
    appId: 'integer',
    steamIds: 'string',
    name: 'string',
    type:'string'
  },{
    primary: ['familyId', 'appId','type'],
  })
  ctx.model.extend('SteamAccount', {
    id: 'unsigned',
    uid: 'string',
    familyId: 'string',
    accountName: 'string',
    steamId: 'string',
    steamAccessToken: 'string',
    steamRefreshToken: 'string',
    lastRefreshTime: 'string',
    valid:'string',
  }, {
    autoInc: true
  })
  ctx.model.extend('SteamFamilyLibSubscribe', {
    // 各字段的类型声明
    id: 'unsigned',
    uid: 'string',
    channelId: 'string',
    selfId: 'string',
    platform: 'string',
    steamFamilyId: 'string',
    steamAccountId: 'string',
    accountId: 'unsigned',
    // subOptions: 'json',
    subLib: 'boolean',
    subWishes: 'boolean',
    active: 'boolean'
  },{
    autoInc: true,
    foreign: {
      uid: ['user', 'id'],
      accountId: ['SteamAccount','id'],
      steamAccountId: ['SteamAccount','steamId']
    },
  })
}

export function apply(ctx: Context, config: Config) {
  pluginInit(ctx, config)
  const cmd = new Cmd(ctx,config)
  cmd
    .apply(SubCmd)
    .apply(LoginCmd)
  ctx.command('slm <prompts:text>')
  .alias('slm')
  .action(async ({ session, options }, input) => {
    session.send(input)
  })
  schedules(ctx,config)
}
