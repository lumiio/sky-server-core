
const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
const { LOGI, LOGW } = require("../../../utils/logger.js");
const { NetServerResponse, NetServerRequest } = require("../netServerRequest.js");
const UUID = require("../../../utils/uuid.js");
const OAuthAccounts = require("../../../oauthAccounts.js"); 






const EXTERNAL_LOGIN_TYPES = [
  "Facebook", "Google", "Apple", "AppleVN",
  "AppleGameCenter", "AppleGameCenterVN",
  "Twitch", "Sony", "Huawei", "Nintendo", "Steam"
];

class AccountAuthLoginResponse extends NetServerResponse {
  constructor(session) {
    super(session);
    this.playerId = "";
  }

  serialize() {
    var result = super.serialize();

    return Object.assign(
      result,
      {
        "token": result.session,
        "authinfo": {
          "user": this.playerId,
          "device": this.deviceId || "",
          "key": "no_bcrypt",
          "recovery_token": this.playerId
        },
        "external_links": [],
        "player_badge_type": -1,
        "resource_list": [
          "device_capabilities",
          "userdata",
          "set_friends",
          "set_friend_statues",
          "online_friends",
          "set_rank",
          "currency",
          "forge_rates",
          "motd",
          "outfit_defs",
          "achievements",
          "achievement_stats",
          "relationship_defs",
          "questionnaires",
          "event_schedule",
          "set_world_quests",
          "iap_list",
          "invite_list",
          "unlocks",
          "get_shop",
          "spirit_shops",
          "collectibles",
          "wing_buffs",
          "gift_messages",
          "set_app_badge_number",
          "get_consumable_defs",
          "get_consumables",
          "get_buff_defs",
          "get_buffs",
          "get_lootboxes",
          "checkpoints",
          "generic_shop_defs",
          "external_account_friends",
          "serendipity_matches",
          "get_star_tag_defs",
          "status_unlocks",
          "free_gifts",
          "get_map_defs",
          "achievement_defs",
          "achievement_stats_tracking",
          "event_currency_defs",
          "infractions",
          "get_user_profile",
          "emote_sequences",
          "video_defs",
          "radiance_spawn_defs",
          "messages"
        ]
      }
    )
  }
}

class AccountAuthLoginRequest extends NetServerRequest {
  static get PATH() {
    return "/account/auth/login";
  }

  static get response() {
    return AccountAuthLoginResponse;
  }

  static handler(req, res, headers) {
    var request = AccountAuthLoginRequest.deserialize(JSON.parse(req))
      , response = new AccountAuthLoginResponse()
      , spb = ServerPlayerBarn.singleton()
      , player;
    headers = headers || {};

    

    var rawReq = {};
    try { rawReq = JSON.parse(req); } catch (e) { rawReq = {}; }

    if (!request) {
      LOGW("invalid login request: empty");
      res.writeHead(400);
      res.end(JSON.stringify({error: "invalid request"}));
      return;
    }

    

    if (global.SkyServerGlobal && global.SkyServerGlobal.maintenanceMode) {
      LOGW("maintenance mode, login rejected: " + (request.user || "unknown"));
      res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        authinfo: {
          device: request.device || "",
          key: "",
          user: "",
          banned: false,
          maintenance: true,
          message: global.SkyServerGlobal.maintenanceMsg || "Server is under maintenance, please try again later"
        },
        external_links: [],
        player_badge_type: -1,
        resource_list: []
      }));
      return;
    }

    if (request.type === "Local") {
      

      if (OAuthAccounts.CFG.disableLocal) {
        LOGW("local passwordless login disabled, rejecting type=Local request");
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          error: "local_login_disabled",
          reason: "Passwordless login is disabled. Please use your account password (register or login on the login page)"
        }));
        return;
      }

      

      var deviceKey = rawReq.device_key || rawReq.device || rawReq.user || "default";
      

      var crypto = require("crypto");
      var hash = crypto.createHash('sha1').update("local_" + deviceKey).digest('hex');
      var userId = hash.substring(0,8) + "-" + hash.substring(8,12) + "-" + hash.substring(12,16) + "-" + hash.substring(16,20) + "-" + hash.substring(20,32);

      try {
        player = spb.login(request.type, userId);
      } catch (e) {
        if (e.message && e.message.includes("currently closed")) {
          LOGW("new player registration rejected: " + userId);
          res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({
            error: "registration_closed",
            banned: false,
            reason: "New player registration is currently closed"
          }));
          return;
        }
        if (e.message && e.message.includes("not open to the public")) {
          LOGW("not whitelisted, login rejected: " + userId);
          res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({
            error: "not_whitelisted",
            banned: false,
            reason: "Server is not open to the public. Contact the admin to be whitelisted"
          }));
          return;
        }
        throw e;
      }

      

      player.deviceModel = rawReq.device_name || rawReq.deviceName || rawReq.deviceModel || rawReq.device_model || rawReq.model || rawReq.system || rawReq.manufacturer || rawReq.brand || "";
      player.save();
      

      try {
        var barn0 = ServerPlayerBarn.singleton();
        if (barn0.allUsers && barn0.allUsers[player.id]) {
          barn0.allUsers[player.id].device = player.deviceModel || "Unknown device";
          barn0.allUsers[player.id].lastLogin = Date.now();
          barn0.saveAllPlayers();
        }
      } catch(e) {}
    } else if (EXTERNAL_LOGIN_TYPES.indexOf(request.type) !== -1) {
      

      

      

      

      var ext = request.externalInfo || {};
      var extPlayerId = ext.userId || "";
      var extSignature = ext.signature || "";
      var tokRec = OAuthAccounts.validateToken(extSignature, extPlayerId);
      if (!tokRec) {
        LOGW("[oauth] external login rejected (invalid token): type=" + request.type + " player=" + extPlayerId);
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          error: "invalid_oauth_token",
          reason: "Login credentials are invalid or expired. Please log in again on the login page"
        }));
        return;
      }
      

      player = spb.login("Local", tokRec.playerId);
      LOGI("[oauth] external login ok: type=" + request.type + " user=" + (ext.alias || tokRec.username) + " -> " + player.id);
      

      if (tokRec.deviceName) {
        player.deviceModel = tokRec.deviceName;
        if (spb.allPlayers && spb.allPlayers[player.id]) {
          spb.allPlayers[player.id].device = tokRec.deviceName;
        }
        player.save();
        LOGI("[device] " + player.id + " -> " + tokRec.deviceName);
      } else {
        LOGW("[device] token has no deviceName (old login page or cache): " + player.id);
      }
    } else {
      LOGW("invalid login request type: " + request.type);
      res.writeHead(400);
      res.end(JSON.stringify({error: "invalid type"}));
      return;
    }

    if (!player) {
      LOGW("login failed: player is undefined");
      res.writeHead(500);
      res.end(JSON.stringify({error: "login failed"}));
      return;
    }

    

    try {
      const banInfo = spb.getBanInfo(player.id);
      if (banInfo) {
        LOGW("banned player tried to login: " + player.id);
        const expireSec = banInfo.expire_time ? Math.floor(banInfo.expire_time / 1000) : Math.floor(Date.now()/1000) + 86400*365*10;
        res.writeHead(406, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          authinfo: {
            device: request.device || "",
            key: player.id,
            user: player.id,
            banned: true,
            ban_type: "account",
            ban_reason: banInfo.reason || "Terms of Service violation",
            ban_expiration: expireSec,
            ban_action: "block",
            user_id: player.id,
            baninfo: {
              type: "account",
              reason: banInfo.reason || "Terms of Service violation",
              active_until: expireSec,
              action: "block",
              infraction_id: "ban_" + player.id,
              user_id: player.id,
              reference_id: player.id
            }
          },
          banned: true,
          user_id: player.id,
          baninfo: {
            type: "account",
            reason: banInfo.reason || "Terms of Service violation",
            active_until: expireSec,
            action: "block",
            infraction_id: "ban_" + player.id,
            user_id: player.id,
            reference_id: player.id
          },
          external_links: [],
          player_badge_type: -1,
          resource_list: []
        }));
        return;
      }
    } catch (e) {
      LOGW("ban check failed: " + e.message);
    }

    LOGI("player logged in: " + player.id);
    response.playerId = player.id || "";
    response.deviceId = request.device || "";
    if (player.session) {
      response.setSession(player.session);
    }

    return response.write(res);
  }

  static deserialize(req) {
    if (typeof req !== "object" || req === null)
      return new AccountAuthLoginRequest();

    var result = new AccountAuthLoginRequest(req.user || "");

    result.type = req.type || "";
    result.device = req.device || "";

    if (!req.external_credentials)
      return result;

    result.externalInfo = {
      accountType: req.external_credentials.external_account_type || "",
      alias: req.external_credentials.alias || "",
      userId: req.external_credentials.player_id || "",
      signature: req.external_credentials.signature || ""
    };

    return result;
  }

  constructor(user) {
    super(user);

    this.type = "";

    this.key = "";

    this.device = "";
    this.deviceKey = "";
    this.deviceName = "";
    this.deviceToken = "";

    this.externalInfo = {
      accountType: "",
      alias: "",
      userId: "",
      signature: ""
    };
  }
}

module.exports = AccountAuthLoginRequest;
