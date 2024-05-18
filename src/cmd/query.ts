import {Context, Logger} from "koishi";
import {Config} from "../config";

export function QueryCmd(ctx:Context, cfg:Config, logger:Logger) {
  const queryCmd = ctx
    .command('slm.query')
    .alias('sbquery')
    .action(async ({ session, options }, input) => {
      // 查询库存中是否有带有这个名称的游戏
      session.send("WIP")
      const accounts = await ctx.database.get('SteamAccount', {
        uid: session.uid,
      })
      if(accounts.length === 0) {
        session.sendQueued("你还没有绑定 steam 账户，暂时无法查询家庭库存")
      }
      return
    })
}
