import { Database, Tables, $ } from 'koishi'

import {
  ISteamFamilyLibSubscribeDAO,
  SteamAccountFamilyRel,
  SteamFamilyLibSubscribe,
  ChannelInfo,
} from '@/interface'

export class SubscriptionDAO<T> implements ISteamFamilyLibSubscribeDAO<T> {
  db: Database<Tables>
  constructor(db: Database<Tables>) {
    this.db = db
  }

  async getSubscriptionBySessionUId(
    uid: string
  ): Promise<SteamFamilyLibSubscribe> {
    const res = await this.db
      .join(
        ['SteamRelateChannelInfo', 'SteamFamilyLibSubscribe'],
        (channel, sub) =>
          $.and($.eq(channel.refId, sub.id), $.eq(channel.type, 'sub'))
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamRelateChannelInfo.uid, uid),
          $.eq(row.SteamRelateChannelInfo.type, 'sub'),
          $.eq(row.SteamFamilyLibSubscribe.id, row.SteamRelateChannelInfo.refId)
        )
      })
      .execute()
    return res?.[0]?.SteamFamilyLibSubscribe
  }

  async removeSubscriptionBySessionUId(uid: string): Promise<void> {
    await this.db.withTransaction(async (db) => {
      const res = await db
        .join(
          ['SteamFamilyLibSubscribe', 'SteamRelateChannelInfo'],
          (sub, channel) =>
            $.and($.eq(sub.id, channel.refId), $.eq(channel.type, 'sub'))
        )
        .where((row) => {
          return $.and(
            $.eq(row.SteamRelateChannelInfo.uid, uid),
            $.eq(row.SteamRelateChannelInfo.type, 'sub'),
            $.eq(
              row.SteamFamilyLibSubscribe.id,
              row.SteamRelateChannelInfo.refId
            )
          )
        })
        .execute()
      await db.remove('SteamFamilyLibSubscribe', {
        id: res.map((it) => it.SteamFamilyLibSubscribe.id),
      })
      await db.remove('SteamRelateChannelInfo', {
        refId: res.map((it) => it.SteamFamilyLibSubscribe.id),
      })
    })
  }

  async removeSubscriptionBySteamId(steamId: string): Promise<void> {
    await this.db.withTransaction(async (db) => {
      const res = await db
        .join(
          ['SteamRelateChannelInfo', 'SteamFamilyLibSubscribe'],
          (channel, sub) =>
            $.and($.eq(channel.refId, sub.id), $.eq(channel.type, 'sub'))
        )
        .where((row) => {
          return $.and(
            $.eq(row.SteamFamilyLibSubscribe.steamAccountId, steamId),
            $.eq(row.SteamRelateChannelInfo.type, 'sub'),
            $.eq(
              row.SteamFamilyLibSubscribe.id,
              row.SteamRelateChannelInfo.refId
            )
          )
        })
        .execute()
      await db.remove('SteamFamilyLibSubscribe', {
        id: res.map((it) => it.SteamFamilyLibSubscribe.id),
      })
      await db.remove('SteamRelateChannelInfo', {
        refId: res.map((it) => it.SteamFamilyLibSubscribe.id),
        type: 'sub',
      })
    })
  }

  async updateSubscription(sub: SteamFamilyLibSubscribe): Promise<void> {
    await this.db.upsert('SteamFamilyLibSubscribe', [sub])
  }

  async inactiveSubscription(subId: number): Promise<void> {
    await this.db.set(
      'SteamFamilyLibSubscribe',
      { id: subId },
      { active: false }
    )
  }

  async addSubscription<T>(
    sub: Partial<SteamFamilyLibSubscribe>,
    channelInfo: T
  ): Promise<void> {
    await this.db.withTransaction(async (db) => {
      const res = await db.upsert('SteamFamilyLibSubscribe', [sub])
      const inserted = await db.get('SteamFamilyLibSubscribe', {
        ...sub,
      })
      await db.upsert('SteamRelateChannelInfo', [
        {
          ...channelInfo,
          refId: inserted[0].id,
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
      .join(
        ['SteamFamilyLibSubscribe', 'SteamRelateChannelInfo'],
        (sub, channel) =>
          $.and($.eq(sub.id, channel.refId), $.eq(channel.type, 'sub'))
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamFamilyLibSubscribe.steamFamilyId, familyId),
          $.eq(row.SteamRelateChannelInfo.channelId, chan.channelId)
        )
      })
      .execute()
    return subscribe?.[0]?.SteamFamilyLibSubscribe
  }

  async addFamilyAccountRel(items: SteamAccountFamilyRel[]) {
    await this.db.upsert('SteamAccountFamilyRel', items)
  }
}
