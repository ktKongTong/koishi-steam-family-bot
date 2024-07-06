import { CommandBuilder } from '@/cmd/builder'

export default () =>
  new CommandBuilder()
    .setName('query')
    .addAlias('sbsou')
    .addAlias('sbquery')
    .setDescription('find game by keywords')
    .setExecutor(
      async (render, steam, logger, session, options, input, rawInput) => {
        if (!input || input.length < 2) {
          // session.sendQueued(
          //   '为了更精确的找到你要查询的游戏，查询关键词的长度不应小于二，tips：空格查询会忽略不计'
          // )
          session.sendQueued(session.text('commands.query.keyword-too-long'))
          return
        }
        const account = await steam.db.Account.getSteamAccountBySessionUid(
          session.uid
        )
        if (!account) {
          session.sendQueued(session.text('commands.query.no-binding'))
          return
        }
        const res = await steam.db.FamilyLib.getLibByKeywordAndFamilyId(
          account.familyId,
          input
        )

        if (res.length == 0) {
          session.sendQueued(session.text('commands.query.no-found', { input }))
          return
        } else if (res.length > 10) {
          session.sendQueued(
            session.text('commands.query.result-too-long', { size: res.length })
          )
          // session.sendQueued(
          //   `匹配的结果似乎有点太多了，共 ${res.length} 项，仅显示前 10 项，如果没有找到你所需要的游戏，可以试试换个关键词。`
          // )
        }

        const text = res
          .slice(0, 10)
          .map((lib, index) => `${index + 1}. ${lib.name} \n`)
          .join('')
        session.sendQueued(
          session.text('commands.query.result', { input, games: text })
        )
        // session.sendQueued(
        //   `库存中包含以下这些关键词为「${input}」的游戏：\n` + text
        // )
        return
      }
    )
