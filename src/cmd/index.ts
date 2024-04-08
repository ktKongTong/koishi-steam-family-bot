import {Context} from "koishi";
import {Config} from "../config";
export * from './sub'
export * from './login'
export default class Cmd {
  private readonly config: Config;
  private readonly ctx: Context;
  constructor(ctx:Context,config:Config) {
    this.config = config
    this.ctx = ctx
  }
  apply(fc:(Context,Config)=>void) {
    fc(this.ctx,this.config)
    return this
  }
}
