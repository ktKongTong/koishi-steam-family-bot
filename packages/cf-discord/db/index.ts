import { IDBService, SteamAccount, SubscribeInfo } from 'steam-family-bot-core'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
//@ts-ignore
import postgres from 'postgres'
import * as tables from './schema'
import { DrizzleAccountDAO } from './accountDAO'
import { DrizzleSteamFamilySharedLibDAO } from './steamFamilySharedLibDAO'
import { DrizzleSteamFamilyLibSubscribeDAO } from './steamFamilyLibSubscribeDAO'
import { and, eq, inArray } from 'drizzle-orm'

export type ChannelInfo = {
  channelId: string
}

export class DBService extends IDBService {
  private db: PostgresJsDatabase<typeof tables>
  constructor(c: string) {
    const client = postgres(c)
    const db = drizzle(client, {
      schema: tables,
    })
    const accountDAO = new DrizzleAccountDAO(db)
    const familyLibDAO = new DrizzleSteamFamilySharedLibDAO(db)
    const subscriptionDAO = new DrizzleSteamFamilyLibSubscribeDAO(db)
    super(accountDAO, familyLibDAO, subscriptionDAO)
    this.db = db
  }

  async invalidAccount(id: number, subId: number) {
    await this.db.transaction(async (db) => {
      await this.Subscription.inactiveSubscription(subId)
      await this.Account.invalidAccount(id)
    })
  }

  async clearAccountInfo(account: SteamAccount) {
    const res = await this.db
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
      .where(eq(tables.SteamFamilyLibSubscribe.accountId, tables.accounts.id))

    await this.db.transaction(async (db) => {
      await db
        .delete(tables.SteamFamilyLib)
        .where(
          eq(
            tables.SteamFamilyLib.familyId,
            res?.[0]?.steam_familyLib_subscribe.steamFamilyId ?? ''
          )
        )
      await db
        .delete(tables.accountFamilyRel)
        .where(
          eq(
            tables.accountFamilyRel.familyId,
            res?.[0]?.steam_familyLib_subscribe.steamFamilyId ?? ''
          )
        )
      //@ts-ignore
      await db
        .delete(tables.SteamRelateChannelInfo)
        .where(
          inArray(
            tables.SteamRelateChannelInfo.refId,
            res
              .map((it) => it?.steam_relate_channel_info?.refId)
              .concat([account.id]) ?? []
          )
        )
      await db
        .delete(tables.SteamFamilyLibSubscribe)
        .where(eq(tables.SteamFamilyLibSubscribe.accountId, account.id))
      await db.delete(tables.accounts).where(eq(tables.accounts.id, account.id))
    })
  }

  async getAllSubscription<T>(): Promise<SubscribeInfo<T>[]> {
    const subscribe = await this.db
      .select()
      .from(tables.accounts)
      .innerJoin(
        tables.SteamFamilyLibSubscribe,
        eq(tables.accounts.id, tables.SteamFamilyLibSubscribe.accountId)
      )
      .innerJoin(
        tables.accountFamilyRel,
        and(
          eq(
            tables.SteamFamilyLibSubscribe.steamFamilyId,
            tables.accountFamilyRel.familyId
          ),
          eq(tables.accounts.steamId, tables.accountFamilyRel.steamId)
        )
      )
      .innerJoin(
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
        and(
          eq(tables.SteamFamilyLibSubscribe.active, true),
          eq(tables.accounts.status, 'valid')
        )
      )

    return subscribe.map(
      (item) =>
        ({
          subscription: item.steam_familyLib_subscribe,
          account: item.steam_account,
          steamAndFamilyRel: item.account_family_rel,
          channel: item.steam_relate_channel_info,
        }) as unknown as SubscribeInfo<T>
    )
  }
}
