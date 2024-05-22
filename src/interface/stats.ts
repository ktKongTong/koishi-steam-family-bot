import {
  CFamilyGroups_GetFamilyGroupForUser_Response, CFamilyGroups_GetPlaytimeSummary_Response
} from "node-steam-family-group-api";
import {
  CPlayer_GetPlayerLinkDetails_Response
} from "node-steam-family-group-api";
import {SteamFamilyLib} from "../index";
import {CStoreBrowse_GetItems_Response} from "node-steam-family-group-api";

export interface FamilyGames {
  familyInfo: CFamilyGroups_GetFamilyGroupForUser_Response,
  members: CPlayer_GetPlayerLinkDetails_Response,
  games: SteamFamilyLib[],
  playtimeSummary: CFamilyGroups_GetPlaytimeSummary_Response,
  recentAppDetail: CStoreBrowse_GetItems_Response
}
