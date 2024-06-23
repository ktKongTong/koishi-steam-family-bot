import Login from './login'
import Clear from './clear'
import Query from './query'
import Info from './info'
import Bind from './bind'
import Refresh from './refresh'
import Statistic from './statistic'
import Subscribe from './sub'
import UnSubscribe from './unsub'
import Unbind from './unbind'

import { Command } from './builder'
export * from './builder'

function applyCommand(...fns: (() => Command)[]) {
  return fns.map((fn) => fn())
}
export const steamCommands = applyCommand(
  Clear,
  Query,
  Info,
  Bind,
  Login,
  Refresh,
  Subscribe,
  UnSubscribe,
  Unbind,
  Statistic
)
