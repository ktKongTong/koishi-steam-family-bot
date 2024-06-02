import { Context } from 'koishi'
import mock from '@koishijs/plugin-mock'
import cron from 'koishi-plugin-cron'
import puppeteer from 'koishi-plugin-puppeteer'

const app = new Context()
app.plugin(mock)
app.plugin(puppeteer)
app.plugin({
  ...cron,
})
// app.plugin(steamBot)

// const client = app.mock.client('123')
//
// app.start()
// before(() => app.start())
// after(() => app.stop())
//
// it('example 1', async () => {
//   await client.shouldReply('slm 你好','你好')
// })
