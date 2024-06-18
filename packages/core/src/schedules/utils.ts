import {
  SteamFamilyLib,
  WishItem,
  IAPIService,
  ISteamService,
} from '../interface'
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

export const prepareFamilyInfo = async (
  api: IAPIService,
  steam: ISteamService
) => {
  const family = await api.Steam.getSteamFamilyGroup()
  const memberIds = family.data.familyGroup.members.map((member) =>
    member.steamid?.toString()
  )
  const [wishes, members] = await Promise.all([
    (await api.Steam.getSteamWishesByPlayerIds(memberIds)).data,
    (await api.Steam.getFamilyMembers(memberIds)).data,
  ])
  const m = members.accounts.map((acc) => acc.publicData)
  const memberDict = _.keyBy(m, 'steamid')
  const prevWishes = await steam.db.FamilyLib.getFamilyWishes(
    family.data.familyGroupid.toString()
  )
  return {
    family,
    memberDict,
    wishes,
    prevWishes,
  }
}

export const prepareLibData = async (
  api: IAPIService,
  steam: ISteamService,
  familyId: string
) => {
  const prevLibs = steam.db.FamilyLib.getSteamFamilyLibByFamilyId(
    familyId,
    'lib'
  )
  const libs = api.Steam.withRetry(3)
    .getSteamFamilyGroupLibs(BigInt(familyId))
    .then((res) =>
      res?.data.apps.filter(
        (app) => app.excludeReason == undefined || app.excludeReason == 0
      )
    )
  const [awaitedPrevLibs, awaitedLibs] = await Promise.all([prevLibs, libs])
  return { prevLibs: awaitedPrevLibs, libs: awaitedLibs }
}
