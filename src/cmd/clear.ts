import {Context, h, sleep} from "koishi";
import {Config} from "../config";

// todo
//  this is a command for user that need to remove dirty data
export function ClearCmd(ctx:Context,cfg:Config) {
  const subcmd = ctx
    .command('slm.clear')
    .alias('sbclear')
    .action(async ({ session, options }, input) => {
      session.send("WIP")
      const accounts = await ctx.database.get('SteamAccount', {
        uid: session.uid,
      })
      if(accounts.length === 0) {
        session.sendQueued("你还没有绑定 steam 账户，暂时不需要清除数据")
      }
      return
    })
}
