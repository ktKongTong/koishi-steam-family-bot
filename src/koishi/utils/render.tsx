/** @jsxImportSource react */
import React from 'react'
import { Context } from 'koishi'
import * as ReactDOMServer from 'react-dom/server'
import { FamilyGames } from '../interface'
import { Stats, App } from '../../service/render'

export const renderImg = async (
  ctx: Context,
  child: React.ReactNode,
  onStart?: () => void,
  onError?: () => void
) => {
  let res = ReactDOMServer.renderToString(<App>{child}</App>)
  res = ` <!DOCTYPE html>` + res

  const buf = await ctx.puppeteer.render(res, async (page, next) => {
    onStart?.()
    await new Promise<void>((resolve, reject) => {
      setTimeout(resolve, 5000)
    })
    return page
      .$('body')
      .then(next)
      .catch((e) => {
        onError?.()
        return ''
      })
  })
  return buf
}

export const renderStatsImg = (
  ctx: Context,
  games: FamilyGames,
  onStart?: () => void,
  onError?: () => void
) => {
  return renderImg(ctx, <Stats familyGames={games} />, onStart, onError)
}
