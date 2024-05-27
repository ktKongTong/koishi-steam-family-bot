import {
  IDBService,
  PartialBy,
  SteamAccount,
  SteamFamilyLib,
  SteamFamilyLibSubscribe,
} from '../db/interface'
import { IAPIService, Result } from '../interface'
import { jwtDecode } from 'jwt-decode'
import { now } from 'lodash'
import { EAuthTokenPlatformType, LoginSession } from 'steam-session'

export abstract class ISteamService {
  db: IDBService
  api: IAPIService
  protected constructor(db: IDBService, api: IAPIService) {
    this.db = db
    this.api = api
  }

  async validAccount(account: SteamAccount): Promise<boolean> {
    try {
      const res = jwtDecode(account.steamAccessToken)
      const nt = now()
      const needRefresh = (res.exp - 900) * 1000 < nt
      if (needRefresh) {
        await this.renewAccountToken(account)
      }
    } catch (e) {
      return false
    }
    return true
  }
  abstract createAPIWithCurAccount(
    account: SteamAccount
  ): Promise<Result<IAPIService>>

  async renewAccountToken(account: SteamAccount) {
    const session = new LoginSession(EAuthTokenPlatformType.SteamClient)
    session.refreshToken = account.steamRefreshToken
    await session.refreshAccessToken()
    // await session.renewRefreshToken()
    await this.db.Account.updateSteamAccountToken(account.id, {
      steamAccessToken: session.accessToken,
      steamRefreshToken: session.refreshToken,
    })
    account.steamAccessToken = session.accessToken
    account.steamRefreshToken = session.refreshToken
  }

  async addAccountInfoByLoginSession<T>(
    loginSession: LoginSession,
    channelInfo: T
  ) {
    const account = {
      steamId: loginSession.steamID.toString(),
      accountName: loginSession.accountName,
      steamAccessToken: loginSession.accessToken,
      steamRefreshToken: loginSession.refreshToken,
      lastRefreshTime: new Date().getTime().toFixed(),
    }
    const family = await this.api.Steam.getSteamFamilyGroup(
      loginSession.accessToken
    )
    const familyId = family.data?.familyGroupid?.toString()
    if (!family.ok) {
      throw Error('cannot find family Id:' + family.message)
    }
    const res = await this.db.Account.getSteamAccountBySteamId(account.steamId)
    let accountData: Partial<SteamAccount> = {
      familyId: familyId,
      valid: 'valid',
      ...account,
    }
    if (res) {
      accountData = { id: res[0]?.id, ...accountData }
    }
    await this.db.Account.upsertSteamAccount(accountData, channelInfo)
  }

  async refreshFamilyLibByAccount(
    steamAccount: SteamAccount,
    withWishes: boolean
  ): Promise<{
    wishSize: number
    libSize: number
    familyId: string
  }> {
    const familyId = steamAccount.familyId
    const token = steamAccount.steamAccessToken
    const steamSharedLibs = await this.api.Steam.getSteamFamilyGroupLibs(
      BigInt(familyId),
      token
    )
    const date = new Date()
    const apps: SteamFamilyLib[] = steamSharedLibs.data.apps
      .filter(
        (item) => item.excludeReason == undefined || item.excludeReason == 0
      )
      .map((item) => ({
        familyId: familyId.toString(),
        appId: item.appid,
        name: item.name,
        steamIds: item.ownerSteamids.sort().join(','),
        lastModifiedAt: date.getTime(),
        rtTimeAcquired: item.rtTimeAcquired ?? 0,
        type: 'lib',
      }))
    let dbContent = apps
    let wishesSize = 0
    if (withWishes) {
      const steamFamily = await this.api.Steam.getSteamFamilyGroup(token)
      const memberIds = steamFamily.data.familyGroup.members.map((member) =>
        member.steamid.toString()
      )
      const wishes = (await this.api.Steam.getSteamWishesByPlayerIds(memberIds))
        .data
      wishesSize = wishes.length
      const res: SteamFamilyLib[] = wishes.map((wish) => {
        return {
          familyId: familyId.toString(),
          appId: parseInt(wish.appId),
          name: wish.itemInfo?.name as string,
          steamIds: wish.wishers.sort().join(','),
          type: 'wish',
          lastModifiedAt: date.getTime(),
          rtTimeAcquired: wish.itemInfo?.added ?? 0,
        }
      })
      dbContent = dbContent.concat(res)
    }
    await this.db.FamilyLib.refreshLibByFamilyId(
      familyId,
      dbContent,
      withWishes
    )
    return {
      wishSize: wishesSize,
      libSize: apps.length,
      familyId: familyId,
    }
  }

  async subscribeFamilyLibByAccount<T>(
    account: SteamAccount,
    channelInfo: T,
    subLib: boolean,
    subWish: boolean = false
  ): Promise<{
    wishSize: number
    libSize: number
    familyName: string
  }> {
    const token = account.steamAccessToken
    const steamFamily = await this.api.Steam.getSteamFamilyGroup(token)
    const familyId = steamFamily.data.familyGroupid
    const steamSharedLibs = await this.api.Steam.getSteamFamilyGroupLibs(
      BigInt(account.familyId),
      token
    )
    const steamAccountId = steamSharedLibs.data.ownerSteamid
    let dbContent: SteamFamilyLib[] = []
    let wishesSize = 0
    const date = new Date()
    if (subWish) {
      const memberIds = steamFamily.data.familyGroup.members.map((member) =>
        member.steamid.toString()
      )
      const wishes = (await this.api.Steam.getSteamWishesByPlayerIds(memberIds))
        .data
      wishesSize = wishes.length
      dbContent = dbContent.concat(
        wishes.map((wish) => {
          return {
            familyId: familyId.toString(),
            appId: parseInt(wish.appId),
            name: wish.itemInfo?.name as string,
            steamIds: wish.wishers.sort().join(','),
            type: 'wish',
            lastModifiedAt: date.getTime(),
            rtTimeAcquired: wish.itemInfo?.added ?? 0,
          }
        })
      )
    }
    const apps: SteamFamilyLib[] = steamSharedLibs.data.apps
      .filter(
        (item) => item.excludeReason == undefined || item.excludeReason == 0
      )
      .map((item) => ({
        familyId: familyId.toString(),
        appId: item.appid,
        name: item.name,
        steamIds: item.ownerSteamids.sort().join(','),
        lastModifiedAt: date.getTime(),
        rtTimeAcquired: item.rtTimeAcquired ?? 0,
        type: 'lib',
      }))

    dbContent = dbContent.concat(apps)
    await this.db.FamilyLib.batchUpsertFamilyLib(dbContent)

    const subscribe =
      await this.db.Subscription.getSubscriptionByChannelInfoAndFamilyId(
        familyId.toString(),
        channelInfo
      )

    let subInfo: PartialBy<SteamFamilyLibSubscribe, 'id'> = {
      steamFamilyId: familyId.toString(),
      steamAccountId: steamAccountId.toString(),
      accountId: account.id,
      subLib: subLib,
      subWishes: subWish,
      active: true,
    }
    if (subscribe) {
      subInfo = {
        id: subscribe.id,
        ...subInfo,
      }
    }
    await this.db.Subscription.addSubscription(subInfo, channelInfo)

    return {
      familyName: steamFamily.data.familyGroup.name,
      wishSize: wishesSize,
      libSize: apps.length,
    }
  }

  async getLibStatistic(token: string) {
    const res = await this.api.Steam.getSteamFamilyGroup(token)
    const ids = res.data.familyGroup.members.map((it) => it.steamid.toString())
    const members = await this.api.Steam.getFamilyMembers(ids, token)
    const items = await this.db.FamilyLib.getSteamFamilyLibByFamilyId(
      res.data.familyGroupid.toString()
    )
    const summary = await this.api.Steam.getPlaytimeSummary(
      res.data.familyGroupid,
      token
    )
    const recentApp = items
      .sort((a, b) => b.rtTimeAcquired - a.rtTimeAcquired)
      .slice(0, 12)
    const recentAppDetail = await this.api.Steam.getSteamItems(
      recentApp.map((it) => it.appId.toString())
    )
    return {
      familyInfo: res.data,
      members: members.data,
      games: items,
      playtimeSummary: summary.data,
      recentAppDetail: recentAppDetail.data,
    }
  }
}
