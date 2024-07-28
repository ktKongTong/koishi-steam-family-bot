import { CommandBuilder } from '@/cmd/builder'

export default () =>
  new CommandBuilder()
    .setName('query')
    .addAlias('sbsou')
    .addAlias('sbquery')
    .setDescription('find game by keywords')
    .setExecutor(async (c) => {
      const { steamService: steam, session, input } = c
      if (!input || input.trim().length < 1) {
        await session.sendQueued(
          session.text('commands.query.keyword-too-long')
        )
        return
      }
      const account = await steam.db.Account.getSteamAccountBySessionUid(
        session.uid
      )
      if (!account) {
        await session.sendQueued(session.text('commands.query.no-binding'))
        return
      }

      const res = await steam.db.FamilyLib.getLibByKeywordAndFamilyId(
        account.familyId,
        input
      )

      if (res.length == 0) {
        await session.sendQueued(
          session.text('commands.query.not-found', { input })
        )
        return
      } else if (res.length > 30) {
        await session.sendQueued(
          session.text('commands.query.result-too-long', { size: res.length })
        )
      }

      const text = res
        .slice(0, 30)
        .map((lib, index) => `${index + 1}. ${lib.info.aliases ?? lib.name} \n`)
        .join('')
      await session.sendQueued(
        session.text('commands.query.result', { input, games: text })
      )
      return
    })
