/**
 * ApifoxModel
 */
export interface SteamPlayers {
  accounts: Account[];
  [property: string]: any;
}

export interface Account {
  privateData: PrivateData;
  publicData: PublicData;
  [property: string]: any;
}

export interface PrivateData {
  lastLogoffTime?: number;
  lastSeenOnline?: number;
  personaState?: number;
  personaStateFlags?: number;
  timeCreated: number;
  [property: string]: any;
}

export interface PublicData {
  contentCountryRestricted: boolean;
  personaName: string;
  profileState: number;
  profileUrl: string;
  shaDigestAvatar: string;
  steamid: string;
  visibilityState: number;
  [property: string]: any;
}
