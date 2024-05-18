import {Context, Logger} from "koishi";
import {Config} from "../config";
import {APIService} from "../service";
import {screenshotFamilyStatistic} from "../utils/render";

export function StatisticCmd(ctx:Context, cfg:Config, logger:Logger) {
  const subcmd = ctx
    .command('slm.stats')
    .alias('sbstats')
    .action(async ({ session, options }, input) => {
      const accounts = await ctx.database.get('SteamAccount', {
        uid: session.uid,
      })
      if(accounts.length === 0) {
        session.sendQueued("你还没有绑定 steam 账户，暂时无法获取统计信息")
        return
      }

      let account = accounts[0]
      let apiServiceResult = await APIService.create(ctx, cfg, account)
      if(!apiServiceResult.isSuccess()) {
        session.sendQueued("当前账户 token 似乎已失效")
      }
      let token = account.steamAccessToken
      let url = `${cfg.SteamHelperAPIHost}/render?access_token=${token}`
      try {
        const res = await screenshotFamilyStatistic(ctx.puppeteer, url, "#data-graph", ()=>{
          session.sendQueued("开始渲染了，因为需要获取大量数据并进行计算，请耐心等待 20s")
        }, 20000)
        session.sendQueued(res)
      }catch (e) {
        logger.info(`render error${e}`)
        session.send("渲染出错，详情可查看日志")
      }
    })
}
