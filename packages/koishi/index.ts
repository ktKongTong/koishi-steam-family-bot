import { Context } from 'koishi'
import console from '@koishijs/plugin-console'
import * as sandbox from '@koishijs/plugin-sandbox'
// 创建一个 Koishi 应用
const ctx = new Context({
  // @ts-ignore
  port: 5140,
})
// @ts-ignore
ctx.plugin(console)
// @ts-ignore
ctx.plugin(sandbox)
// @ts-ignore
ctx.start()
