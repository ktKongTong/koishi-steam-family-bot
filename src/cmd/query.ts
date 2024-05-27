import { Context, Logger, $ } from 'koishi'
import { Config } from '../config'
function escapeRegExp(str: string) {
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const ignoreCaseInput = escaped.replace(/[a-z]/gi, (letter) => {
    return `[${letter.toUpperCase()}${letter.toLowerCase()}]`
  })
  return ignoreCaseInput
}
export function QueryCmd(ctx: Context, cfg: Config, logger: Logger) {
  const queryCmd = ctx
    .command('slm.query')
    .alias('sbsou')
    .alias('sbquery')
    .action(async ({ session, options }, input) => {
      if (input.length < 2) {
        session.sendQueued(
          '为了更精确的找到你要查询的游戏，查询关键词的长度不应小于二，tips：空格查询会忽略不计'
        )
        return
      }
      // 查询库存中是否有带有这个名称的游戏
      const accounts = await ctx.database.get('SteamAccount', {
        uid: session.uid,
      })

      if (accounts.length === 0) {
        session.sendQueued('你还没有绑定 steam 账户，暂时无法查询家庭库存')
      }
      const res = await ctx.database.get('SteamFamilyLib', (row) => {
        return $.and(
          $.regex(row.name, new RegExp(escapeRegExp(input), 'i')),
          $.eq(row.familyId, accounts[0].familyId),
          $.eq(row.type, 'lib')
        )
      })
      // bind steamId
      if (res.length == 0) {
        session.sendQueued(
          `没有查询到关键词为「${input}」的游戏，tips:不推荐使用简称，当查询无结果时，可以考虑英文名查询。`
        )
        return
      }

      if (res.length > 10) {
        session.sendQueued(
          `匹配的结果似乎有点太多了，共 ${res.length} 项，如果没有找到你所需要的游戏，可以试试换个关键词。`
        )
      }

      const text = res
        .slice(0, 10)
        .map((lib, index) => `${index + 1}. ${lib.name} \n`)
        .join('')
      session.sendQueued(
        `查询完成，库存中包含以下这些关键词为「${input}」的游戏：\n` + text
      )
      return
    })
}
