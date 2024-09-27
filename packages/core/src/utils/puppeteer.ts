import puppeteer, {
  Browser,
  ScreenshotClip,
  ScreenshotOptions,
} from 'puppeteer-core'
import { sleep } from './index'
import { Config } from '@/interface'

export interface PuppeteerProvider {
  browser: Browser
  ok: boolean
}

export class RemotePuppeteerProvider implements PuppeteerProvider {
  browser: Browser
  constructor(config: Config) {
    puppeteer
      .connect({ browserWSEndpoint: config.broswerlessWSEndpoint })
      .then((res) => {
        console.log('connect to browser successful')
        this.browser = res
      })
      .catch((e) => {
        console.error('connection error', e)
      })
  }
  get ok() {
    return this.browser != null || this.browser != undefined
  }
}

export class PuppeteerRender {
  browserHolders: PuppeteerProvider[]
  get browser() {
    const provider = this.browserHolders.find((it) => it.ok)
    if (provider) {
      return provider.browser
    }
    throw Error('NoSuitablePuppeteerProviderFound')
  }
  get ok() {
    return this.browserHolders.find((it) => it.ok) != undefined
  }
  constructor(providers: PuppeteerProvider[]) {
    // unsafe singleton, but enough for now
    this.browserHolders = providers
  }

  async renderHTML(
    html: string,
    selector: string,
    onStart?: () => void,
    screenShotOption?: (clip: ScreenshotClip) => ScreenshotOptions
  ) {
    onStart?.()
    const page = await this.browser.newPage()
    await page.setContent(html)
    await page.setViewport({
      width: 3840,
      height: 2160,
      deviceScaleFactor: 2,
    })
    const elm = await page.waitForSelector(selector, { timeout: 5000 })
    const clip = await elm.boundingBox()
    const u8Arr = await elm.screenshot(
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
    const page = await this.browser.newPage()
    await page.setViewport({
      width: 3840,
      height: 2160,
      deviceScaleFactor: 2,
    })
    await page.goto(url, { timeout: 0, waitUntil: 'domcontentloaded' })

    const elm = await page.waitForSelector(selector, { timeout: 20000 })
    // wait for potential animation
    await sleep(1000)
    const buffer = await elm!.screenshot({
      type: 'png',
    })
    await page.close()
    return Buffer.from(buffer)
  }
}
