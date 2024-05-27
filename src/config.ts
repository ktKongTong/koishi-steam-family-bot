import { Schema } from 'koishi'

export interface Config {
  SteamHelperAPIHost: string
  libMonitorCron: string
  libTagsSyncCron: string
}

export const Config = Schema.object({
  SteamHelperAPIHost: Schema.string().default(
    'https://steam-family-lib-viewer.ktlab.io'
  ),
  libMonitorCron: Schema.string().default('*/15 * * * *'),
  libTagsSyncCron: Schema.string().default('*/7 * * * *'),
}).i18n({
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'zh-CN': require('./locales/zh-CN')._config,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'en-US': require('./locales/en-US')._config,
})
