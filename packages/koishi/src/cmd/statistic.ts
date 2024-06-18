import { Context, Logger } from 'koishi'
import { screenshotFamilyStatistic } from '@/utils/screenshot'
import { renderStatsImg } from '@/utils/render'
import { ISteamService, Config } from '../interface'

class TmpLock {
  private tmpFamilyLock: string[] = []
  hasFamilyId(familyId: string): boolean {
    return this.tmpFamilyLock.some((it) => it === familyId)
  }
  inFamilyId(familyId: string) {
    this.tmpFamilyLock.push(familyId)
  }
  outFamilyId(familyId: string) {
    this.tmpFamilyLock = this.tmpFamilyLock.filter((it) => it === familyId)
  }
}

export function StatisticCmd(
  ctx: Context,
  cfg: Config,
  logger: Logger,
  steamService: ISteamService
) {
  const tmpLock = new TmpLock()
  const statsCmd = ctx
    .command('slm.stats')
    .alias('sbstats')
    .option('r', '<remote:boolean>')
    .action(async ({ session, options }, input) => {
      const tmp = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!tmp) {
        session.sendQueued('你还没有绑定 steam 账户，暂时无法获取统计信息')
        return
      }
      if (!tmp.familyId) {
        session.sendQueued('你还不在 steam 家庭中，暂时无法获取统计信息')
        return
      }
      if (tmpLock.hasFamilyId(tmp.familyId)) {
        session.sendQueued(
          `当前家庭「${tmp.familyId}」已有一个渲染中任务，请勿重复调用`
        )
        return
      } else {
        tmpLock.inFamilyId(tmp.familyId)
      }
      const account =
        await steamService.db.Account.getAuthedSteamAccountByFamilyId(
          tmp.familyId
        )
      // get same
      const valid = await steamService.validAccount(account)
      if (!valid) {
        session.sendQueued('当前账户 token 似乎已失效')
        tmpLock.outFamilyId(tmp.familyId)
        return
      }
      const onStart = () => {
        session.sendQueued('开始渲染了，请耐心等待 5s')
      }
      const onError = () => {
        session.sendQueued('出现了意外错误，如有需要请查看日志')
      }
      if (options.r) {
        const token = account.steamAccessToken
        const url = `${cfg.SteamHelperAPIHost}/render?access_token=${token}`
        try {
          const res = await screenshotFamilyStatistic(
            ctx.puppeteer,
            url,
            '#data-graph',
            () => {
              session.sendQueued(
                '开始渲染了，因为需要获取大量数据并进行计算，请耐心等待 20s'
              )
            },
            20000
          )
          session.sendQueued(res)
        } catch (e) {
          logger.error(`render error ${e}`)
          session.send('渲染出错，详情可查看日志')
        }
      } else {
        session.sendQueued('正在从 Steam 获取数据，请稍等')
        try {
          const familyGames = await steamService.getLibStatistic(
            account.steamAccessToken
          )
          session.sendQueued(
            await renderStatsImg(ctx, familyGames, onStart, onError)
          )
        } catch (e) {
          logger.error(`render error ${e}`)
          session.send('渲染出错，详情可查看日志')
        }
      }
      tmpLock.outFamilyId(tmp.familyId)
    })
}
