import {Context, h, Logger} from "koishi";
import {Config} from "../config";
import {APIService} from "../service";
import {screenshotFamilyStatistic} from "../utils/render";
import {renderStatsImg} from "../render";


export function StatisticCmd(ctx:Context, cfg:Config, logger:Logger) {
  const subcmd = ctx
    .command('slm.stats')
    .alias('sbstats')
    .option('r', '<remote:boolean>')
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
      const onStart = ()=> {
        session.sendQueued("开始渲染了，请耐心等待 5s")
      }
      const onError = ()=> {
        session.sendQueued("出现了意外错误，如有需要请查看日志")
      }
      if(options.r) {
        let token = account.steamAccessToken
        let url = `${cfg.SteamHelperAPIHost}/render?access_token=${token}`
        try {
          const res = await screenshotFamilyStatistic(ctx.puppeteer, url, "#data-graph", ()=>{
            session.sendQueued("开始渲染了，因为需要获取大量数据并进行计算，请耐心等待 20s")
          }, 20000)
          session.sendQueued(res)
        }catch (e) {
          logger.error(`render error ${e}`)
          session.send("渲染出错，详情可查看日志")
        }
      }else {
        const res = await apiServiceResult.data.Steam.getSteamFamilyGroup()
        const ids = res.data.familyGroup.members.map(it=> it.steamid.toString())
        const members = await apiServiceResult.data.Steam.getFamilyMembers(ids)
        const items = await ctx.database.get('SteamFamilyLib', {
          familyId: res.data.familyGroupid.toString(),
          type: 'lib'
        })
        const summary = await apiServiceResult.data.Steam.getPlaytimeSummary(res.data.familyGroupid)
        const recentApp = items.sort((a,b)=> b.rtTimeAcquired - a.rtTimeAcquired).slice(0,12)
        const recentAppDetail = await apiServiceResult.data.Steam
          .getSteamItems(recentApp.map(it=>it.appId.toString()))
        let familyGames = {
          familyInfo: res.data,
          members: members.data,
          games: items,
          playtimeSummary: summary.data,
          recentAppDetail:recentAppDetail.data
        }

        session.sendQueued(await renderStatsImg(ctx, familyGames,onStart, onError))
        return
      }


    })
}
