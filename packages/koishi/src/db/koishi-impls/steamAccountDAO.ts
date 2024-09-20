import { $, Database, Tables } from 'koishi'
import {
  SteamAccount,
  ISteamAccountDAO,
  ChannelInfo,
  SteamAccountWithFamilyId,
  SteamRelateChannelInfo,
} from '../../interface'

export class SteamAccountDAO<T> implements ISteamAccountDAO<T> {
  db: Database<Tables>
  constructor(db: Database<Tables>) {
    this.db = db
  }

  async getSteamAccountBySessionUid(
    uid: string
  ): Promise<
    SteamAccountWithFamilyId & { channel: SteamRelateChannelInfo<T> }
  > {
    const res = await this.db
      .join(
        ['SteamAccount', 'SteamRelateChannelInfo', 'SteamAccountFamilyRel'],
        (account, channel, rel) =>
          $.and(
            $.eq(account.id, channel.refId),
            $.eq(channel.type, 'account'),
            $.eq(account.steamId, rel.steamId)
          ),
        [false, false, true]
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamAccount.id, row.SteamRelateChannelInfo.refId),
          $.eq(row.SteamRelateChannelInfo.uid, uid),
          $.eq(row.SteamRelateChannelInfo.type, 'account')
        )
      })
      .execute()
    if (res[0]) {
      return {
        ...res[0].SteamAccount,
        familyId: res[0].SteamAccountFamilyRel?.familyId,
        channel: res[0].SteamRelateChannelInfo as any,
      }
    }
    return undefined
  }

  async getSteamAccountBySteamId(
    steamid: string
  ): Promise<SteamAccountWithFamilyId> {
    const res = await this.db
      .join(
        ['SteamAccount', 'SteamAccountFamilyRel'],
        (account, rel) => {
          return $.eq(account.steamId, rel.steamId)
        },
        [false, true]
      )
      .where((row) => {
        return $.eq(row.SteamAccount.steamId, steamid)
      })
      .execute()
    if (res[0]) {
      return {
        ...res[0].SteamAccount,
        familyId: res[0].SteamAccountFamilyRel?.familyId,
      }
    }
    return undefined
  }

  async upsertSteamAccount(
    account: Partial<SteamAccount>,
    channelInfo: ChannelInfo
  ): Promise<void> {
    await this.db.withTransaction(async (db) => {
      await this.db.upsert('SteamAccount', [account])
      let id = account.id
      if (!account.id) {
        const res = await this.db.get('SteamAccount', {
          ...account,
        })
        id = res[0].id
      }
      await this.db.upsert('SteamRelateChannelInfo', [
        {
          refId: id,
          ...channelInfo,
          type: 'account',
        },
      ])
    })
    return
  }

  async getSteamAccountBySteamIdAndSessionId(
    steamid: string,
    uid: string
  ): Promise<SteamAccountWithFamilyId> {
    const res = await this.db
      .join(
        ['SteamAccount', 'SteamAccountFamilyRel', 'SteamRelateChannelInfo'],
        (account, ref, channel) =>
          $.and($.eq(account.id, channel.refId), $.eq(channel.type, 'account')),
        [false, true, false]
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamAccount.steamId, row.SteamAccountFamilyRel.steamId),
          $.eq(row.SteamAccount.steamId, steamid),
          $.eq(row.SteamAccount.id, row.SteamRelateChannelInfo.refId),
          $.eq(row.SteamRelateChannelInfo.uid, uid),
          $.eq(row.SteamRelateChannelInfo.type, 'account')
        )
      })
      .execute()
    if (res[0]) {
      return {
        ...res[0].SteamAccount,
        familyId: res[0].SteamAccountFamilyRel?.familyId,
      }
    }
    return undefined
  }

  async updateSteamAccountToken(
    accountId: number,
    account: Partial<SteamAccount>
  ): Promise<void> {
    const res = await this.db.set(
      'SteamAccount',
      { id: accountId },
      {
        ...account,
      }
    )
  }

  async invalidAccount(id: number): Promise<void> {
    const res = await this.db.set(
      'SteamAccount',
      { id: id },
      {
        status: 'invalid',
      }
    )
  }

  async getAuthedSteamAccountByFamilyId(
    familyId: string
  ): Promise<SteamAccountWithFamilyId> {
    const res = await this.db
      .join(
        ['SteamAccount', 'SteamAccountFamilyRel'],
        (account, rel) => {
          return $.eq(account.steamId, rel.steamId)
        },
        [true, false]
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamAccountFamilyRel.familyId, familyId),
          $.eq(row.SteamAccount.status, 'valid')
        )
      })
      .execute()
    if (res[0] && res[0].SteamAccount) {
      return {
        ...res[0].SteamAccount,
        familyId: res[0].SteamAccountFamilyRel?.familyId,
      }
    }
    return undefined
  }

  async removeUnAuthAccount(accountId: number): Promise<void> {
    await this.db.withTransaction(async (db) => {
      await db.remove('SteamAccount', {
        id: accountId,
      })
      await db.remove('SteamRelateChannelInfo', {
        refId: accountId,
        type: 'account',
      })
    })
  }

  async getAllSteamAccount(): Promise<SteamAccount[]> {
    const res = await this.db.select('SteamAccount').execute()
    return res
  }
}
