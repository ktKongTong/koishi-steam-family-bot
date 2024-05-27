import { Context, h, Logger, sleep } from 'koishi'
import { Config } from '../config'
import { APIService } from '../service'
import { SteamFamilyLib } from '../index'
import * as _ from 'lodash'
// todo
//  this is a command for user that need to remove dirty data
export function refreshCmd(ctx: Context, cfg: Config, logger: Logger) {
  const log = logger.extend('subscribe')
  const subcmd = ctx
    .command('slm.refresh')
    .alias('sbrefresh')
    .option('w', '<wish:boolean>')
    .action(async ({ session, options }, input) => {
      try {
        const accounts = await ctx.database.get('SteamAccount', {
          uid: session.uid,
        })
        if (accounts.length === 0) {
          session.sendQueued('你还没有绑定 steam 账户，暂时不需要刷新数据')
          return
        }
        const account = accounts[0]
        const apiServiceResult = await APIService.create(ctx, cfg, account)
        if (!apiServiceResult.isSuccess()) {
          session.sendQueued(
            '当前账号的 token 已失效，若需继续使用，请通过 renew 指令更新该账号的 token'
          )
          return
        }
        const api = apiServiceResult.data

        const steamFamily = await api.Steam.getSteamFamilyGroup()
        const familyId = steamFamily.data.familyGroupid
        if (!familyId) {
          log.info(
            `can't get family info :accountId: ${account.id}, familyId: ${account.familyId}`
          )
          session.sendQueued(
            '暂时无法获取家庭信息，可能是因为网络问题或 token 失效，请稍后重试或 renew token'
          )
          return
        }
        const steamSharedLibs =
          await api.Steam.getSteamFamilyGroupLibs(familyId)
        let dbContent: Omit<SteamFamilyLib, 'id'>[] = []
        const date = new Date()
        const apps = steamSharedLibs.data.apps
          .filter(
            (item) => item.excludeReason == undefined || item.excludeReason == 0
          )
          .map((item) => ({
            familyId: familyId,
            appId: item.appid,
            name: item.name,
            steamIds: item.ownerSteamids.sort().join(','),
            lastModifiedAt: date.getTime(),
            rtTimeAcquired: item.rtTimeAcquired ?? 0,
            type: 'lib',
            tags: '',
          }))
        dbContent = dbContent.concat(apps as any)

        await ctx.database.withTransaction(async (database) => {
          const res = await ctx.database.remove('SteamFamilyLib', {
            familyId: accounts[0].familyId,
            type: 'lib',
          })
          // take a lock
          const insertRes = await ctx.database.upsert(
            'SteamFamilyLib',
            dbContent
          )
        })
        session.sendQueued(`刷新成功, ${dbContent.length}`)
        return
      } catch (e) {
        logger.error(`refresh lib failed, ${e}`)
        session.sendQueued('刷新失败，原因未知，如有需要请检查日志')
      }
    })
}
