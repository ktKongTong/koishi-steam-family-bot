import { Schema } from 'koishi'

export const Config = Schema.object({
  SteamHelperAPIHost: Schema.string().default(
    'https://steam-family-lib-viewer.ktlab.io'
  ),
  steamDataFetchMode: Schema.string().default('local'),
  libMonitorCron: Schema.string().default('*/15 * * * *'),
  libInfoSyncerCron: Schema.string().default('*/7 * * * *'),
  // assume value is yaml
  i18nMap: Schema.dict(Schema.string()).default({}),
}).i18n({
  // @ts-ignore
  'zh-CN': require('./locales/zh-CN')._config,
  // @ts-ignore
  'en-US': require('./locales/en-US')._config,
})
