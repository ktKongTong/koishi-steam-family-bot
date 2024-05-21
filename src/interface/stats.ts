import {
  CFamilyGroups_GetFamilyGroupForUser_Response, CFamilyGroups_GetPlaytimeSummary_Response
} from "node-steam-family-group-api/lib/proto/gen/web-ui/service_familygroups_pb";
import {
  CPlayer_GetPlayerLinkDetails_Response
} from "node-steam-family-group-api/lib/proto/gen/web-ui/service_player_pb";
import {SteamFamilyLib} from "../index";
import {CStoreBrowse_GetItems_Response} from "node-steam-family-group-api/lib/proto/gen/web-ui/common_pb";

export interface FamilyGames {
  familyInfo: CFamilyGroups_GetFamilyGroupForUser_Response,
  members: CPlayer_GetPlayerLinkDetails_Response,
  games: SteamFamilyLib[],
  playtimeSummary: CFamilyGroups_GetPlaytimeSummary_Response,
  recentAppDetail: CStoreBrowse_GetItems_Response
}
