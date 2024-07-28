import { SubscribeInfo } from '@/db/interface'

export const buildMessages = async <CHANNEL>(
  memberDict,
  newWishes,
  modifiedWishes,
  deletedWishes,
  wishesDict,
  newLibs,
  modifiedLibs,
  deletedLibs,
  libDict,
  item: SubscribeInfo<CHANNEL>,
  trans: (...args) => string
) => {
  const newWishMsg = newWishes.map((newWish) => {
    const names = newWish.wishers.map(
      (ownerId) => `「${memberDict[ownerId]?.personaName}」`
    )
    // const text = `库存愿望单 + 1。${newWish.itemInfo?.name}，by：${names.join('，')}`
    const text = trans('schedule.lib-syncer.wishes-increase-one', {
      name: newWish.itemInfo?.name,
      owners: names.join('，'),
    })
    return { text: text, relateAppId: newWish.appId.toString() }
  })

  const deleteWishMsg = deletedWishes.map((deletedWish) => {
    const names = deletedWish?.steamIds
      ?.split(',')
      ?.map((ownerId) => `「${memberDict[ownerId]?.personaName}」`)
    // const text = `库存愿望单 - 1。${deletedWish.name}，by：${names.join('，')}`
    const text = trans('schedule.lib-syncer.wishes-decrease-one', {
      name: deletedWish.name,
      owners: names.join('，'),
    })
    return { text: text, relateAppId: deletedWish.appId.toString() }
  })

  const modifiedWishMsg = modifiedWishes.map((modifiedWish) => {
    const prevLib = wishesDict[modifiedWish.appId]
    const newWisherIds = modifiedWish.wishers
    const wisherIds = prevLib?.steamIds?.split(',')
    const newlySteamIds = newWisherIds.filter(
      (item) => !wisherIds.includes(item)
    )
    const removedSteamIds = wisherIds.filter(
      (item) => !newWisherIds.includes(item)
    )
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(
      (id) => `「${memberDict[id]?.personaName}」`
    )

    const text = trans(
      add > 0
        ? 'schedule.lib-syncer.wishes-copy-increase'
        : 'schedule.lib-syncer.wishes-copy-decrease',
      {
        name: modifiedWish.itemInfo?.name,
        cnt: Math.abs(add),
        owners: names.join('，'),
        totalCount: newlySteamIds.length,
      }
    )
    // if (add <= 0) {
    //   text = `愿望单变动，${modifiedWish.itemInfo?.name} 副本 ${add}。当前愿望数 ${newWisherIds.length}`
    // }

    return { text: text, relateAppId: modifiedWish.appId.toString() }
  })

  const newLibMsg = newLibs.map((newlib) => {
    const names = newlib.ownerSteamids.map(
      (ownerId) => `「${memberDict[String(ownerId)]?.personaName}」`
    )
    // let text = `感谢富哥${names.join('，')}，库存喜+1。${newlib.name}`
    // if (names.length > 1) {
    //   text += '当前副本数 ' + names.length
    // }
    const text = trans('schedule.lib-syncer.lib-increase-one', {
      name: newlib.name,
      owners: names.join('，'),
      totalCount: names.length,
    })
    return { text: text, relateAppId: newlib.appid.toString() }
  })

  const deleteLibMsg = deletedLibs.map((deletedLib) => ({
    text: trans('schedule.lib-syncer.lib-decrease-one', {
      name: deletedLib.name,
    }),
    relateAppId: deletedLib.appId.toString(),
  }))

  const modifiedLibMsg = modifiedLibs.map((modifiedLib) => {
    const prevLib = libDict[modifiedLib.appid]
    const newOwnerIds = modifiedLib.ownerSteamids
    const ownerIds = prevLib?.steamIds?.split(',')
    const newlySteamIds = newOwnerIds.filter(
      (item) => !ownerIds.includes(String(item))
    )
    const removedSteamIds = ownerIds.filter(
      (item) => !newOwnerIds.includes(BigInt(item))
    )
    const add = newlySteamIds.length - removedSteamIds.length
    const names = newlySteamIds.map(
      (id) => `「${memberDict[String(id)]?.personaName}」`
    )

    const text = trans(
      add > 0
        ? 'schedule.lib-syncer.lib-copy-increase'
        : 'schedule.lib-syncer.lib-copy-decrease',
      {
        name: modifiedLib?.name,
        cnt: Math.abs(add),
        owners: names.join('，'),
        totalCount: newOwnerIds.length,
      }
    )
    // let text = `感谢富哥${names.join('，')}，副本喜+${add}。${modifiedLib.name}，当前副本数 ${newOwnerIds.length}`
    // if (add <= 0) {
    //   text = `库存变动，${modifiedLib.name} 副本 ${add}。当前副本数 ${newOwnerIds.length}`
    // }
    return {
      text,
      relateAppId: modifiedLib.appid.toString(),
    }
  })

  let msgs = [...newLibMsg, ...modifiedLibMsg, ...deleteLibMsg]

  if (item.subscription.subWishes) {
    msgs = msgs.concat([...newWishMsg, ...modifiedWishMsg, ...deleteWishMsg])
  }
  return msgs
}
