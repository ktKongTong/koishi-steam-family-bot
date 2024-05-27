import {
  GameInfo,
  ISteamFamilySharedLibDAO,
  PartialBy,
  SteamFamilyLib,
} from '../interface'
import { $, Database, Tables } from 'koishi'

export class SteamFamilyLibDAO implements ISteamFamilySharedLibDAO {
  private db: Database<Tables>
  constructor(db: Database<Tables>) {
    this.db = db
  }

  async getSteamFamilyLibByFamilyId(
    familyId: string,
    type: 'lib' | 'wish' = 'lib'
  ): Promise<(SteamFamilyLib & { info: GameInfo })[]> {
    const res = await this.db
      .join(
        ['SteamFamilyLib', 'SteamGameInfo'],
        (lib, info) => $.eq(lib.appId, info.appid),
        [false, true]
      )
      .where((row) => {
        return $.and(
          $.eq(row.SteamFamilyLib.appId, row.SteamGameInfo.appid),
          $.eq(row.SteamFamilyLib.type, type),
          $.eq(row.SteamFamilyLib.familyId, familyId)
        )
      })
      .execute()
    return res.map((it) => ({
      ...it.SteamFamilyLib,
      info: it.SteamGameInfo,
    }))
  }

  async batchUpsertLibInfo(
    infos: PartialBy<GameInfo, 'aliases' | 'tags'>[]
  ): Promise<void> {
    await this.db.upsert('SteamGameInfo', infos)
  }
  async getUnSyncedTagLib(): Promise<SteamFamilyLib[]> {
    const res = await this.db
      .join(
        ['SteamFamilyLib', 'SteamGameInfo'],
        (lib, info) => $.eq(lib.appId, info.appid),
        [false, true]
      )
      .where((row) => {
        return $.or(
          $.lt(
            $.add($.number(row.SteamGameInfo.lastRefreshedAt), -5),
            Date.now()
          ),
          $.eq(row.SteamGameInfo.appid, null)
        )
      })
      .limit(500)
      .execute()
    return res.map((it) => it.SteamFamilyLib)
  }

  async getLibByKeywordAndFamilyId(
    familyId: string,
    queryKey: string
  ): Promise<SteamFamilyLib[]> {
    const res = await this.db
      .join(
        ['SteamFamilyLib', 'SteamGameInfo'],
        (lib, info) => $.eq(lib.appId, info.appid),
        [false, true]
      )
      .where((row) => {
        return $.and(
          $.or(
            $.regex(
              row.SteamFamilyLib.name,
              new RegExp(escapeRegExp(queryKey), 'i')
            ),
            $.regex(
              row.SteamGameInfo.aliases,
              new RegExp(escapeRegExp(queryKey), 'i')
            )
          ),
          $.eq(row.SteamFamilyLib.familyId, familyId),
          $.eq(row.SteamFamilyLib.type, 'lib')
        )
      })
      .execute()
    return res.map((it) => it.SteamFamilyLib)
    // this.db.get('SteamFamilyLib', (row) => {
    //   return $.and(
    //     $.regex(row.name, new RegExp(escapeRegExp(queryKey), 'i')),
    //     $.eq(row.familyId, familyId),
    //     $.eq(row.type, 'lib')
    //   )
    // })
  }

  getFamilyWishes(familyId: string): Promise<SteamFamilyLib[]> {
    return this.db.get('SteamFamilyLib', {
      familyId: familyId,
      type: 'wish',
    })
  }

  async batchRemoveByAppIdAndFamilyId(
    steamFamilyId: string,
    appIds: number[],
    type: 'lib' | 'wish' = 'lib'
  ): Promise<void> {
    await this.db.remove('SteamFamilyLib', {
      appId: appIds,
      familyId: steamFamilyId,
      type: type,
    })
  }

  async batchUpsertFamilyLib(libs: Partial<SteamFamilyLib>[]): Promise<void> {
    await this.db.upsert('SteamFamilyLib', libs)
  }

  async refreshLibByFamilyId(
    familyId: string,
    dbContent: SteamFamilyLib[],
    withWishes: boolean = false
  ): Promise<void> {
    await this.db.withTransaction(async (database) => {
      const res = await database.remove('SteamFamilyLib', {
        familyId: familyId,
        type: withWishes ? ['lib', 'wish'] : 'lib',
      })
      const insertRes = await database.upsert('SteamFamilyLib', dbContent)
    })
  }
}

function escapeRegExp(str: string) {
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const ignoreCaseInput = escaped.replace(/[a-z]/gi, (letter) => {
    return `[${letter.toUpperCase()}${letter.toLowerCase()}]`
  })
  return ignoreCaseInput
}
