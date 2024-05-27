import { SteamAccount, SubscribeInfo, IDBService } from '../interface'
import { Context, Database, Tables, $ } from 'koishi'
import { SteamFamilyLibDAO } from './steamFamilyLibDAO'
import { SubscriptionDAO } from './subscriptionDAO'
import { SteamAccountDAO } from './steamAccountDAO'
import { channel } from 'node:diagnostics_channel'

export class DBService extends IDBService {
  private db: Database<Tables>
  constructor(ctx: Context) {
    const FamilyLib = new SteamFamilyLibDAO(ctx.database)
    const Subscription = new SubscriptionDAO(ctx.database)
    const Account = new SteamAccountDAO(ctx.database)
    super(Account, FamilyLib, Subscription)
    this.db = ctx.database
  }

  async invalidAccount(id: number, subId: number) {
    await this.db.withTransaction(async (db) => {
      await this.Subscription.inactiveSubscription(subId)
      await this.Account.invalidAccount(id)
    })
  }

  async clearAccountInfo(account: SteamAccount) {
    const res = await this.db
      .join(
        ['SteamFamilyLibSubscribe', 'SteamRelateChannelInfo'],
        (sub, channel) =>
          $.and($.eq(sub.id, channel.refId), $.eq(channel.type, 'sub'))
      )
      .where((row) => {
        return $.and(
          $.eq(
            row.SteamRelateChannelInfo.refId,
            row.SteamFamilyLibSubscribe.id
          ),
          $.eq(row.SteamFamilyLibSubscribe.accountId, account.id)
        )
      })
      .execute()
    await this.db.withTransaction(async (database) => {
      await database.remove('SteamFamilyLib', {
        familyId: account.familyId,
      })
      await database.remove('SteamRelateChannelInfo', {
        refId: res
          .map((it) => it.SteamRelateChannelInfo.refId)
          .concat([account.id]),
      })
      await database.remove('SteamFamilyLibSubscribe', {
        accountId: account.id,
      })
      await database.remove('SteamAccount', {
        id: account.id,
      })
    })
  }

  async getAllSubscription<T>(): Promise<SubscribeInfo<T>[]> {
    const selection = this.db.join(
      ['SteamAccount', 'SteamFamilyLibSubscribe', 'SteamRelateChannelInfo'],
      (account, sub, channel) =>
        $.and(
          $.eq(sub.accountId, account.id),
          $.eq(sub.id, channel.refId),
          $.eq(channel.type, 'sub')
        )
    )
    const subscribe = await selection
      .where((row) =>
        $.and(
          $.eq(
            row.SteamRelateChannelInfo.refId,
            row.SteamFamilyLibSubscribe.id
          ),
          $.eq(row.SteamFamilyLibSubscribe.accountId, row.SteamAccount.id),
          $.eq(row.SteamFamilyLibSubscribe.active, true),
          $.eq(row.SteamAccount.valid, 'valid')
        )
      )
      .execute()
    return subscribe.map(
      (item) =>
        ({
          subscription: item.SteamFamilyLibSubscribe,
          account: item.SteamAccount,
          channel: item.SteamRelateChannelInfo,
        }) as SubscribeInfo<T>
    )
  }
}
