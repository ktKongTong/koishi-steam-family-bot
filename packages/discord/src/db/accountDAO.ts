// @ts-ignore
// @ts-nocheck
import {
  ISteamAccountDAO,
  SteamAccount,
  SteamAccountWithFamilyId,
  SteamRelateChannelInfo,
} from 'steam-family-bot-core'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as tables from './schema'
import { and, eq, sql } from 'drizzle-orm'
import { ChannelInfo } from './index'
export class DrizzleAccountDAO implements ISteamAccountDAO {
  private db: NodePgDatabase<typeof tables>
  constructor(db: NodePgDatabase<typeof tables>) {
    this.db = db
  }

  async getSteamAccountBySessionUid<T>(
    uid: string
  ): Promise<
    SteamAccountWithFamilyId & { channel: SteamRelateChannelInfo<T> }
  > {
    const res = await this.db
      .select()
      .from(tables.accounts)
      .leftJoin(
        tables.SteamRelateChannelInfo,
        and(
          eq(tables.SteamRelateChannelInfo.refId, tables.accounts.id),
          eq(tables.SteamRelateChannelInfo.type, 'account')
        )
      )
      .leftJoin(
        tables.accountFamilyRel,
        eq(tables.accounts.steamId, tables.accountFamilyRel.steamId)
      )
      .where(
        and(
          eq(tables.accounts.id, tables.SteamRelateChannelInfo.refId),
          eq(tables.SteamRelateChannelInfo.uid, uid),
          eq(tables.SteamRelateChannelInfo.type, 'account')
        )
      )
    if (res[0]) {
      return {
        // @ts-ignore
        ...res[0].steam_account,
        familyId: res[0].account_family_rel?.familyId ?? undefined,
        channel: res[0].steam_relate_channel_info as any,
      }
    }
    return undefined as any
  }

  async getSteamAccountBySteamId(
    steamid: string
  ): Promise<SteamAccountWithFamilyId> {
    const res = await this.db
      .select()
      .from(tables.accounts)
      .leftJoin(
        tables.accountFamilyRel,
        eq(tables.accounts.steamId, tables.accountFamilyRel.steamId)
      )
      .where(eq(tables.accounts.steamId, steamid))
    if (res[0]) {
      return {
        //@ts-ignore
        ...res[0].steam_account,
        familyId: res[0].account_family_rel?.familyId ?? undefined,
      }
    }
    return undefined as any
  }

  async upsertSteamAccount(
    account: Partial<SteamAccount>,
    channelInfo: ChannelInfo
  ): Promise<void> {
    await this.db.transaction(async (db) => {
      const values = [{ ...account, status: account.status as any } as any]
      const res = await db
        .insert(tables.accounts)
        .values(values)
        .onConflictDoUpdate({
          target: tables.accounts.id,
          set: {
            accountName: sql.raw(
              `excluded.${tables.accounts.accountName.name}`
            ),
            steamId: sql.raw(`excluded.${tables.accounts.steamId.name}`),
            steamRefreshToken: sql.raw(
              `excluded.${tables.accounts.steamRefreshToken.name}`
            ),
            steamAccessToken: sql.raw(
              `excluded.${tables.accounts.steamAccessToken.name}`
            ),
            status: sql.raw(`excluded.${tables.accounts.status.name}`),
          },
        })
        .returning({
          id: tables.accounts.id,
        })
      const id = res[0].id
      await this.db
        .insert(tables.SteamRelateChannelInfo)
        .values([
          {
            refId: id,
            ...channelInfo,
            type: 'account',
          },
        ])
        .onConflictDoUpdate({
          target: [
            tables.SteamRelateChannelInfo.refId,
            tables.SteamRelateChannelInfo.type,
          ],
          set: {
            refId: id,
            ...channelInfo,
            type: 'account',
          },
        })
    })
    return
  }

  async getSteamAccountBySteamIdAndSessionId(
    steamid: string,
    uid: string
  ): Promise<SteamAccountWithFamilyId> {
    const res = await this.db
      .select()
      .from(tables.accountFamilyRel)
      .leftJoin(
        tables.SteamRelateChannelInfo,
        eq(tables.SteamRelateChannelInfo.type, 'account')
      )
      .leftJoin(
        tables.accounts,
        eq(tables.accounts.id, tables.SteamRelateChannelInfo.refId)
      )
      .where(
        and(
          eq(tables.accounts.steamId, tables.accountFamilyRel.steamId),
          eq(tables.accounts.steamId, steamid),
          eq(tables.accounts.id, tables.SteamRelateChannelInfo.refId),
          eq(tables.SteamRelateChannelInfo.uid, uid),
          eq(tables.SteamRelateChannelInfo.type, 'account')
        )
      )
    if (res[0]) {
      return {
        //@ts-ignore
        ...res[0].steam_account,
        familyId: res[0].account_family_rel?.familyId ?? undefined,
      }
    }
    return undefined as any
  }

  async updateSteamAccountToken(
    accountId: number,
    account: Partial<SteamAccount>
  ): Promise<void> {
    await this.db
      .update(tables.accounts)
      .set({ ...account, status: account.status as any })
      .where(eq(tables.accounts.id, accountId))
  }

  async invalidAccount(id: number): Promise<void> {
    await this.db
      .update(tables.accounts)
      .set({ status: 'invalid' })
      .where(eq(tables.accounts.id, id))
  }

  async getAuthedSteamAccountByFamilyId(
    familyId: string
  ): Promise<SteamAccountWithFamilyId> {
    const res = await this.db
      .select()
      .from(tables.accounts)
      .leftJoin(
        tables.accountFamilyRel,
        eq(tables.accounts.steamId, tables.accountFamilyRel.steamId)
      )
      .where(
        and(
          eq(tables.accountFamilyRel.familyId, familyId),
          eq(tables.accounts.status, 'valid')
        )
      )

    if (res[0] && res[0].steamAccount) {
      return {
        //@ts-ignore
        ...res[0].steam_account,
        familyId: res[0].account_family_rel?.familyId ?? undefined,
      }
    }
    return undefined as any
  }

  async removeUnAuthAccount(accountId: number): Promise<void> {
    // const res = this.db
    //   .select()
    //   .from(tables.accounts)
    //   .leftJoin(tables.SteamRelateChannelInfo,
    //     and(
    //       eq(tables.accounts.id, tables.SteamRelateChannelInfo.refId),
    //       eq(tables.SteamRelateChannelInfo.type, 'account')
    //   ))

    await this.db.transaction(async (db) => {
      await db.delete(tables.accounts).where(eq(tables.accounts.id, accountId))
      await db
        .delete(tables.SteamRelateChannelInfo)
        .where(
          and(
            eq(tables.SteamRelateChannelInfo.refId, accountId),
            eq(tables.SteamRelateChannelInfo.type, 'account')
          )
        )
    })
  }
}
