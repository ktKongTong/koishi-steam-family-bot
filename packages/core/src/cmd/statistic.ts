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
    .setName('stats')
    .setDescription('generate stats info for steam family')
    .addAlias('sbstats')
    .addOption('r', 'remote:boolean?')
    .setExecutor(async (c) => {
      const { render, steamService, logger, session, options } = c

      if (!render.isRenderEnable()) {
        await session.sendQueued(session.text('commands.statistic.no-render'))
        return
      }
      const tmp = await steamService.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!tmp) {
        await session.sendQueued(session.text('commands.statistic.no-binding'))
        return
      }
      if (!tmp.familyId) {
        await session.sendQueued(session.text('commands.statistic.no-family'))
        return
      }
      if (tmpLock.hasFamilyId(tmp.familyId)) {
        await session.sendQueued(
          session.text('commands.statistic.repeat-render', {
            familyId: tmp.familyId,
          })
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
        await session.sendQueued(
          session.text('commands.statistic.token-invalid')
        )
        tmpLock.outFamilyId(tmp.familyId)
        return
      }
      const onStart = () => {
        session.sendQueued(session.text('commands.statistic.render-start'))
      }
      const onError = () => {
        session.sendQueued(session.text('commands.statistic.render-error'))
      }
      if (options.r) {
        const token = account.steamAccessToken
        try {
          const res = await render.screenshotFamilyStatistic(token, () => {
            session.sendQueued(
              session.text('commands.statistic.need-wait-long-time')
            )
          })
          await session.sendQueued(res)
        } catch (e) {
          logger.error(`render error ${e}`)
          await session.sendQueued(
            session.text('commands.statistic.render-remote-error')
          )
        }
      } else {
        session.send(session.text('commands.statistic.fetching-steam-data'))
        try {
          const familyGames = await steamService.getLibStatistic(
            account.steamAccessToken
          )
          await session.sendQueued(
            await render.getFamilyStatisticImg(familyGames, onStart, onError)
          )
        } catch (e) {
          logger.error(`render error ${e}`)
          await session.sendQueued(
            session.text('commands.statistic.render-error')
          )
        }
      }
      tmpLock.outFamilyId(tmp.familyId)
    })
