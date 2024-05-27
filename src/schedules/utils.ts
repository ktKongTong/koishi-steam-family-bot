import { SteamFamilyLib } from '../index'
import { WishItem } from '../interface/wish'
import _ from 'lodash'
import { CFamilyGroups_GetSharedLibraryApps_Response_SharedApp } from 'node-steam-family-group-api'

export const diffWishes = (
  prevWishes: SteamFamilyLib[],
  wishes: WishItem[]
) => {
  // filter libs not in prevLibs
  const newWishes = wishes.filter(
    (item) =>
      !prevWishes.some((preItem) => preItem.appId.toString() == item.appId)
  )
  // filter libs in prevLib but ownerId not match
  const modifiedWishes = wishes.filter((item) =>
    prevWishes.some(
      (preItem) =>
        preItem.appId.toString() == item.appId &&
        preItem.steamIds != item.wishers.sort().join(',')
    )
  )
  const wishesDict = _.keyBy(prevWishes, 'appId')
  const deletedWishes = prevWishes.filter(
    (item) => !wishes.some((newItem) => newItem.appId == item.appId.toString())
  )
  return {
    newWishes,
    deletedWishes,
    modifiedWishes,
    wishesDict,
  }
}

export const diffLibs = (
  prevLibs: SteamFamilyLib[],
  libs: CFamilyGroups_GetSharedLibraryApps_Response_SharedApp[]
) => {
  // filter libs not in prevLibs
  const newLibs = libs.filter(
    (item) => !prevLibs.some((preItem) => preItem.appId == item.appid)
  )
  // filter libs in prevLib but ownerId not match
  const modifiedLibs = libs.filter((item) =>
    prevLibs.some(
      (preItem) =>
        preItem.appId == item.appid &&
        preItem.steamIds != item.ownerSteamids.sort().join(',')
    )
  )
  const libDict = _.keyBy(prevLibs, 'appId')
  // filter libs in prevLib but not ownerId diff
  const deletedLibs = prevLibs.filter(
    (item) => !libs.some((newItem) => newItem.appid == item.appId)
  )
  return {
    newLibs,
    modifiedLibs,
    libDict,
    deletedLibs,
  }
}
