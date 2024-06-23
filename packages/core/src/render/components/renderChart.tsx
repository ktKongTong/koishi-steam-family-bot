import * as echarts from 'echarts'
import { ECBasicOption } from 'echarts/types/src/util/types'

import './(chart)/wc/wordCloud.js'
import { canvasHelper } from './(chart)/canvas'
interface Style {
  width: number
  height: number
}

export const renderChart = (options: ECBasicOption, s?: Style) => {
  const style = s ?? {
    width: 800,
    height: 400,
  }
  // const canvas = new Canvas(style.width, style.height)
  let chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: style.width,
    height: style.height,
  })
  chart.setOption(options)
  const svgStr = chart.renderToSVGString()
  chart.dispose()
  chart = null
  return svgStr
}

export const renderCanvasChart = (options: ECBasicOption, s?: Style) => {
  const style = s ?? {
    width: 800,
    height: 400,
  }
  if (!canvasHelper.enable) {
    return `<img class="object-none rounded-lg" style="height: ${style.height}px;width: ${style.width}px" src="https://www.loliapi.com/acg/pc/" />`
  }

  echarts.setPlatformAPI({
    createCanvas() {
      if (canvasHelper.enable) {
        return canvasHelper.createCanvas(style.width, style.height) as any
      } else {
        return undefined
      }
    },
  })
  const canvas = canvasHelper.createCanvas(style.width, style.height) as any
  let chart = echarts.init(canvas as any)
  chart.setOption(options)
  const canvasRes = chart.renderToCanvas()
  const res = canvasHelper.canvasToDataURL(canvasRes)
  chart.dispose()

  chart = null
  return `<img src="${res}" width="${style.width}" height="${style.height}"/>`
}
