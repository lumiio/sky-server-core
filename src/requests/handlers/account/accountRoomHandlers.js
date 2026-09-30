// ============================================================




// ============================================================
const { SkyServerStore } = require("../../../runtimeData/db.js");
const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
const { SkySpiritShopDefs } = require("../../../staticData/spiritShop.js");
const { gameUri, PUBLIC_HOST, gamePort, gameHost } = require("../../../publicHost.js");
const { getFriendData, saveFriendData, addFriendBoth } = require("../../../utils/friendData.js");
const { queryUdpRooms } = require("../../../utils/udpRooms.js");
const { getMailData, saveMailData } = require("../../../utils/mailData.js");

module.exports = function handleAccountRoom(path, body, res, headers, method, query) {
  if (!(path.startsWith("/account/join") || path.startsWith("/account/find_") || path.startsWith("/account/serendipity") || path.startsWith("/account/star") || path.startsWith("/account/room"))) return false;
if (path === "/account/star/get") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/star_tags.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        console.error("star/get error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ get_star_tag_defs: [], star_tag_links: [] }));
      }
      return true;
    }

if (path === "/account/star/bind" || path === "/account/star/link" || path === "/account/star/undo" || path === "/account/star/verify") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/serendipity/join") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        success: true,
        match_id: "match_" + Date.now(),
        current_room_ip: gameHost,
        current_room_port: gamePort,
        session_id: "sess_" + Date.now()
      }));
      return true;
    }

if (path === "/account/find_previous_or_empty") {
      global.SkyServerGlobal = global.SkyServerGlobal || {};
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        uri: gameUri,
        move_ts: Math.floor(Date.now() / 1000),
        signature: "f72c9f65f6bdda54e30e2528e4aadfe72564e1cb79901ca38a6ac9b581e68b10",
        sig: "178402f0a28f7eb58cb4c1b6c312be6657aefd13d60ca8bddb9671c5f80d7f5b",
        ps_only: false,
        platform_filter: 0
      }));
      return true;
    }

if (path === "/account/serendipity/get") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ serendipity_matches: [] }));
      return true;
    }

if (path === "/account/join_random_game") {
      queryUdpRooms().then(rooms => {
        

        const available = rooms.filter(r => r.players < r.capacity);
        const target = available[0] || rooms[0];

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          current_room_ip: target ? target.address?.host || gameHost : gameHost,
          current_room_port: target ? target.address?.port || gamePort : gamePort,
          game_id: target ? target.id : "default",
          session_id: "sess_" + Date.now()
        }));
      });
      return true;
    }

if (path === "/account/join_previous_game") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        success: true,
        current_room_ip: gameHost,
        current_room_port: gamePort,
        game_id: "game_previous",
        session_id: "sess_" + Date.now()
      }));
      return true;
    }

if (path === "/account/star/join") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        success: true,
        current_room_ip: gameHost,
        current_room_port: gamePort,
        game_id: "game_star",
        session_id: "sess_" + Date.now()
      }));
      return true;
    }

  return false;
};
