// import {Canvas} from "skia-canvas";
// import { createCanvas as _createCanvas } from 'canvas'
import { createCanvas as _createCanvas } from '@napi-rs/canvas'

export const createCanvas = (widht, height) => {
  // createCanvas
  return _createCanvas(widht, height)
}

export const canvasToDataURL = (canvas) => {
  //node canvas      canvasRes.toDataURL('image/png');
  // return  canvas.toDataURLSync('png')
  return canvas.toDataURL('image/png')
}
