import {Context} from "koishi";
import {Config} from "../config";
import libMonitor from "./libMonitor";

export default function schedules(ctx:Context,config:Config) {
  ctx.cron(config.libMonitorCron,libMonitor(ctx,config))
}
