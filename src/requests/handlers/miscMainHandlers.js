// ============================================================








// ============================================================
const { LOGI, LOGW, LOGE } = require("../../utils/logger.js");
const { SkyServerStore } = require("../../runtimeData/db.js");
const { PUBLIC_HOST, cdnHost, gameUri } = require("../../publicHost.js");
const { SkyServerArgs } = require("../../skyServerArgs.js");
const { ServerPlayerBarn } = require("../../runtimeData/player.js");
const { SkySpiritShopDefs } = require("../../staticData/spiritShop.js");
const { getTimeSecond } = require("../../utils/chrono.js");
const { getFriendData, saveFriendData, addFriendBoth } = require("../../utils/friendData.js");
const fs = require("fs");
const pathMod = require("path");
const httpMod = require("http");
const httpsMod = require("https");
const pl = require("path");
const crypto = require("crypto");

module.exports = function handleMiscMain(path, body, res, headers, method, query) {
  if (!path.startsWith("/starwatch/")) return false;

if (path === "/starwatch/auth/api" || path === "/starwatch/auth/api/v1/auth") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        mqtt: {
          clientId: "disabled",
          username: "disabled",
          password: "disabled",
          brokerUrl: "wss://localhost:1"
        },
        settings: {
          enableEventPublishing: false,
          blockedEvents: []
        },
        acls: { publish: [], subscribe: [] },
        ownerId: "disabled",
        isJwt: false,
        expiresSeconds: 86400,
        starwatchSessionId: "disabled",
        serverTime: {
          requestStartMillis: Date.now(),
          requestEndMillis: Date.now()
        }
      }));
      return true;
    }

if (path === "/starwatch/otp/create") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true }));
      return true;
    }

if (path === "/starwatch/otp/revoke") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true }));
      return true;
    }

  return false;
};
