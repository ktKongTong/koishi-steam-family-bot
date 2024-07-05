import { ImgRender } from 'steam-family-bot-core/render'
import { FamilyGames } from 'steam-family-bot-core'

export class NoOpRender implements ImgRender {
  getFamilyStatisticImg(
    games: FamilyGames,
    onStart?: () => void,
    onError?: () => void
  ): Promise<string> {
    return Promise.resolve('')
  }

  screenshotFamilyStatistic(token: string, onStart?: () => void): Promise<any> {
    return Promise.resolve(undefined)
  }
}
