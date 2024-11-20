import puppeteer, {
  Browser,
  ScreenshotClip,
  ScreenshotOptions,
} from 'puppeteer-core'
import { sleep } from './index'
import { Config } from '@/interface'

export interface PuppeteerProvider {
  browser: () => Promise<Browser>
  ok: boolean
}

export class RemotePuppeteerProvider implements PuppeteerProvider {
  _browser: Browser
  endpoint: string
  _ok: boolean = true
  async browser(): Promise<Browser> {
    if (this._browser?.connected) {
      return this._browser
    }
    try {
      this._browser = await puppeteer.connect({
        browserWSEndpoint: this.endpoint,
      })
      return this._browser
    } catch (e) {
      this._ok = false
    }
  }
  constructor(config: Config) {
    this.endpoint = config.broswerlessWSEndpoint
  }
  get ok() {
    return this._ok
  }
}

export class PuppeteerRender {
  browserHolders: PuppeteerProvider[]
  get browser() {
    const provider = this.browserHolders.find((it) => it.ok)
    if (provider) {
      return provider.browser()
    }
    throw Error('NoSuitablePuppeteerProviderFound')
  }
  get ok() {
    return !!this.browserHolders.find((it) => it.ok)
  }
  constructor(providers: PuppeteerProvider[]) {
    this.browserHolders = providers
  }

  async renderHTML(
    html: string,
    selector: string,
    onStart?: () => void,
    screenShotOption?: (clip: ScreenshotClip) => ScreenshotOptions
  ) {
    onStart?.()
    const browser = await this.browser
    const page = await browser.newPage()
    await page.setContent(html)
    const elm = await page.waitForSelector(selector, { timeout: 5000 })
    const clip = await elm.boundingBox()
    const u8Arr = await elm!.screenshot(
      screenShotOption
        ? screenShotOption(clip)
        : {
            clip: clip,
            type: 'png',
          }
    )
    await page.close()
    return Buffer.from(u8Arr)
  }

  async screenshotURL(
    url: string,
    selector: string,
    onStart?: () => void,
    screenShotOption?: (clip: ScreenshotClip) => ScreenshotOptions
  ): Promise<Buffer> {
    onStart?.()

    const browser = await this.browser
    const page = await browser.newPage()
    await page.goto(url, { timeout: 0, waitUntil: 'domcontentloaded' })

    const elm = await page.waitForSelector(selector, { timeout: 10000 })
    // wait for potential animation
    await sleep(1000)
    const buffer = await elm!.screenshot({
      type: 'png',
    })
    await page.close()
    return Buffer.from(buffer)
  }
}
