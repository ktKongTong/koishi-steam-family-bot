export const canvasHelper = {
  createCanvas: (h,w)=>{return ""},
  enable: false,
  canvasToDataURL: (canvas)=> ""
}
const __dirname = import.meta.dirname
const canvasBuilder = async ()=> {
  try {

    const { createCanvas: _createCanvas, GlobalFonts } = await import('@napi-rs/canvas')
    const {join} = await import('path')
    const p = join(__dirname, '.', 'fonts', 'MaShanZheng-Regular.ttf')
    console.debug(p)
    GlobalFonts.registerFromPath(p, 'CJK')
    canvasHelper.createCanvas = _createCanvas
    // MaShanZheng-Regular.ttf
    GlobalFonts.register()
    canvasHelper.canvasToDataURL = (canvas)=> {
      return canvas.toDataURL('image/png')
    }
    canvasHelper.enable = true

  }catch(err) {
    console.error(err)
    try {
      const {createCanvas: _createCanvas} = await import('canvas')
      canvasHelper.createCanvas = _createCanvas
      canvasHelper.canvasToDataURL = (canvas)=> {
        return canvas.toDataURL('image/png')
      }
      canvasHelper.enable = true

    }catch(err) {
      console.error(err)
      const {Canvas} = await import('skia-canvas')
      canvasHelper.createCanvas = (h,w)=> {
        return new Canvas(h,w)
      }
      canvasHelper.canvasToDataURL = (canvas)=> {
        return canvas.toDataURLSync('image/png')
      }
      canvasHelper.enable = true
    }
  }
}

canvasBuilder().then(()=>console.log(`canvas init over: enable: ${canvasHelper.enable}`))
