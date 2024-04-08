import { Computed, Dict, Schema, Session, Time } from 'koishi'

export interface Config {
  SteamHelperAPIHost: string,
  TriggerInterval: number,
  AccessToken: string,
}

  export const Config =Schema.object({
    SteamHelperAPIHost: Schema.string().default('https://steam-family-lib-viewer.ktlab.io'),
    TriggerInterval: Schema.number().default(60 * 1000 * 15),
    AccessToken: Schema.string().default(''),
  })
  .i18n({
    'zh-CN': require('./locales/zh-CN')._config,
    'en-US': require('./locales/en-US')._config,
  })
