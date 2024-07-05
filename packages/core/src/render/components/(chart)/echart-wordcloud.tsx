/** @jsxImportSource react */
import { selectableColor } from './playtimeGraph'
import { random } from 'lodash'
import { renderCanvasChart } from '../renderChart'

import { Writable, pipeline } from 'stream'
interface WordCloudProps {
  width: number
  height: number
  words: WordData[]
  className: string
}

export interface WordData {
  text: string
  value: number
}

export default function EchartWordCloud({
  width,
  height,
  words,
  className,
}: WordCloudProps) {
  const data = words.map((it) => ({
    name: it.text,
    value: it.value,
  }))
  const option = {
    tooltip: {
      show: true,
      formatter: '{b}: {c}',
    },
    series: [
      {
        type: 'wordCloud',
        shape: 'square',
        keepAspect: false,
        left: 'center',
        top: 'center',
        width: '100%',
        height: '100%',
        right: null,
        bottom: null,
        // Text size range which the value in data will be mapped to.
        // Default to have minimum 12px and maximum 60px size.
        sizeRange: [14, 84],
        rotationRange: [0, 0],
        rotationStep: 14,
        // size of the grid in pixels for marking the availability of the canvas
        // the larger the grid size, the bigger the gap between words.
        gridSize: 8,
        // set to true to allow word being draw partly outside of the canvas.
        // Allow word bigger than the size of the canvas to be drawn
        drawOutOfBound: false,
        shrinkToFit: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          // Color can be a callback function or a color string
          color: function () {
            const idx = random(selectableColor.length - 1, false)
            return selectableColor[idx]
          },
        },
        data: data,
      },
    ],
  }

  const res = renderCanvasChart(option, {
    height: height,
    width: width,
  })
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: res,
      }}
    ></div>
  )
}
