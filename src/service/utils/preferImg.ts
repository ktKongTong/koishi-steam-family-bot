import { StoreItem } from 'node-steam-family-group-api'
import { PreferGameImgType } from '../interface'

const defaultImg =
  'https://store.akamai.steamstatic.com/public/images/applications/store/defaultappimage.png'

export const getGameCapsule = (game: StoreItem, preferImgType: string) => {
  const preferGameImgType = preferImgStringToEnum(preferImgType)
  const filename =
    getPreferImgByPreferType(game, preferGameImgType) ?? defaultImg
  const format = game.assets?.assetUrlFormat
  const prefix = 'https://cdn.akamai.steamstatic.com/'
  const url = format?.replace('${FILENAME}', filename)
  return prefix + url
}
const getPreferImgByPreferType = (
  game: StoreItem,
  preferImgType: PreferGameImgType
) => {
  const asset = game.assets
  switch (preferImgType) {
    case PreferGameImgType.Header:
      return (
        asset.header ??
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.mainCapsule ??
        asset.smallCapsule ??
        asset.heroCapsule2x ??
        asset.heroCapsule ??
        asset.libraryHero2x ??
        asset.libraryHero
      )
    case PreferGameImgType.Hero:
      return (
        asset.heroCapsule ??
        asset.heroCapsule2x ??
        asset.header ??
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.mainCapsule ??
        asset.smallCapsule ??
        asset.libraryHero2x ??
        asset.libraryHero
      )
    case PreferGameImgType.Hero2X:
      return (
        asset.heroCapsule2x ??
        asset.heroCapsule ??
        asset.header ??
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.mainCapsule ??
        asset.smallCapsule ??
        asset.libraryHero2x ??
        asset.libraryHero
      )
    case PreferGameImgType.Library:
      return (
        asset.libraryCapsule ??
        asset.libraryCapsule2x ??
        asset.header ??
        asset.mainCapsule ??
        asset.smallCapsule ??
        asset.heroCapsule2x ??
        asset.heroCapsule ??
        asset.libraryHero2x ??
        asset.libraryHero
      )
    case PreferGameImgType.Library2X:
      return (
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.header ??
        asset.mainCapsule ??
        asset.smallCapsule ??
        asset.heroCapsule2x ??
        asset.heroCapsule ??
        asset.libraryHero2x ??
        asset.libraryHero
      )
    case PreferGameImgType.Main:
      return (
        asset.mainCapsule ??
        asset.smallCapsule ??
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.header ??
        asset.heroCapsule2x ??
        asset.heroCapsule ??
        asset.libraryHero2x ??
        asset.libraryHero
      )
    case PreferGameImgType.Small:
      return (
        asset.smallCapsule ??
        asset.mainCapsule ??
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.header ??
        asset.heroCapsule2x ??
        asset.heroCapsule ??
        asset.libraryHero2x ??
        asset.libraryHero
      )
    case PreferGameImgType.LibHero:
      return (
        asset.libraryHero ??
        asset.libraryHero2x ??
        asset.smallCapsule ??
        asset.mainCapsule ??
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.header ??
        asset.heroCapsule2x ??
        asset.heroCapsule
      )
    case PreferGameImgType.LibHero2x:
      return (
        asset.libraryHero2x ??
        asset.libraryHero ??
        asset.smallCapsule ??
        asset.mainCapsule ??
        asset.libraryCapsule2x ??
        asset.libraryCapsule ??
        asset.header ??
        asset.heroCapsule2x ??
        asset.heroCapsule
      )
  }
}

export const preferImgStringToEnum = (str: string) => {
  let preferGameImgType = PreferGameImgType.Library2X
  switch (str) {
    case 'header':
      preferGameImgType = PreferGameImgType.Header
      break
    case 'mainCapsule':
      preferGameImgType = PreferGameImgType.Main
      break
    case 'smallCapsule':
      preferGameImgType = PreferGameImgType.Small
      break
    case 'libraryCapsule':
      preferGameImgType = PreferGameImgType.Library
      break
    case 'libraryCapsule2x':
      preferGameImgType = PreferGameImgType.Library2X
      break
    case 'heroCapsule':
      preferGameImgType = PreferGameImgType.Hero
      break
    case 'heroCapsule2x':
      preferGameImgType = PreferGameImgType.Hero2X
      break
    case 'libraryHero':
      preferGameImgType = PreferGameImgType.LibHero
      break
    case 'libraryHero2x':
      preferGameImgType = PreferGameImgType.LibHero2x
      break
  }
  return preferGameImgType
}
