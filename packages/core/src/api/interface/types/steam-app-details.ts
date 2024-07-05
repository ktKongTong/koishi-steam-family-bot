/**
 * ApifoxModel
 */
export interface SteamAppDetails {
  storeItems: StoreItem[]
  [property: string]: any
}

export interface StoreItem {
  accessories: string[]
  appid: number
  assets: Assets
  bestPurchaseOption: BestPurchaseOption
  categories: Categories
  contentDescriptorids: number[]
  id: number
  includedAppids: string[]
  includedTypes: string[]
  isEarlyAccess?: boolean
  itemType: number
  name: string
  platforms: Platforms
  purchaseOptions: string[]
  relatedItems?: RelatedItems
  release: Release
  screenshots: Screenshots
  storeUrlPath: string
  success: number
  supportedLanguages: string[]
  tagids: number[]
  tags: Tag[]
  trailers: Trailers
  type: number
  visible: boolean
  [property: string]: any
}

export interface Assets {
  assetUrlFormat: string
  communityIcon: string
  header: string
  heroCapsule: string
  libraryCapsule: string
  libraryCapsule2x: string
  libraryHero: string
  libraryHero2x?: string
  mainCapsule: string
  pageBackground: string
  smallCapsule: string
  [property: string]: any
}

export interface BestPurchaseOption {
  activeDiscounts: ActiveDiscount[]
  discountPct?: number
  finalPriceInCents: string
  formattedFinalPrice: string
  formattedOriginalPrice?: string
  hideDiscountPctForCompliance?: boolean
  inactiveDiscounts: string[]
  includedGameCount: number
  lowestRecentPriceInCents?: string
  originalPriceInCents?: string
  packageid: number
  purchaseOptionName: string
  requiresShipping: boolean
  shouldSuppressDiscountPct?: boolean
  userActiveDiscounts: string[]
  userCanPurchaseAsGift: boolean
  [property: string]: any
}

export interface ActiveDiscount {
  discountAmount?: string
  discountDescription?: string
  discountEndDate?: number
  [property: string]: any
}

export interface Categories {
  controllerCategoryids: number[]
  featureCategoryids: number[]
  supportedPlayerCategoryids: number[]
  [property: string]: any
}

export interface Platforms {
  linux: boolean
  mac: boolean
  steamDeckCompatCategory: number
  vrSupport: { [key: string]: any }
  windows: boolean
  [property: string]: any
}

export interface RelatedItems {
  parentAppid: number
  [property: string]: any
}

export interface Release {
  isEarlyAccess?: boolean
  originalReleaseDate?: number
  steamReleaseDate: number
  [property: string]: any
}

export interface Screenshots {
  allAgesScreenshots: AllAgesScreenshot[]
  matureContentScreenshots: MatureContentScreenshot[]
  [property: string]: any
}

export interface AllAgesScreenshot {
  filename: string
  ordinal: number
  [property: string]: any
}

export interface MatureContentScreenshot {
  filename: string
  ordinal: number
  [property: string]: any
}

export interface Tag {
  tagid: number
  weight: number
  [property: string]: any
}

export interface Trailers {
  highlights: Highlight[]
  otherTrailers: string[]
  [property: string]: any
}

export interface Highlight {
  microtrailer: Microtrailer[]
  screenshotFull: string
  screenshotMedium: string
  trailer480p: Trailer480P[]
  trailerBaseId: number
  trailerMax: TrailerMax[]
  trailerName: string
  trailerUrlFormat: string
  [property: string]: any
}

export interface Microtrailer {
  filename: string
  type: string
  [property: string]: any
}

export interface Trailer480P {
  filename: string
  type: string
  [property: string]: any
}

export interface TrailerMax {
  filename: string
  type: string
  [property: string]: any
}
