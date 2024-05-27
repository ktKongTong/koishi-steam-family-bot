import { Context } from 'koishi'
import schedules from './schedules/index'
import { Config } from './config'
import Cmd, {
  ClearCmd,
  LoginCmd,
  QueryCmd,
  refreshCmd,
  StatisticCmd,
  SubCmd,
} from './cmd'

export const name = 'koishi-steam-family-lib-monitor'

import {
  SteamFamilyLibSubscribe,
  SteamAccount,
  SteamFamilyLib,
  SteamRelateChannelInfo,
  GameInfo,
} from './interface'

import {} from 'koishi-plugin-cron'
import {} from 'koishi-plugin-puppeteer'

export const inject = ['database', 'puppeteer', 'cron']

declare module 'koishi' {
  interface Tables {
    SteamAccount: SteamAccount
    SteamFamilyLibSubscribe: SteamFamilyLibSubscribe
    SteamFamilyLib: SteamFamilyLib
    SteamRelateChannelInfo: SteamRelateChannelInfo
    SteamGameInfo: GameInfo
  }
}

export * from './config'

function pluginInit(ctx: Context, config: Config) {
  // const zhLocal = require('./locales/zh-CN')
  // ctx.i18n.define('zh-CN', zhLocal)
  ctx.model.extend(
    'SteamFamilyLib',
    {
      familyId: 'string',
      appId: 'integer',
      steamIds: 'string',
      name: 'string',
      rtTimeAcquired: 'unsigned',
      type: 'string',
      lastModifiedAt: 'unsigned',
    },
    {
      primary: ['familyId', 'appId', 'type'],
    }
  )
  ctx.model.extend(
    'SteamAccount',
    {
      id: 'unsigned',
      familyId: 'string',
      accountName: 'string',
      steamId: 'string',
      steamAccessToken: 'string',
      steamRefreshToken: 'string',
      lastRefreshTime: 'string',
      valid: 'string',
    },
    {
      autoInc: true,
    }
  )
  ctx.model.extend(
    'SteamFamilyLibSubscribe',
    {
      id: 'unsigned',
      steamFamilyId: 'string',
      steamAccountId: 'string',
      accountId: 'unsigned',
      // subOptions: 'json',
      subLib: 'boolean',
      subWishes: 'boolean',
      active: 'boolean',
    },
    {
      autoInc: true,
      foreign: {
        accountId: ['SteamAccount', 'id'],
        steamAccountId: ['SteamAccount', 'steamId'],
      },
    }
  )

  ctx.model.extend(
    'SteamRelateChannelInfo',
    {
      // reference to steamAccount or Subscription
      refId: 'unsigned',
      type: 'string',
      platform: 'string',
      selfId: 'string',
      channelId: 'string',
      uid: 'string',
    },
    {
      autoInc: false,
      primary: ['refId', 'type'],
    }
  )

  ctx.model.extend(
    'SteamGameInfo',
    {
      appid: 'unsigned',
      name: 'string',
      aliases: 'text',
      tags: 'string',
      lastRefreshedAt: {
        type: 'unsigned',
        nullable: false,
      },
    },
    {
      primary: ['appid'],
    }
  )
  ctx.model.migrate(
    'SteamFamilyLibSubscribe',
    {
      // @ts-expect-error
      tags: 'string',
      tagSynced: 'boolean',
    },
    async (database) => {
      // @ts-expect-error
      const data = await database.get('SteamFamilyLib', {}, [
        'appId',
        'name',
        'tags',
        'tagSynced',
      ])
      const migrateData = data.map((item) => {
        return {
          appid: item.appId,
          name: item.name,
          // @ts-expect-error
          tags: item.tags,
          aliases: '',
          lastRefreshedAt: Date.now(),
        }
      })
      await database.upsert('SteamGameInfo', migrateData)
    }
  )

  ctx.model.migrate(
    'SteamAccount',
    {
      // @ts-expect-error
      uid: 'string',
    },
    async (database) => {
      // @ts-expect-error
      const data = await database.get('SteamAccount', {}, ['id', 'uid'])
      const migrateData = data.map((item) => {
        return {
          refId: item.id,
          type: 'account',
          // @ts-expect-error
          uid: item.uid,
        }
      })
      await database.upsert('SteamRelateChannelInfo', migrateData)
    }
  )
  ctx.model.migrate(
    'SteamFamilyLibSubscribe',
    {
      // @ts-expect-error
      platform: 'string',
      selfId: 'string',
      channelId: 'string',
      uid: 'string',
    },
    async (database) => {
      // @ts-expect-error
      const data = await database.get('SteamFamilyLibSubscribe', {}, [
        'id',
        'uid',
        'platform',
        'channelId',
        'selfId',
      ])
      const migrateData = data.map((item) => {
        return {
          refId: item.id,
          type: 'sub',
          // @ts-expect-error
          platform: item.platform,
          // @ts-expect-error
          selfId: item.selfId,
          // @ts-expect-error
          channelId: item.channelId,
          // @ts-expect-error
          uid: item.uid,
        }
      })
      await database.upsert('SteamRelateChannelInfo', migrateData)
    }
  )
}

export async function apply(ctx: Context, config: Config) {
  pluginInit(ctx, config)
  const cmd = new Cmd(ctx, config)
  cmd
    .apply(SubCmd)
    .apply(LoginCmd)
    .apply(StatisticCmd)
    .apply(refreshCmd)
    .apply(ClearCmd)
    .apply(QueryCmd)
  ctx
    .command('slm <prompts:text>')
    .alias('slm')
    .action(async ({ session, options }, input) => {
      session.send(input)
    })
  schedules(ctx, config)
}
