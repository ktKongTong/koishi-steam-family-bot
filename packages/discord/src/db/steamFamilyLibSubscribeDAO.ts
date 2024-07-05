import {
  ISteamFamilyLibSubscribeDAO,
  SteamAccountFamilyRel,
  SteamFamilyLibSubscribe,
} from 'steam-family-bot-core'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as tables from './schema'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import { ChannelInfo } from './index'

export class DrizzleSteamFamilyLibSubscribeDAO
  implements ISteamFamilyLibSubscribeDAO<ChannelInfo>
{
  private db: NodePgDatabase<typeof tables>
  constructor(db: NodePgDatabase<typeof tables>) {
    this.db = db
  }
  async getSubscriptionBySessionUId(
    uid: string
  ): Promise<SteamFamilyLibSubscribe> {
    const res = await this.db
      .select()
      .from(tables.SteamRelateChannelInfo)
      .leftJoin(
        tables.SteamFamilyLibSubscribe,
        and(
          eq(
            tables.SteamRelateChannelInfo.refId,
            tables.SteamFamilyLibSubscribe.id
          ),
          eq(tables.SteamRelateChannelInfo.type, 'sub')
        )
      )
      .where(
        and(
          eq(tables.SteamRelateChannelInfo.uid, uid),
          eq(tables.SteamRelateChannelInfo.type, 'sub'),
          eq(
            tables.SteamFamilyLibSubscribe.id,
            tables.SteamRelateChannelInfo.refId
          )
        )
      )
    // @ts-ignore
    return res?.[0]?.steam_familyLib_subscribe
  }

  async removeSubscriptionBySessionUId(uid: string): Promise<void> {
    await this.db.transaction(async (db) => {
      const res = await db
        .select()
        .from(tables.SteamRelateChannelInfo)
        .leftJoin(
          tables.SteamFamilyLibSubscribe,
          and(
            eq(
              tables.SteamFamilyLibSubscribe.id,
              tables.SteamRelateChannelInfo.refId
            ),
            eq(tables.SteamRelateChannelInfo.type, 'sub')
          )
        )
        .where(eq(tables.SteamRelateChannelInfo.uid, uid))
      await db.delete(tables.SteamFamilyLibSubscribe).where(
        inArray(
          tables.SteamFamilyLibSubscribe.id,
          // @ts-ignore
          res.map((it) => it.SteamFamilyLibSubscribe.id)
        )
      )
      await db.delete(tables.SteamRelateChannelInfo).where(
        inArray(
          tables.SteamRelateChannelInfo.refId,
          // @ts-ignore
          res.map((it) => it.SteamFamilyLibSubscribe.id)
        )
      )
    })
  }

  async removeSubscriptionBySteamId(steamId: string): Promise<void> {
    await this.db.transaction(async (db) => {
      const res = await db
        .select()
        .from(tables.SteamRelateChannelInfo)
        .leftJoin(
          tables.SteamFamilyLibSubscribe,
          and(
            eq(
              tables.SteamFamilyLibSubscribe.id,
              tables.SteamRelateChannelInfo.refId
            ),
            eq(tables.SteamRelateChannelInfo.type, 'sub')
          )
        )
        .where(eq(tables.SteamFamilyLibSubscribe.steamAccountId, steamId))

      await db.delete(tables.SteamFamilyLibSubscribe).where(
        inArray(
          tables.SteamFamilyLibSubscribe.id,
          // @ts-ignore
          res.map((it) => it.SteamFamilyLibSubscribe.id)
        )
      )
      await db.delete(tables.SteamRelateChannelInfo).where(
        inArray(
          tables.SteamRelateChannelInfo.refId,
          // @ts-ignore
          res.map((it) => it.SteamFamilyLibSubscribe.id)
        )
      )
    })
  }

  async updateSubscription(sub: SteamFamilyLibSubscribe): Promise<void> {
    this.db
      .insert(tables.SteamFamilyLibSubscribe)
      .values([sub])
      .onConflictDoUpdate({
        target: tables.SteamFamilyLibSubscribe.id,
        set: sub,
      })
  }

  async inactiveSubscription(subId: number): Promise<void> {
    await this.db
      .update(tables.SteamFamilyLibSubscribe)
      .set({ active: false })
      .where(eq(tables.SteamFamilyLibSubscribe.id, subId))
  }

  async addSubscription<T>(
    sub: Partial<SteamFamilyLibSubscribe>,
    channelInfo: T
  ): Promise<void> {
    await this.db.transaction(async (db) => {
      const res = await this.db
        .insert(tables.SteamFamilyLibSubscribe)
        .values([sub])
        .onConflictDoUpdate({
          target: tables.SteamFamilyLibSubscribe.id,
          set: sub,
        })
        .returning({
          id: tables.SteamFamilyLibSubscribe.id,
        })
      await this.db.insert(tables.SteamRelateChannelInfo).values([
        {
          ...channelInfo,
          refId: res[0].id,
          type: 'sub',
        },
      ])
    })
  }

  async getSubscriptionByChannelInfoAndFamilyId<T>(
    familyId: string,
    channel: T
  ): Promise<SteamFamilyLibSubscribe> {
    const chan = channel as ChannelInfo
    const subscribe = await this.db
      .select()
      .from(tables.SteamFamilyLibSubscribe)
      .leftJoin(
        tables.SteamRelateChannelInfo,
        and(
          eq(
            tables.SteamFamilyLibSubscribe.id,
            tables.SteamRelateChannelInfo.refId
          ),
          eq(tables.SteamRelateChannelInfo.type, 'sub')
        )
      )
      .where(
        // @ts-ignore
        and(
          // @ts-ignore
          familyId
            ? eq(tables.SteamFamilyLibSubscribe.steamFamilyId, familyId)
            : isNotNull(tables.SteamFamilyLibSubscribe.steamFamilyId),
          // @ts-ignore
          eq(tables.SteamRelateChannelInfo.channelId, chan.channelId)
        )
      )
    // @ts-ignore
    return subscribe?.[0]?.steam_familyLib_subscribe
  }

  async addFamilyAccountRel(items: SteamAccountFamilyRel[]) {
    await this.db
      .insert(tables.accountFamilyRel)
      .values(items)
      .onConflictDoNothing()
  }
}
