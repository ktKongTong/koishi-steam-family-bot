import { Context } from 'koishi'
import { Config, FamilyGames } from '@/interface'
import { ImgRender, getStatHtml } from 'steam-family-bot-core/render'
import puppeteer, {
  Browser,
  ScreenshotClip,
  ScreenshotOptions,
} from 'puppeteer-core'
import { delay } from '@/utils/delay'
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

class PluginPuppeteerProvider implements PuppeteerProvider {
  ctx: Context
  browser: Browser
  constructor(config: Config, ctx: Context) {
    this.ctx = ctx
    init().then(() => {
      setTimeout(() => {
        const pup = this.ctx.puppeteer
        if (pup) {
          // @ts-ignore
          this.browser = pup.browser
          console.log('puppeteer initialized')
        }
      }, 5000)
    })
  }

  get ok() {
    return this.browser != null && this.browser != undefined
  }
}

interface PuppeteerProvider {
  browser: Browser
  ok: boolean
}

class RemotePuppeteerProvider implements PuppeteerProvider {
  browser: Browser
  constructor(config: Config) {
    try {
      puppeteer
        .connect({ browserWSEndpoint: config.broswerlessWSEndpoint })
        .then((res) => {
          console.log('connect to browser successful')
          this.browser = res
        })
        .catch((e) => {
          console.error(e)
        })
    } catch (e) {
      console.error(e)
    }
  }
  get ok() {
    return this.browser != null || this.browser != undefined
  }
}

class PuppeteerRender {
  browserHolder: PuppeteerProvider
  get browser() {
    if (this.browserHolder.browser) {
      return this.browserHolder.browser
    }
    throw Error('NoSuitablePuppeteerProviderFound')
  }
  get ok() {
    return this.browserHolder?.ok ?? false
  }
  constructor(config: Config, ctx: Context) {
    if (config.preferPuppeteerMode === 'local-plugin' && enable) {
      this.browserHolder = new PluginPuppeteerProvider(config, ctx)
    } else if (
      config.preferPuppeteerMode === 'remote' &&
      config.broswerlessWSEndpoint
    ) {
      this.browserHolder = new RemotePuppeteerProvider(config)
    }
  }

  async renderHTML(
    html: string,
    selector: string,
    screenShotOption?: (clip: ScreenshotClip) => ScreenshotOptions
  ) {
    const page = await this.browser.newPage()
    await page.setContent(html)
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    })
    const elm = await page.waitForSelector(selector, { timeout: 5000 })
    const clip = await elm.boundingBox()
    const buffer = await elm.screenshot(
      screenShotOption
        ? screenShotOption(clip)
        : {
            clip: clip,
            type: 'webp',
          }
    )
    await page.close()
    return buffer
  }

  async screenshotURL(url: string, selector: string): Promise<Buffer> {
    const page = await this.browser.newPage()
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    })
    await page.goto(url, { timeout: 0, waitUntil: 'domcontentloaded' })

    const elm = await page.waitForSelector(selector, { timeout: 20000 })
    // wait for potential animation
    await delay(1000)
    const buffer = await elm!.screenshot({})
    await page.close()
    return Buffer.from(buffer)
  }
}

export class KoishiImgRender implements ImgRender {
  private config: Config
  private puppeteerRender: PuppeteerRender
  constructor(ctx: Context, cfg: Config) {
    this.config = cfg
    this.puppeteerRender = new PuppeteerRender(cfg, ctx)
  }
  async screenshotFamilyStatistic(
    token: string,
    onStart?: () => void
  ): Promise<Buffer> {
    const buffer = await this.puppeteerRender.screenshotURL(
      `${this.config.SteamHelperAPIHost}/render?access_token=${token}`,
      '#data-graph'
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
      '#data-graph'
    )
    return Buffer.from(buf)
  }

  isRenderEnable(): boolean {
    return this.puppeteerRender.ok
  }
}
