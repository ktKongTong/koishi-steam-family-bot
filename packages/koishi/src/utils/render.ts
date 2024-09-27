import { Context } from 'koishi'
import {
  Config,
  FamilyGames,
  PuppeteerProvider,
  PuppeteerRender,
  RemotePuppeteerProvider,
} from '@/interface'
import { ImgRender, getStatHtml } from 'steam-family-bot-core/render'

let enable = false

async function init() {
  try {
    await import('koishi-plugin-puppeteer')
    enable = true
    console.log('enable koishi puppeteer')
  } catch (e) {
    console.error('koishi-plugin-puppeteer not installed, render is disable')
  }
}

init()

export class PluginPuppeteerProvider implements PuppeteerProvider {
  ctx: Context
  browser: any
  constructor(config: Config, ctx: Context) {
    this.ctx = ctx
    setTimeout(() => {
      const pup = this.ctx.puppeteer
      if (pup) {
        // @ts-ignore
        this.browser = pup.browser
        console.log('puppeteer initialized')
      }
    }, 5000)
  }

  get ok() {
    return this.browser != null && this.browser != undefined
  }
}

export const creatPuppeteerRender = (config: Config, ctx: Context) => {
  const pluginProvider = new PluginPuppeteerProvider(config, ctx)
  const remoteProvider = new RemotePuppeteerProvider(config)
  return new PuppeteerRender([pluginProvider, remoteProvider])
}

export class KoishiImgRender implements ImgRender {
  private config: Config
  private puppeteerRender: PuppeteerRender
  constructor(ctx: Context, cfg: Config) {
    this.config = cfg
    this.puppeteerRender = creatPuppeteerRender(cfg, ctx)
  }
  async screenshotFamilyStatistic(
    token: string,
    onStart?: () => void
  ): Promise<Buffer> {
    const buffer = await this.puppeteerRender.screenshotURL(
      `${this.config.SteamHelperAPIHost}/render?access_token=${token}`,
      '#data-graph',
      onStart
    )
    return Buffer.from(buffer)
  }

  async getFamilyStatisticImg(
    games: FamilyGames,
    onStart?: () => void,
    onError?: () => void
  ): Promise<Buffer> {
    const buf = await this.puppeteerRender.renderHTML(
      getStatHtml(games),
      '#data-graph',
      onStart
    )
    return Buffer.from(buf)
  }

  isRenderEnable(): boolean {
    return this.puppeteerRender.ok
  }
}
