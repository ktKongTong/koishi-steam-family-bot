import { ScheduleTask } from '@/interface/schedule'
import { libMonitor } from '@/schedules/family-lib-syncer'
import { Config } from '@/interface'
import { libInfoSyncer } from '@/schedules/libInfoSyncer'
import { tokenRefresh } from '@/schedules/tokenRefresh'

export const getScheduleTasks = (config: Config) => {
  return [
    {
      name: 'lib-monitor',
      handler: libMonitor,
      cron: config.libMonitorCron.cron,
      enable: config.libMonitorCron.enable,
    },
    {
      name: 'lib-info-syncer',
      handler: libInfoSyncer,
      cron: config.libInfoSyncerCron.cron,
      enable: config.libInfoSyncerCron.enable,
    },
    {
      name: 'token-refresher',
      handler: tokenRefresh,
      cron: config.tokenRefreshCron.cron,
      enable: config.tokenRefreshCron.enable,
    },
  ] as ScheduleTask[]
}
