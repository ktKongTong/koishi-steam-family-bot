import { Schema } from 'koishi'

export const Config = Schema.object({
  SteamHelperAPIHost: Schema.string().default(
    'https://steam-family-lib-viewer.ktlab.io'
  ),
  steamDataFetchMode: Schema.string().default('local'),
  libMonitorCron: Schema.string().default('*/15 * * * *'),
  libInfoSyncerCron: Schema.string().default('*/7 * * * *'),
}).i18n({
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'zh-CN': require('./locales/zh-CN')._config,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'en-US': require('./locales/en-US')._config,
})
