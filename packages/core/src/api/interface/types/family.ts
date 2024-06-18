/**
 * ApifoxModel
 */
export interface APIResp<T> {
  data: T
  [property: string]: any
}

export interface SteamFamily {
  cooldownSecondsRemaining: number
  familyGroup: FamilyGroup
  familyGroupid: string
  isNotMemberOfAnyGroup: boolean
  latestJoinedFamilyGroupid: string
  latestTimeJoined: number
  pendingGroupInvites: string[]
  role: number
  [property: string]: any
}

export interface FamilyGroup {
  country: string
  formerMembers: string[]
  freeSpots: number
  members: Member[]
  name: string
  pendingInvites: string[]
  slotCooldownOverrides: number
  slotCooldownRemainingSeconds: number
  [property: string]: any
}

export interface Member {
  cooldownSecondsRemaining: number
  role: number
  steamid: string
  timeJoined: number
  [property: string]: any
}
