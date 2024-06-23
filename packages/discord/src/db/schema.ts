import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

export const accountStatusEnum = pgEnum('accountStatus', [
  'unknown',
  'valid',
  'invalid',
])
export const steamLibTypeEnum = pgEnum('steamLibTypeEnum', ['lib', 'wish'])

export const accounts = pgTable(
  'steam_account',
  {
    id: serial('id').primaryKey(),
    accountName: varchar('name', { length: 256 }),
    steamId: varchar('steam_id', { length: 256 }),
    steamAccessToken: text('steam_access_token'),
    steamRefreshToken: text('steam_refresh_token'),
    lastRefreshTime: text('last_refresh_time').notNull(),

    // timestamp('lastRefreshTime', {withTimezone: true}).defaultNow(),
    status: accountStatusEnum('status').notNull().default('valid'),
  },
  (accounts) => {
    return {
      steamIdIndex: index('steamid_idx').on(accounts.steamId),
    }
  }
)
export const accountFamilyRel = pgTable(
  'account_family_rel',
  {
    steamId: varchar('steam_id', { length: 256 }),
    familyId: varchar('family_id', { length: 256 }),
  },
  (rel) => {
    return {
      familyIdIndex: index('family_id_index').on(rel.familyId),
      steamIdIndex: index('steam_id_index').on(rel.steamId),
      pk: primaryKey({
        columns: [rel.steamId, rel.familyId],
      }),
    }
  }
)

export const SteamFamilyLib = pgTable(
  'steam_family_lib',
  {
    familyId: text('family_id').default(''),
    appId: integer('appid').default(0),
    steamIds: text('steam_ids').default(''),
    name: text('name').default(''),
    rtTimeAcquired: integer('rt_time_acquired').default(0),
    type: steamLibTypeEnum('type').default('lib').notNull(),
    lastModifiedAt: integer('last_modified_at').default(0),
  },
  (lib) => {
    return {
      // index: uniqueIndex('family_id_type_idx').on(lib.familyId, lib.type),
      pk: primaryKey({
        columns: [lib.familyId, lib.appId, lib.type],
      }),
    }
  }
)

export const SteamFamilyLibSubscribe = pgTable('steam_familyLib_subscribe', {
  id: serial('id').primaryKey(),
  steamFamilyId: text('steam_family_id').default(''),
  steamAccountId: text('steam_account_id'),
  accountId: integer('account_id').references(() => accounts.id),
  preferGameImgType: text('prefer_game_img_type').default('libraryCapsule2x'),
  subLib: boolean('sub_lib').notNull().default(true),
  subWishes: boolean('sub_wishes').notNull().default(false),
  active: boolean('active').notNull().default(true),
})

export const SteamGameInfo = pgTable('steam_game_info', {
  appid: integer('appid').primaryKey().default(0),
  name: text('name').default(''),
  aliases: text('aliases').default(''),
  top20Tags: text('top_20_tags').default(''),
  lastRefreshedAt: integer('last_refreshed_at').notNull(),
})

export const SteamRelateChannelInfo = pgTable(
  'steam_relate_channel_info',
  {
    refId: integer('ref_id').default(0),
    type: text('type').default(''),
    // channelInfo
    platform: text('platform').default(''),
    selfId: text('self_id').default(''),
    channelId: text('channel_id').default(''),
    uid: text('uid').default(''),
  },
  (ref) => {
    return {
      pk: primaryKey({
        columns: [ref.refId, ref.type],
      }),
    }
  }
)
