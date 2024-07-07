// @ts-nocheck
import { Context } from 'koishi'
import mock from '@koishijs/plugin-mock'
import console from '@koishijs/plugin-console'
import * as sandbox from '@koishijs/plugin-sandbox'
import * as echo from '@koishijs/plugin-echo'

const ctx = new Context()
ctx.plugin(mock)
ctx.plugin(console) // 提供控制台
ctx.plugin(sandbox) // 提供调试沙盒
ctx.plugin(echo) // 提供回声指令
// app.plugin(steamBot)
ctx.start()
// const client = app.mock.client('123')
//
// app.start()
// before(() => app.start())
// after(() => app.stop())
//
// it('example 1', async () => {
//   await client.shouldReply('slm 你好','你好')
// })
