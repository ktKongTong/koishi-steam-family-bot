import { FamilyGames, SteamFamilyLib } from '@/interface'
import React from 'react'
import { App } from '@/render/components/app'
import { Stats } from '@/render/results/stats'
import { renderToString } from 'react-dom/server'

export * from './results/stats'
export * from './components/app'

export interface SteamFamilyLibForStats extends SteamFamilyLib {
  ownerSteamids: string[]
  mappedTags: string[]
  rtTimeAcquired: number
}

export const renderComponent = (child: React.ReactNode) => {
  let res = renderToString(<App>{child}</App>)
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
  screenshotFamilyStatistic(
    token: string,
    onStart?: () => void
  ): Promise<Buffer>
  getFamilyStatisticImg(
    games: FamilyGames,
    onStart?: () => void,
    onError?: () => void
  ): Promise<Buffer>
  isRenderEnable(): boolean
}
