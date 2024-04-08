import {Context} from "koishi";
import {Config} from "../config";
import {libApi} from "./api";
export class APIService {
  Steam: ReturnType<typeof libApi>
  constructor(ctx:Context, cfg: Config,token:string) {
    this.Steam = libApi(ctx,cfg,token)
  }
}
