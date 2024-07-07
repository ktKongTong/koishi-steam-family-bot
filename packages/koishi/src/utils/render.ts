import { Context, h } from 'koishi'
import { Config, FamilyGames } from '@/interface'
import { ImgRender, getStatHtml } from 'steam-family-bot-core/render'

let enable = false
// import {} from 'koishi-plugin-puppeteer'

async function init() {
  try {
    await import('koishi-plugin-puppeteer')
    enable = true
  } catch (e) {
    console.error('koishi-plugin-puppeteer not installed, render is disable')
  }
}

init()

export class KoishiImgRender implements ImgRender {
  private ctx: Context
  private config: Config
  constructor(ctx: Context, cfg: Config) {
    this.ctx = ctx
    this.config = cfg
  }
  private async _render(
    genHtml: () => string,
    onStart?: () => void,
    onError?: () => void
  ) {
    const res = genHtml()
    // @ts-ignore
    const buf = await this.ctx.puppeteer.render(res, async (page, next) => {
      onStart?.()
      await new Promise<void>((resolve, reject) => {
        setTimeout(resolve, 5000)
      })
      return (
        page
          .$('body')
          // @ts-ignore
          .then(next)
          .catch((e) => {
            onError?.()
            return ''
          })
      )
    })
    return buf
  }
  async screenshotFamilyStatistic(
    token: string,
    onStart?: () => void
  ): Promise<any> {
    // @ts-ignore
    const page = await this.ctx.puppeteer.page()
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    })
    await page.goto(
      `${this.config.SteamHelperAPIHost}/render?access_token=${token}`,
      {
        timeout: 0,
        waitUntil: 'domcontentloaded',
      }
    )
    onStart?.()
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 20000)
    })
    const elm = await page.waitForSelector('#data-graph', { timeout: 20000 })
    const buffer = await elm!.screenshot({})
    await page.close()
    const image = h.image(buffer, 'image/png')
    return image
  }

  async getFamilyStatisticImg(
    games: FamilyGames,
    onStart?: () => void,
    onError?: () => void
  ): Promise<string> {
    return this._render(() => getStatHtml(games), onStart, onError)
  }

  isRenderEnable(): boolean {
    return enable
  }
}
