import { Context, h, sleep } from 'koishi'
import { Config } from '../config'

// todo
//  this is a command for user that need to remove dirty data
export function ClearCmd(ctx: Context, cfg: Config) {
  const clearCmd = ctx
    .command('slm.clear')
    .alias('sbclear')
    .action(async ({ session, options }, input) => {
      const accounts = await ctx.database.get('SteamAccount', {
        uid: session.uid,
      })
      if (accounts.length === 0) {
        session.sendQueued('你还没有绑定 steam 账户，暂时不需要清除数据')
      }
      await ctx.database.withTransaction(async (database) => {
        await database.remove('SteamFamilyLibSubscribe', {
          accountId: accounts[0].id,
        })
        await database.remove('SteamFamilyLib', {
          familyId: accounts[0].familyId,
        })
        await database.remove('SteamAccount', {
          id: accounts[0].id,
        })
      })
      session.sendQueued('清除完成')
      return
    })
}
