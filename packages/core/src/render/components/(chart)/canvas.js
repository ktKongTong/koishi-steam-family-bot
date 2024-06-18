// import { Canvas } from 'skia-canvas'
import { createCanvas as _createCanvas } from 'canvas'
// import { createCanvas as _createCanvas } from '@napi-rs/canvas'

export const createCanvas = (widht, height) => {
  // node-canvas
  return _createCanvas(widht, height)
  // skia
  // return new Canvas(widht, height)
}

export const canvasToDataURL = (canvas) => {
  // skia
  // return canvas.toDataURLSync('png')
  // node / canvas
  return canvas.toDataURL('image/png')
}
