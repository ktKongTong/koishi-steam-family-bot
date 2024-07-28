import {
  FamilyLib,
  GameInfo,
  ISteamFamilySharedLibDAO,
  PartialBy,
  SteamFamilyLib,
} from '@/interface'
import { $, Database, Tables } from 'koishi'

export class SteamFamilyLibDAO implements ISteamFamilySharedLibDAO {
  private db: Database<Tables>
  constructor(db: Database<Tables>) {
    this.db = db
  }

  async getSteamFamilyLibByFamilyId(
    familyId: string,
    type?: 'lib' | 'wish'
  ): Promise<(SteamFamilyLib & { info: GameInfo })[]> {
    const res = await this.db
      .join(
        ['SteamFamilyLib', 'SteamGameInfo'],
        (lib, info) => $.eq(lib.appId, info.appid),
        [false, true]
      )
      .where((row) => {
        let condition = $.or(
          $.eq(row.SteamFamilyLib.type, 'lib'),
          $.eq(row.SteamFamilyLib.type, 'wish')
        )
        if (type) {
          condition = $.eq(row.SteamFamilyLib.type, type)
        }
        return $.and(condition, $.eq(row.SteamFamilyLib.familyId, familyId))
      })
      .execute()
    return res.map((it) => ({
      ...it.SteamFamilyLib,
      info: it.SteamGameInfo,
    }))
  }

  async batchUpsertLibInfo(
    infos: PartialBy<GameInfo, 'aliases' | 'top20Tags'>[]
  ): Promise<void> {
    await this.db.upsert('SteamGameInfo', infos)
  }
  async getUnSyncedLib(limit: number = 500): Promise<SteamFamilyLib[]> {
    const res = await this.db
      .join(
        ['SteamFamilyLib', 'SteamGameInfo'],
        (lib, info) => $.eq(lib.appId, info.appid),
        [false, true]
      )
      .where((row) => {
        return $.or(
          $.lt(
            $.number(row.SteamGameInfo.lastRefreshedAt),
            $.add(Math.floor(Date.now() / 1000), -14 * 24 * 60 * 60)
          ),
          $.eq(row.SteamGameInfo.appid, null)
        )
      })
      .limit(limit)
      .execute()
    return res.map((it) => it.SteamFamilyLib)
  }

  async getLibByKeywordAndFamilyId(
    familyId: string,
    queryKey: string
  ): Promise<FamilyLib[]> {
    const res = await this.db
      .join(
        ['SteamFamilyLib', 'SteamGameInfo'],
        (lib, info) => $.eq(lib.appId, info.appid),
        [false, true]
      )
      .where((row) => {
        return $.and(
          $.or(
            $.eq(row.SteamFamilyLib.appId.toString(), queryKey),
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
    return res.map((it) => ({ ...it.SteamFamilyLib, info: it.SteamGameInfo }))
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
      // @ts-ignore
      const res = await database.remove('SteamFamilyLib', {
        // @ts-ignore
        familyId: familyId,
        // @ts-ignore
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
