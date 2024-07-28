import {
  IDBService,
  PartialBy,
  SteamAccount,
  SteamAccountWithFamilyId,
  SteamFamilyLib,
  SteamFamilyLibSubscribe,
} from '@/db/interface'
import { IAPIService, Result } from '../interface'
import { tokenNeedRefresh } from '@/utils'

import { EAuthTokenPlatformType, LoginSession } from 'steam-session'

export abstract class ISteamService<T> {
  db: IDBService<T>
  api: IAPIService
  protected constructor(db: IDBService<T>, api: IAPIService) {
    this.db = db
    this.api = api
  }

  async validAccount(account: SteamAccount): Promise<boolean> {
    try {
      const needRefresh = tokenNeedRefresh(account.steamAccessToken)
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
    session.accessToken = account.steamAccessToken
    session.refreshToken = account.steamRefreshToken
    const needRefresh = tokenNeedRefresh(account.steamRefreshToken)
    if (needRefresh) {
      await session.renewRefreshToken()
    } else {
      await session.refreshAccessToken()
    }
    await this.db.Account.updateSteamAccountToken(account.id, {
      steamAccessToken: session.accessToken,
      steamRefreshToken: session.refreshToken,
    })
    account.steamAccessToken = session.accessToken
    account.steamRefreshToken = session.refreshToken
  }

  async addAccountInfoByLoginSession(
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
    if (!family.data) {
      throw Error('cannot find family Id:' + family.message)
    }
    await this.db.Subscription.addFamilyAccountRel([
      { familyId, steamId: account.steamId },
    ])

    let accountData: Partial<SteamAccount> = {
      status: 'valid',
      ...account,
    }
    // todo: 重复 login 应当无效，这会导致不同账号左右互搏，需要重新考量多账号体系
    const res = await this.db.Account.getSteamAccountBySteamId(account.steamId)
    if (res) {
      accountData = { ...accountData, id: res?.id }
    }
    await this.db.Account.upsertSteamAccount(accountData, channelInfo)
  }

  async refreshFamilyLibByAccount(
    steamAccount: SteamAccountWithFamilyId,
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
    const now = Math.floor(Date.now() / 1000)
    const apps: SteamFamilyLib[] = steamSharedLibs.data.apps
      .filter(
        (item) => item.excludeReason == undefined || item.excludeReason == 0
      )
      .map((item) => ({
        familyId: familyId.toString(),
        appId: item.appid,
        name: item.name,
        steamIds: item.ownerSteamids.sort().join(','),
        lastModifiedAt: now,
        rtTimeAcquired: item.rtTimeAcquired ?? 0,
        type: 'lib',
      }))
    let dbContent = apps
    let wishesSize = 0
    const steamFamily = await this.api.Steam.getSteamFamilyGroup(token)
    if (withWishes) {
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
          lastModifiedAt: now,
          rtTimeAcquired: wish.itemInfo?.added ?? 0,
        }
      })
      dbContent = dbContent.concat(res)
    }
    const members = steamFamily.data.familyGroup.members.map((member) => ({
      familyId: familyId.toString(),
      steamId: member.steamid.toString(),
    }))
    await this.db.Subscription.addFamilyAccountRel(members)
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

  async subscribeFamilyLibByAccount(
    account: SteamAccountWithFamilyId,
    channelInfo: T,
    preferGameImgType: string,
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
      familyId,
      token
    )
    const steamAccountId = steamSharedLibs.data.ownerSteamid

    let dbContent: SteamFamilyLib[] = []
    let wishesSize = 0
    const now = Math.floor(Date.now() / 1000)
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
            lastModifiedAt: now,
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
        lastModifiedAt: now,
        rtTimeAcquired: item.rtTimeAcquired ?? 0,
        type: 'lib',
      }))

    dbContent = dbContent.concat(apps)
    const members = steamFamily.data.familyGroup.members.map((member) => ({
      familyId: familyId.toString(),
      steamId: member.steamid.toString(),
    }))
    await this.db.Subscription.addFamilyAccountRel(members)
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
      preferGameImgType: preferGameImgType,
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
    const items = await this.db.FamilyLib.getSteamFamilyLibByFamilyId(
      res.data.familyGroupid.toString(),
      'lib'
    )
    const recentApp = items
      .sort((a, b) => b.rtTimeAcquired - a.rtTimeAcquired)
      .slice(0, 12)
    const [summary, members, recentAppDetail] = await Promise.all([
      this.api.Steam.withRetry(3).getPlaytimeSummary(
        res.data.familyGroupid,
        token
      ),
      this.api.Steam.withRetry(3).getFamilyMembers(ids, token),
      this.api.Steam.withRetry(3).getSteamItems(
        recentApp.map((it) => it.appId.toString())
      ),
    ])
    return {
      familyInfo: res.data,
      members: members.data,
      games: items,
      playtimeSummary: summary.data,
      recentAppDetail: recentAppDetail.data,
    }
  }
}
