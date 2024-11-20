import {
  Config,
  FamilyGames,
  PuppeteerProvider,
  PuppeteerRender,
  RemotePuppeteerProvider,
} from 'steam-family-bot-core'
import { Context } from 'koishi'
import { getStatHtml, ImgRender } from 'steam-family-bot-core/render'

export class PluginPuppeteerProvider implements PuppeteerProvider {
  ctx: Context
  _browser: any
  _ok: boolean = true
  async browser(): Promise<any> {
    if (this._browser) {
      return this._browser
    }
    try {
      await import('koishi-plugin-puppeteer')
      const pup = this.ctx.puppeteer
      this._browser = pup.browser
      return this._browser
    } catch (e) {
      console.error('koishi-plugin-puppeteer not installed, render is disable')
      this._ok = false
    }
  }
  constructor(config: Config, ctx: Context) {
    this.ctx = ctx
  }

  get ok() {
    return this._ok != null
  }
}

export const creatPuppeteerRender = (config: Config, ctx: Context) => {
  const pluginProvider = new PluginPuppeteerProvider(config, ctx)
  const remoteProvider = new RemotePuppeteerProvider(config)
  if (config.preferPuppeteerMode === 'local-plugin') {
    return new PuppeteerRender([pluginProvider, remoteProvider])
  }
  return new PuppeteerRender([remoteProvider, pluginProvider])
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
