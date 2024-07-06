import { FamilyGames, SteamFamilyLib } from '@/interface'
import React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { App } from '@/render/components/app'
import { Stats } from '@/render/results/stats'

export * from './results/stats'

export * from './components/app'
export interface SteamFamilyLibForStats extends SteamFamilyLib {
  ownerSteamids: string[]
  mappedTags: string[]
  rtTimeAcquired: number
}

export const renderComponent = (child: React.ReactNode) => {
  let res = ReactDOMServer.renderToString(<App>{child}</App>)
  res = ` <!DOCTYPE html>` + res
  return res
}

export function getStatComponent(games: FamilyGames) {
  return <Stats familyGames={games} />
}
export function getStatHtml(games: FamilyGames) {
  return renderComponent(getStatComponent(games))
}

export interface ImgRender {
  screenshotFamilyStatistic(token: string, onStart?: () => void): Promise<any>
  getFamilyStatisticImg(
    games: FamilyGames,
    onStart?: () => void,
    onError?: () => void
  ): Promise<string>
  isRenderEnable(): boolean
}
