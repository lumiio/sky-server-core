

const pl = require("path");
const { LOGI, LOGW, LOGE } = require("../utils/logger.js");
const { SkyServerStore } = require("../runtimeData/db.js");


const { PUBLIC_HOST, cdnHost, gameUri } = require("../publicHost.js");




const handleMissingEndpoints = require("./handlers/missingEndpoints.js");



const AccountBuffDefsRequest = require("./handlers/account/defs/accountBuffDefsRequest.js");       

const AccountConsumableDefsRequest = require("./handlers/account/defs/accountConsumableDefsRequest.js"); 

const AccountGetEventScheduleRequest = require("./handlers/account/defs/accountGetEventScheduleRequest.js"); 

const AccountGetVarsRequest = require("./handlers/account/defs/accountGetVarsRequest.js");           

const AccountQuestDefsRequest = require("./handlers/account/defs/accountQuestDefsRequest.js");       

const AccountGetRelationDefsRequest = require("./handlers/account/defs/accountGetRelationDefsRequest.js"); 

const AccountGetSpiritShopsRequest = require("./handlers/account/defs/accountGetSpiritShopsRequest.js"); 

const AccountTrustActivityDefsRequest = require("./handlers/account/defs/accountTrustActivityDefsRequest.js"); 

const AccountTrustGroupDefsRequest = require("./handlers/account/defs/accountTrustGroupDefsRequest.js");   

const AccountTrustTierDefsRequest = require("./handlers/account/defs/accountTrustTierDefsRequest.js");     




const AccountAuthLoginRequest = require("./handlers/account/accountAuthLoginRequest.js");       

const AccountOAuthSigninRequest = require("./handlers/account/accountOAuthSigninRequest.js");   

const AccountOAuthRedirectRequest = require("./handlers/account/accountOAuthRedirectRequest.js"); 

const AccountConsumeItemRequest = require("./handlers/account/accountConsumeItemRequest.js");   

const AccountGetMessagesRequest = require("./handlers/account/accountGetMessagesRequest.js");   

const AccountRemoveBuffRequest = require("./handlers/account/accountRemoveBuffRequest.js");     




const ServiceAddUnlockRequest = require("./handlers/service/serviceAddUnlockRequest.js");       

const handleServiceReal = require("./handlers/service/serviceRealEndpoints.js"); 




// const StarwatchAuthApiRequest = require("./handlers/starwatch/starwatchAuthApiRequest.js");
const { SkyServerArgs } = require("../skyServerArgs.js");


const { ServerPlayerBarn } = require("../runtimeData/player.js");
const { SkySpiritShopDefs } = require("../staticData/spiritShop.js");
const { getTimeSecond } = require("../utils/chrono.js");
const fs = require("fs");
const pathMod = require("path");
const httpMod = require("http");
const httpsMod = require("https");

const handleAccountExtras = require("./handlers/account/accountExtrasHandlers.js");
const handleAccountMain = require("./handlers/account/accountMainHandlers.js");
const handleServiceMain = require("./handlers/service/serviceMainHandlers.js");
const handleMiscMain = require("./handlers/miscMainHandlers.js");
const { getFriendData, saveFriendData, addFriendBoth } = require("../utils/friendData.js");

class NetServerRequestHandler {
  constructor() {
    var R;  


    this.requests = R = new Map();

    

    AccountBuffDefsRequest.register(R);
    AccountConsumableDefsRequest.register(R);
    AccountGetEventScheduleRequest.register(R);
    AccountGetVarsRequest.register(R);
    AccountGetRelationDefsRequest.register(R);
    AccountGetSpiritShopsRequest.register(R);
    AccountQuestDefsRequest.register(R);
    AccountTrustActivityDefsRequest.register(R);
    AccountTrustGroupDefsRequest.register(R);
    AccountTrustTierDefsRequest.register(R);

    

    AccountAuthLoginRequest.register(R);
    AccountOAuthSigninRequest.register(R);
    AccountOAuthRedirectRequest.register(R);
    AccountConsumeItemRequest.register(R);
    AccountGetMessagesRequest.register(R);
    AccountRemoveBuffRequest.register(R);

    

    ServiceAddUnlockRequest.register(R);

    

    // StarwatchAuthApiRequest.register(R);
  }

  
  handle(url, body, res, headers, method, query) {
    var path = pl.posix.normalize(url)  

      , handler;
    this._headers = headers || {};
    this._method = method || "GET";
    this._query = query || "";


    

    


    

    

    

    


    if (path.startsWith("/account/")) {
      var blockedPaths = [
        "/account/consume_item",     

        "/account/remove_buff",      

        "/account/set_outfit",       

        "/account/send_message",     

        "/account/gift",             

        "/account/give",             

        "/account/update_profile"    

      ];
      var isBlocked = blockedPaths.some(p => path === p || path.startsWith(p + "/"));
      if (isBlocked) {
        

        

        var sidBody = "";
        try { var _b = body ? JSON.parse(body) : {}; sidBody = _b.session || ""; } catch (e) {}
        var sid = (headers["x-session-token"] || headers["X-Session-Token"] || sidBody || "").toString();
        var { ServerPlayerBarn: _SPB } = require("../runtimeData/player.js");
        var authed = sid && _SPB.singleton().getBySession(sid);
        if (!authed) {
          LOGW("[auth] unauthorized request rejected: " + path);
          res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "unauthorized", reason: "Please log in first" }));
          return true;
        }
      }
    }

    

    

    

    

    

    

    

    if (path.startsWith("/resources/") || path === "/manifest") {
      const cacheDir = pathMod.join(__dirname, "../../resource_cache");
      const hash = path.replace("/resources/", "");

      

      

      

      if (path.startsWith("/resources/") && !/^[0-9a-f]{32,64}$/i.test(hash)) {
        LOGW("[resource] invalid hash rejected: " + hash.slice(0, 60));
        res.writeHead(404, { "Content-Length": 0 });
        res.end();
        return true;
      }
      const localFile = pathMod.join(cacheDir, "_resources_" + hash);

      

      

      

      

      

      if (path === "/manifest") {
        res.writeHead(404, { "Content-Length": 0 });
        res.end();
        return true;
      }

      

      if (fs.existsSync(localFile) && fs.statSync(localFile).size > 0) {
        const stat = fs.statSync(localFile);
        res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": stat.size });
        fs.createReadStream(localFile).pipe(res);
        return true;
      }

      

      const upstream = (process.env.SKY_RESOURCE_UPSTREAM || "").trim().replace(/\/+$/, "");
      if (upstream) {
        LOGW("[resource] local cache miss " + hash + ", fetching from upstream " + upstream + "...");
        const upstreamUrl = upstream + "/resources/" + hash;
        const lib = /^https:/i.test(upstreamUrl) ? httpsMod : httpMod;
        const done = (code, msg) => {
          try { res.writeHead(code, { "Content-Length": 0 }); } catch (e) {}
          res.end(msg || "");
        };
        lib.get(upstreamUrl, (r2) => {
          if (r2.statusCode === 200) {
            const chunks = [];
            r2.on("data", (c) => chunks.push(c));
            r2.on("end", () => {
              const buf = Buffer.concat(chunks);
              try {
                fs.writeFileSync(localFile, buf); 

                LOGI("[resource] cached from upstream " + hash + " (" + buf.length + " bytes)");
              } catch (e) {
                LOGW("[resource] cache write failed " + hash + ": " + (e && e.message));
              }
              try { res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": buf.length }); } catch (e) {}
              res.end(buf);
            });
            r2.on("error", (e2) => {
              LOGW("[resource] upstream read failed " + hash + ": " + (e2 && e2.message));
              done(404, "");
            });
          } else {
            LOGW("[resource] upstream has no such resource " + hash + " (HTTP " + r2.statusCode + ")");
            done(404, "");
          }
        }).on("error", (e2) => {
          LOGW("[resource] upstream connection failed " + hash + ": " + (e2 && e2.message));
          done(404, "");
        });
        return true;
      }

      

      LOGW("[resource] client requested resource missing: /resources/" + hash +
        " (place the resource file at resource_cache/_resources_" + hash + ", or set SKY_RESOURCE_UPSTREAM to auto-fetch)");
      res.writeHead(404, { "Content-Length": 0 });
      res.end();
      return true;
    }

    

    if (path.startsWith("/service/") && handleServiceReal(path, body, res)) {
      return true;
    }

    

    

    if (handleAccountMain(path, body, res, this._headers, this._method, this._query)) return true;
    if (handleServiceMain(path, body, res, this._headers, this._method, this._query)) return true;
    if (handleMiscMain(path, body, res, this._headers, this._method, this._query)) return true;


    


    


    

    if (handleAccountExtras(path, body, res)) return true;

    var cosmeticPaths = {
      "/account/get_cosmetics": "cosmetics",
      "/account/get_outfits": "outfits",
      "/account/get_emotes": "emotes",
      "/account/get_masks": "masks",
      "/account/get_capes": "capes",
      "/account/get_shoes": "shoes",
      "/account/get_hair": "hair"
    };
    if (cosmeticPaths[path]) {
      var p2 = getReqPlayer();
      var items = [];
      if (p2 && p2.accountUnlocks && p2.accountUnlocks.unlocks) {
        items = Object.keys(p2.accountUnlocks.unlocks);
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      var key = cosmeticPaths[path];
      var resp = {};
      resp[key] = items.map(id => ({ id: id.toString(), unlocked: true }));
      resp.total = items.length;
      res.end(JSON.stringify(resp));
      return true;
    }

    

    var defaultResponses = {
      "/account/get_player_stats": { stats: { candles_collected: 0, friends_made: 0, spirits_unlocked: 0, wings_collected: 0 } },
      "/account/get_promotions": { promotions: [] },
      "/account/get_events": { events: [] },
      "/account/get_gifts": { gifts: [] },
      "/account/get_map_completion": { completion: { sky: 0, prairie: 0, valley: 0, forest: 0, wasteland: 0, vault: 0 } }
    };
    if (defaultResponses[path]) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(defaultResponses[path]));
      return true;
    }

    

    

    if (!this.requests.has(path) || SkyServerArgs.singleton().isRequestDisabled(path)) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end("{}");
      return false;
    }

    handler = this.requests.get(path);  


    try {
      

      handler.handler(body, res, this._headers, this._method, this._query);
    } catch (e) {
      

      LOGE(`error when requesting ${path}: ${e}`);
      res.writeHead(500);
      res.end();
      return false;
    }

    res.end();  


    return true;
  }
  handlePlayerDetail(body, res) {
    try {
      const req = JSON.parse(body);
      const pid = req.playerId || req.id || "";
      const { ServerPlayerBarn } = require("../runtimeData/player.js");
      var player = ServerPlayerBarn.singleton().players[pid] ||
                   ServerPlayerBarn.singleton().loadOfflinePlayer(pid);
      if (!player) { res.writeHead(404); res.end(JSON.stringify({ success: false, error: "Player not found" })); return; }
      

      var unlockCount = 0;
      var emoteCount = 0;
      var outfitCount = 0;
      if (player.accountUnlocks && player.accountUnlocks.entries) {
        for (const e of player.accountUnlocks.entries.values()) {
          unlockCount++;
          if (e.name && e.name.indexOf("emote_upgrade_") === 0) emoteCount++;
          if (e.name && (e.name.indexOf("CharSkyKid_") === 0 || e.name.indexOf("outfit") >= 0)) outfitCount++;
        }
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      var _p = ServerPlayerBarn.singleton().players[pid];
      var _online = !!(_p && _p.lastSeen && (Date.now() - _p.lastSeen < 30 * 1000));
      res.end(JSON.stringify({
        success: true,
        id: pid,
        online: _online,
        currency: {
          candles: player.currency ? (player.currency.candles || 0) : 0,
          wax: player.currency ? (player.currency.wax || 0) : 0,
          hearts: player.currency ? (player.currency.heart || 0) : 0,
          seasonCandles: player.currency ? (player.currency.seasonCandle || 0) : 0,
          ascended: player.currency ? (player.currency.prestige || 0) : 0
        },
        wings: player.outfit ? (player.outfit.wingCount || 0) : 0,
        height: player.outfit ? (player.outfit.height || 0) : 0,
        unlockCount: unlockCount,
        emoteCount: emoteCount,
        outfitCount: outfitCount
      }));
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ success: false, error: e.message })); }
  }


  handleListMessages(res) {
    const { ServerPlayerBarn } = require("../runtimeData/player.js");
    const barn = ServerPlayerBarn.singleton();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ messages: barn.messages }));
  }



}

module.exports = {
  NetServerRequestHandler
};





function handleServiceFallback(path, res) {
  if (path.startsWith("/service/")) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      success: true,
      total: 0,
      quests: [],
      gifts: [],
      friends: [],
      items: [],
      unlocks: [],
      infraction: null
    }));
    return true;
  }

  

  if (path.startsWith("/service/")) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      success: true,
      total: 0,
      quests: [],
      gifts: [],
      friends: [],
      items: [],
      unlocks: [],
      infraction: null,
      messages: []
    }));
    return true;
  }

  return false;
}
