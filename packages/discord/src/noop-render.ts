import { ImgRender } from 'steam-family-bot-core/render'
import { FamilyGames } from 'steam-family-bot-core'

export class NoOpRender implements ImgRender {
  getFamilyStatisticImg(
    games: FamilyGames,
    onStart?: () => void,
    onError?: () => void
  ): Promise<Buffer> {
    return Promise.resolve(undefined)
  }

  screenshotFamilyStatistic(
    token: string,
    onStart?: () => void
  ): Promise<Buffer> {
    return Promise.resolve(undefined)
  }
  isRenderEnable(): boolean {
    return false
  }
}
