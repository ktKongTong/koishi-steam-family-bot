import { Context } from 'koishi'
import { Config } from '../interface'

declare module 'koishi' {
  interface Context {
    model: any
  }
}

export function dbInit(ctx: Context, config: Config) {
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
    'SteamAccountFamilyRel',
    {
      steamId: 'string',
      familyId: 'string',
    },
    {
      primary: ['familyId', 'steamId'],
    }
  )
  ctx.model.extend(
    'SteamAccount',
    {
      id: 'unsigned',
      // familyId: 'string',
      accountName: 'string',
      steamId: 'string',
      steamAccessToken: 'string',
      steamRefreshToken: 'string',
      lastRefreshTime: 'string',
      status: 'string',
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
      preferGameImgType: {
        type: 'string',
        initial: 'libraryCapsule2x',
      },
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
      top20Tags: 'string',
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
      tags: 'string',
      tagSynced: 'boolean',
    },
    async (database) => {
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
          top20Tags: item.tags,
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
      uid: 'string',
    },
    async (database) => {
      const data = await database.get('SteamAccount', {}, ['id', 'uid'])
      const migrateData = data.map((item) => {
        return {
          refId: item.id,
          type: 'account',
          uid: item.uid,
        }
      })
      await database.upsert('SteamRelateChannelInfo', migrateData)
    }
  )
  // @ts-ignore
  ctx.model.migrate(
    'SteamFamilyLibSubscribe',
    {
      platform: 'string',
      selfId: 'string',
      channelId: 'string',
      uid: 'string',
    },
    async (database) => {
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
          platform: item.platform,
          selfId: item.selfId,
          channelId: item.channelId,
          uid: item.uid,
        }
      })
      await database.upsert('SteamRelateChannelInfo', migrateData)
    }
  )

  ctx.model.migrate(
    'SteamAccount',
    {
      familyId: 'string',
    },
    async (database) => {
      const accounts = await database.get('SteamAccount', {})
      const data = accounts.map((item) => ({
        steamId: item.steamId,
        familyId: item.familyId,
      }))
      await database.upsert('SteamAccountFamilyRel', data)
    }
  )
}
