// @ts-nocheck
import {
  FamilyLib,
  GameInfo,
  ISteamFamilySharedLibDAO,
  PartialBy,
  SteamFamilyLib,
} from 'steam-family-bot-core'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js/index'
import * as tables from './schema'
import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm'

export class DrizzleSteamFamilySharedLibDAO
  implements ISteamFamilySharedLibDAO
{
  private db: PostgresJsDatabase<typeof tables>
  constructor(db: PostgresJsDatabase<typeof tables>) {
    this.db = db
  }

  async getSteamFamilyLibByFamilyId(
    familyId: string,
    type?: 'lib' | 'wish'
  ): Promise<(SteamFamilyLib & { info: GameInfo })[]> {
    let condition = or(
      eq(tables.SteamFamilyLib.type, 'lib'),
      eq(tables.SteamFamilyLib.type, 'wish')
    )
    if (type) {
      condition = eq(tables.SteamFamilyLib.type, type)
    }
    const res = await this.db
      .select()
      .from(tables.SteamFamilyLib)
      .leftJoin(
        tables.SteamGameInfo,
        eq(tables.SteamFamilyLib.appId, tables.SteamGameInfo.appid)
      )
      .where(and(condition, eq(tables.SteamFamilyLib.familyId, familyId)))
    return res.map((it) => ({
      ...it.steam_family_lib,
      info: it.steam_game_info,
    }))
  }

  async batchUpsertLibInfo(
    infos: PartialBy<GameInfo, 'aliases' | 'top20Tags'>[]
  ): Promise<void> {
    await this.db
      .insert(tables.SteamGameInfo)
      .values(infos)
      .onConflictDoUpdate({
        target: tables.SteamGameInfo.appid,
        set: {
          lastRefreshedAt: sql.raw(
            `excluded.${tables.SteamGameInfo.lastRefreshedAt.name}`
          ),
          appid: sql.raw(`excluded.${tables.SteamGameInfo.appid.name}`),
          name: sql.raw(`excluded.${tables.SteamGameInfo.name.name}`),
          top20Tags: sql.raw(`excluded.${tables.SteamGameInfo.top20Tags.name}`),
          aliases: sql.raw(`excluded.${tables.SteamGameInfo.aliases.name}`),
        },
      })
  }
  async getUnSyncedLib(limit: number = 500): Promise<SteamFamilyLib[]> {
    const res = await this.db
      .select()
      .from(tables.SteamFamilyLib)
      .leftJoin(
        tables.SteamGameInfo,
        eq(tables.SteamFamilyLib.appId, tables.SteamGameInfo.appid)
      )
      .where(
        or(
          lt(
            tables.SteamGameInfo.lastRefreshedAt,
            Math.floor(Date.now() / 1000) + -14 * 24 * 60 * 60
          ),
          isNull(tables.SteamGameInfo.appid)
        )
      )
      .limit(limit)
    return res.map((it) => it.steam_family_lib)
  }

  async getLibByKeywordAndFamilyId(
    familyId: string,
    queryKey: string
  ): Promise<FamilyLib[]> {
    // const condition = Number.isNaN(parseInt(queryKey)) ? eq(tables.SteamFamilyLib.appId, parseInt(queryKey)) : isNotNull(tables.SteamFamilyLib.appId)
    const res = await this.db
      .select()
      .from(tables.SteamFamilyLib)
      .leftJoin(
        tables.SteamGameInfo,
        eq(tables.SteamFamilyLib.appId, tables.SteamGameInfo.appid)
      )
      .where(
        and(
          eq(tables.SteamFamilyLib.familyId, familyId),
          eq(tables.SteamFamilyLib.type, 'lib'),
          or(
            ilike(tables.SteamFamilyLib.name, escapeRegExp(queryKey)),
            ilike(tables.SteamGameInfo.name, escapeRegExp(queryKey)),
            ilike(tables.SteamGameInfo.aliases, escapeRegExp(queryKey))
          )
        )
      )
    return res.map((it) => it.steam_family_lib)
  }

  getFamilyWishes(familyId: string): Promise<SteamFamilyLib[]> {
    return this.db
      .select()
      .from(tables.SteamFamilyLib)
      .where(
        and(
          eq(tables.SteamFamilyLib.familyId, familyId),
          eq(tables.SteamFamilyLib.type, 'wish')
        )
      )
  }

  async batchRemoveByAppIdAndFamilyId(
    steamFamilyId: string,
    appIds: number[],
    type: 'lib' | 'wish' = 'lib'
  ): Promise<void> {
    await this.db
      .delete(tables.SteamFamilyLib)
      .where(
        and(
          inArray(tables.SteamFamilyLib.appId, appIds),
          eq(tables.SteamFamilyLib.familyId, steamFamilyId),
          eq(tables.SteamFamilyLib.type, 'lib')
        )
      )
  }

  async batchUpsertFamilyLib(libs: Partial<SteamFamilyLib>[]): Promise<void> {
    const s = this.db
      .insert(tables.SteamFamilyLib)
      .values(libs)
      .onConflictDoUpdate({
        target: [
          tables.SteamFamilyLib.familyId,
          tables.SteamFamilyLib.appId,
          tables.SteamFamilyLib.type,
        ],
        set: {
          steamIds: sql.raw(`excluded.${tables.SteamFamilyLib.steamIds.name}`),
          lastModifiedAt: sql.raw(
            `excluded.${tables.SteamFamilyLib.lastModifiedAt.name}`
          ),
          appId: sql.raw(`excluded.${tables.SteamFamilyLib.appId.name}`),
          name: sql.raw(`excluded.${tables.SteamFamilyLib.name.name}`),
          familyId: sql.raw(`excluded.${tables.SteamFamilyLib.familyId.name}`),
        },
      })
      .toSQL().sql
    await this.db
      .insert(tables.SteamFamilyLib)
      .values(libs)
      .onConflictDoUpdate({
        target: [
          tables.SteamFamilyLib.familyId,
          tables.SteamFamilyLib.appId,
          tables.SteamFamilyLib.type,
        ],
        set: {
          steamIds: sql.raw(`excluded.${tables.SteamFamilyLib.steamIds.name}`),
          lastModifiedAt: sql.raw(
            `excluded.${tables.SteamFamilyLib.lastModifiedAt.name}`
          ),
          appId: sql.raw(`excluded.${tables.SteamFamilyLib.appId.name}`),
          name: sql.raw(`excluded.${tables.SteamFamilyLib.name.name}`),
          familyId: sql.raw(`excluded.${tables.SteamFamilyLib.familyId.name}`),
        },
      })
  }

  async refreshLibByFamilyId(
    familyId: string,
    dbContent: SteamFamilyLib[],
    withWishes: boolean = false
  ): Promise<void> {
    await this.db.transaction(async (db) => {
      await db
        .delete(tables.SteamFamilyLib)
        .where(
          and(
            eq(tables.SteamFamilyLib.familyId, familyId),
            withWishes
              ? eq(tables.SteamFamilyLib.type, 'lib')
              : inArray(tables.SteamFamilyLib.type, ['lib', 'wish'])
          )
        )
      await db
        .insert(tables.SteamFamilyLib)
        .values(dbContent)
        .onConflictDoUpdate({
          target: [tables.SteamFamilyLib.familyId, tables.SteamFamilyLib.appId],
          set: {
            steamIds: sql.raw(
              `excluded.${tables.SteamFamilyLib.steamIds.name}`
            ),
            lastModifiedAt: sql.raw(
              `excluded.${tables.SteamFamilyLib.lastModifiedAt.name}`
            ),
            appId: sql.raw(`excluded.${tables.SteamFamilyLib.appId.name}`),
            name: sql.raw(`excluded.${tables.SteamFamilyLib.name.name}`),
            familyId: sql.raw(
              `excluded.${tables.SteamFamilyLib.familyId.name}`
            ),
          },
        })
    })
  }
}

function escapeRegExp(str: string) {
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&%')
  return `%${escaped}%`
}
