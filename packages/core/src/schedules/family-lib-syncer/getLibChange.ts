import {
  diffLibs,
  diffWishes,
  prepareFamilyInfo,
  prepareLibData,
} from '@/schedules/family-lib-syncer/utils'
import { SteamFamilyLib, SubscribeInfo } from '@/db/interface'

export const getChangedLibs = async <CHANNEL>(
  api,
  steam,
  item: SubscribeInfo<CHANNEL>,
  logger
) => {
  const { memberDict, wishes, prevWishes } = await prepareFamilyInfo<CHANNEL>(
    api,
    steam,
    item.subscription.subWishes
  )
  const { prevLibs, libs } = await prepareLibData<CHANNEL>(
    api,
    steam,
    item.steamAndFamilyRel.familyId
  )
  logger.debug(
    `success fetch lib data, prevLibs: ${prevLibs.length}, curLibs: ${libs.length}`
  )

  const { newWishes, modifiedWishes, deletedWishes, wishesDict } = diffWishes(
    prevWishes,
    wishes
  )

  const { modifiedLibs, libDict, newLibs, deletedLibs } = diffLibs(
    prevLibs,
    libs
  )
  return {
    memberDict,
    newWishes,
    modifiedWishes,
    deletedWishes,
    wishesDict,
    newLibs,
    modifiedLibs,
    deletedLibs,
    libDict,
  }
}

export const updateDB = async <T>(
  item: SubscribeInfo<T>,
  logger,
  steam,
  newWishes,
  modifiedWishes,
  deletedWishes,
  newLibs,
  modifiedLibs,
  deletedLibs
) => {
  const libsUpsert: Partial<SteamFamilyLib>[] = newLibs
    .concat(modifiedLibs)
    .map((it) => ({
      familyId: item.subscription.steamFamilyId,
      name: it.name,
      appId: it.appid,
      steamIds: it.ownerSteamids.sort().join(','),
      type: 'lib',
      rtTimeAcquired: it.rtTimeAcquired ?? 0,
      lastModifiedAt: Math.floor(Date.now() / 1000),
    }))
  const libsDelete = deletedLibs.map((it) => ({
    familyId: item.subscription.steamFamilyId,
    appId: it.appId,
    type: 'lib',
  }))

  const wishesUpsert: Partial<SteamFamilyLib>[] = item.subscription.subWishes
    ? newWishes.concat(modifiedWishes).map((newItem) => ({
        familyId: item.subscription.steamFamilyId,
        name: newItem.itemInfo?.name as any as string,
        appId: parseInt(newItem.appId),
        steamIds: newItem.wishers.sort().join(','),
        type: 'wish',
      }))
    : []
  const wishesDelete = item.subscription.subWishes
    ? deletedWishes.map((it) => ({
        familyId: item.subscription.steamFamilyId,
        appId: it.appId,
        type: 'wish',
      }))
    : []
  logger.debug(
    `「${item.subscription.steamFamilyId}」 wishes need delete: ${wishesDelete.length}, wishes need upsert: ${wishesUpsert.length}`
  )
  logger.debug(
    `「${item.subscription.steamFamilyId}」 libs need delete: ${libsDelete.length}, libs need upsert: ${libsUpsert.length}`
  )
  // update db
  await steam.db.FamilyLib.batchUpsertFamilyLib(wishesUpsert.concat(libsUpsert))
  await steam.db.FamilyLib.batchRemoveByAppIdAndFamilyId(
    item.subscription.steamFamilyId,
    wishesDelete.map((it) => it.appId),
    'wish'
  )
  await steam.db.FamilyLib.batchRemoveByAppIdAndFamilyId(
    item.subscription.steamFamilyId,
    libsDelete.map((it) => it.appId),
    'lib'
  )
}
