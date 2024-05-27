import { $, Database, Tables } from 'koishi'
import { SteamAccount, ISteamAccountDAO } from '../interface'
import { ChannelInfo } from '../interface'

export class SteamAccountDAO implements ISteamAccountDAO {
  db: Database<Tables>
  constructor(db: Database<Tables>) {
    this.db = db
  }

  async getSteamAccountBySessionUid(uid: string): Promise<SteamAccount> {
    const res = await this.db
      .join(['SteamAccount', 'SteamRelateChannelInfo'], (account, channel) =>
        $.and($.eq(account.id, channel.refId), $.eq(channel.type, 'account'))
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamAccount.id, row.SteamRelateChannelInfo.refId),
          $.eq(row.SteamRelateChannelInfo.uid, uid),
          $.eq(row.SteamRelateChannelInfo.type, 'account')
        )
      })
      .execute()
    return res?.[0]?.SteamAccount
  }

  async getSteamAccountBySteamId(steamid: string): Promise<SteamAccount> {
    const res = await this.db.get('SteamAccount', { steamId: steamid })
    return res[0]
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
  ): Promise<SteamAccount> {
    const res = await this.db
      .join(['SteamAccount', 'SteamRelateChannelInfo'], (account, channel) =>
        $.and($.eq(account.id, channel.refId), $.eq(channel.type, 'account'))
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamAccount.steamId, steamid),
          $.eq(row.SteamAccount.id, row.SteamRelateChannelInfo.refId),
          $.eq(row.SteamRelateChannelInfo.uid, uid),
          $.eq(row.SteamRelateChannelInfo.type, 'account')
        )
      })
      .execute()
    return res?.[0]?.SteamAccount
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
        valid: 'invalid',
      }
    )
  }
}
