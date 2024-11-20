export const canvasHelper = {
  createCanvas: (h,w)=>{return ""},
  enable: false,
  canvasToDataURL: (canvas)=> ""
}

const canvasBuilder = async ()=> {
  try {

    const { createCanvas: _createCanvas, GlobalFonts } = await import('@napi-rs/canvas')
    const {join} = await import('path')
    GlobalFonts.registerFromPath(join(__dirname, '.', 'fonts', 'MaShanZheng-Regular.ttf'), 'CJK')
    canvasHelper.createCanvas = _createCanvas
    // MaShanZheng-Regular.ttf
    GlobalFonts.register()
    canvasHelper.canvasToDataURL = (canvas)=> {
      return canvas.toDataURL('image/png')
    }
    canvasHelper.enable = true

  }catch(err) {
    try {
      const {createCanvas: _createCanvas} = await import('canvas')
      canvasHelper.createCanvas = _createCanvas
      canvasHelper.canvasToDataURL = (canvas)=> {
        return canvas.toDataURL('image/png')
      }
      canvasHelper.enable = true

    }catch(err) {
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
