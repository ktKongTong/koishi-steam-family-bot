import { Schema } from 'koishi'

// libMonitorCron: ScheduleTaskConfig
// libInfoSyncerCron: ScheduleTaskConfig
// tokenRefreshCron: ScheduleTaskConfig

export const Config = Schema.object({
  SteamHelperAPIHost: Schema.string().default(
    'https://steam-family-lib-viewer.ktlab.io'
  ),
  steamDataFetchMode: Schema.string().default('local'),
  libMonitorCron: Schema.object({
    enable: Schema.boolean().default(true),
    cron: Schema.string().default('*/15 * * * *'),
  }),
  libInfoSyncerCron: Schema.object({
    enable: Schema.boolean().default(true),
    cron: Schema.string().default('23 23 * * *'),
  }),
  tokenRefreshCron: Schema.object({
    enable: Schema.boolean().default(false),
    cron: Schema.string().default('0 4 * * *'),
  }),
  // assume value is yaml
  i18nMap: Schema.dict(Schema.string()).default({}),
}).i18n({
  // @ts-ignore
  'zh-CN': require('./locales/zh-CN')._config,
  // @ts-ignore
  'en-US': require('./locales/en-US')._config,
})
