import {StoreItem} from "node-steam-family-group-api/lib/proto/gen/web-ui/common_pb";

export const getGameAsset = (game:StoreItem, filename:string) => {
  const format = game.assets?.assetUrlFormat
  const prefix = "https://cdn.akamai.steamstatic.com/"
  const url = format?.replace("${FILENAME}", filename)
  // console.log(prefix+url)
  return prefix + url
}
export const getGameCapsule = (game:StoreItem) => {
  return getGameAsset(game,game.assets?.libraryCapsule??game.assets?.mainCapsule??game.assets?.smallCapsule??'')
}
