// todo
//
import { CommandBuilder } from '@/cmd/builder'

class TmpLock {
  private tmpFamilyLock: string[] = []
  hasFamilyId(familyId: string): boolean {
    return this.tmpFamilyLock.some((it) => it === familyId)
  }
  inFamilyId(familyId: string) {
    this.tmpFamilyLock.push(familyId)
  }
  outFamilyId(familyId: string) {
    this.tmpFamilyLock = this.tmpFamilyLock.filter((it) => it !== familyId)
  }
}

const tmpLock = new TmpLock()
export default () =>
  new CommandBuilder()
    .setName('slm.stats')
    .setDescription('generate stats info for steam family')
    .addAlias('sbstats')
    .addOption('r', 'remote:boolean?')
    .setExecutor(
      async (
        render,
        steamService,
        logger,
        session,
        options,
        input,
        rawInput
      ) => {
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
          // const url = `${cfg.SteamHelperAPIHost}/render?access_token=${token}`
          try {
            const res = await render.screenshotFamilyStatistic(token, () => {
              session.sendQueued(
                '开始渲染了，因为需要获取大量数据并进行计算，请耐心等待 20s'
              )
            })
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
              await render.getFamilyStatisticImg(familyGames, onStart, onError)
            )
          } catch (e) {
            logger.error(`render error ${e}`)
            session.send('渲染出错，详情可查看日志')
          }
        }
        tmpLock.outFamilyId(tmp.familyId)
      }
    )
