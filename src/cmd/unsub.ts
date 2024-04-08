import {Context} from "koishi";
import {Config} from "../config";

export function UnSubCmd(ctx:Context,cfg:Config) {
  const unsubcmd = ctx
    .command('slm.unsub')
    .alias('sbunsub')
    .option('w', '<subWish:boolean>')
    .option('l', '<subLib:boolean>')
    .action(async ({ session, options }, input) => {
      const accounts = await ctx.database.get('SteamAccount', {
        uid: session.uid,
      })
      if (accounts.length === 0) {
        session.send('你暂未绑定Steam账号，暂时无法进行家庭库订阅/取消操作')
        return
      }
      const subs = await ctx.database.get('SteamFamilyLibSubscribe', {
        uid: session.uid,
      })
      if (subs.length === 0) {
        session.send('没有任何家庭库订阅，暂时无法进行家庭库订阅/取消操作')
        return
      }
      let sub = subs[0]
      if(!options.l && !options.w) {
        ctx.database.remove('SteamFamilyLibSubscribe', {
          uid: session.uid,
        })
        session.send('成功取消订阅')
      }
      if(!options.l && options.w) {
        ctx.database.upsert('SteamFamilyLibSubscribe', [{
          ...sub,
          subWishes: false,
        }])
        session.send('成功取消愿望单订阅')
      }
    })
}
