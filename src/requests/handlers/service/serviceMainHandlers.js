// ============================================================








// ============================================================
const { LOGI, LOGW, LOGE } = require("../../../utils/logger.js");
const { SkyServerStore } = require("../../../runtimeData/db.js");
const { PUBLIC_HOST, cdnHost, gameUri } = require("../../../publicHost.js");
const { SkyServerArgs } = require("../../../skyServerArgs.js");
const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
const { SkySpiritShopDefs } = require("../../../staticData/spiritShop.js");
const { getTimeSecond } = require("../../../utils/chrono.js");
const { getFriendData, saveFriendData, addFriendBoth } = require("../../../utils/friendData.js");
const fs = require("fs");
const pathMod = require("path");
const httpMod = require("http");
const httpsMod = require("https");
const pl = require("path");
const crypto = require("crypto");

module.exports = function handleServiceMain(path, body, res, headers, method, query) {
  if (!path.startsWith("/service/")) return false;

if (path === "/service/auth/token" || path === "/service/auth/api/v1/token") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        host: cdnHost,
        prefix: "",
        status: "OK",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzY3IiLCJpYXQiOjE2OTk5OTk5OTl9.local"
      }));
      return true;
    }

if (path === "/service/relationship/api/v1/get_follower_count") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ count: 0 }));
      return true;
    }

if (path === "/service/relationship/api/v1/get_all_friend_gist") {
      try {
        const req = JSON.parse(body);
        const myId = req.user || req.user_id || "";
        const fd = getFriendData(myId);
        const friends = fd.friends.map(f => ({
          friend_id: f.id,
          nickname: f.name || f.id.substring(0,8),
          is_online: false
        }));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: "success", friends: friends }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "success", friends: [] }));
      }
      return true;
    }

if (path === "/service/stage/api/v1/get" || path === "/service/stage/api/v1/set" || path === "/service/stage/api/v1/leave_apartment" || path === "/service/stage/api/v1/friends_in_apartments" || path === "/service/stage/api/v1/update_apartment_status") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ stage: null, friends: [], total: 0 }));
      return true;
    }

if (path === "/service/relationship/api/v1/free_gifts/get_pending") {
      try {
        const req = JSON.parse(body);
        const uid = req.user || req.user_id;
        var sent = JSON.parse(SkyServerStore.singleton().getString("gifts_sent_" + uid) || "[]");
        var recvd = JSON.parse(SkyServerStore.singleton().getString("gifts_recv_" + uid) || "[]");
        

        var pendingRecv = recvd.filter(g => !g.recvd);
        if (pendingRecv.length > 0) {
          var player = ServerPlayerBarn.singleton().getPlayer(uid) || ServerPlayerBarn.singleton().loadOfflinePlayer(uid);
          if (player && player.currency) {
            for (var g of pendingRecv) {
              if (g.to_currency_type === "heart") player.currency.heart = (player.currency.heart||0) + g.to_currency_count;
              if (g.to_currency_type === "candles") player.currency.candles = (player.currency.candles||0) + g.to_currency_count;
              g.recvd = true;
            }
            player.save();
            SkyServerStore.singleton().set("gifts_recv_" + uid, JSON.stringify(recvd));
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ set_sent_free_gifts: sent, set_recvd_free_gifts: [] }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ set_sent_free_gifts: [], set_recvd_free_gifts: [] }));
      }
      return true;
    }

if (path === "/service/relationship/api/v1/check_for_previous_completion") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ previously_completed: true }));
      return true;
    }

if (path === "/service/quest/api/v1/get_player_quests") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ active: [], canceled: [], collected: [], failed: [], inactive: [], succeeded: [], suspended: [] }));
      return true;
    }

if (path === "/service/quest/api/v1/get_player_quests_by_name") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ results: {} }));
      return true;
    }

if (path === "/service/quest/api/v1/check_for_previous_completion") {
      let questNames = [];
      try {
        const req = JSON.parse(body);
        questNames = req.quest_names || req.quests || (Array.isArray(req) ? req : []);
      } catch(e) {}
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ results: questNames.map(q => ({ quest_name: q, previously_completed: true, completed_today: true })) }));
      return true;
    }

if (path === "/service/quest/api/v1/get_quest_schedule") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      var today = Math.floor(Date.now()/86400000) * 86400;
      var tomorrow = today + 86400;
      res.end(JSON.stringify({ quest_schedule: [
        { epoch: today, quest_id: "light_20_candles" },
        { epoch: today, quest_id: "fetchlight_mind" },
        { epoch: today, quest_id: "world_quest_night_wise" },
        { epoch: today, quest_id: "bow_at_a_player" },
        { epoch: tomorrow, quest_id: "honk_at_players" },
        { epoch: tomorrow, quest_id: "lightseeker3_day_birdnest" },
        { epoch: tomorrow, quest_id: "world_quest_prairie_rally" },
        { epoch: tomorrow, quest_id: "visit_island_pollution" }
      ] }));
      return true;
    }

if (path === "/service/trust/api/v1/get") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ npcs: [], players: [] }));
      return true;
    }

if (path === "/service/trust/api/v1/activity") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ activities: [] }));
      return true;
    }

if (path === "/service/trust/api/v1/group") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ groups: [] }));
      return true;
    }

if (path === "/service/relationship/api/v1/create_invite") {
      try {
        const req = JSON.parse(body);
        const uid = req.user || req.player_id || req.account_id || "guest";
        const crypto = require("crypto");
        const tokenId = crypto.randomUUID();
        const nickname = req.invite_nickname || "Sky Player";
        const now = Math.floor(Date.now()/1000);
        

        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 9; i++) {
          code += chars[Math.floor(Math.random() * chars.length)];
          if (i === 2 || i === 5) code += "-";
        }
        const inviteData = {
          inviter_user_id: uid,
          token_id: tokenId,
          nickname: nickname,
          code: code,
          friend_id: null,
          created: now
        };
        SkyServerStore.singleton().set("invite_token_" + tokenId, JSON.stringify(inviteData));
        SkyServerStore.singleton().set("my_invite_" + uid, JSON.stringify(inviteData));
        SkyServerStore.singleton().set("code_map_" + code, tokenId);
        console.log("[INVITE] create:", tokenId, "code:", code, "->", uid);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          invite_token_id: tokenId,
          invites: [inviteData]
        }));
      } catch(e) {
        res.writeHead(500); res.end(JSON.stringify({ invite_token_id: "", invites: [] }));
      }
      return true;
    }

if (path === "/service/relationship/api/v1/accept_invite") {
      try {
        const req = JSON.parse(body);
        var tokenId = req.token_id || req.invite_id || req.code || req.invite_token_id || "";
        const myId = req.user || req.player_id || req.account_id;
        

        if (tokenId && (tokenId.match(/-/g) || []).length === 2) {
          const mapped = SkyServerStore.singleton().getString("code_map_" + tokenId);
          if (mapped) tokenId = mapped;
        }
        var raw = SkyServerStore.singleton().getString("invite_token_" + tokenId);
        if (!raw) { res.writeHead(200); res.end(JSON.stringify({ invite_token_id: tokenId, invite_accepted: false, invite_result: "invalid", invite_friend_id: null })); return true; }
        const invite = JSON.parse(raw);
        if (invite.used) { res.writeHead(200); res.end(JSON.stringify({ invite_token_id: tokenId, invite_accepted: false, invite_result: "already_used", invite_friend_id: null })); return true; }
        const friendId = invite.inviter_user_id || invite.creator;
        if (friendId === myId) { res.writeHead(200); res.end(JSON.stringify({ invite_token_id: tokenId, invite_accepted: false, invite_result: "self", invite_friend_id: null })); return true; }
        invite.used = true;
        const { SkyServerStore: AccStore } = require("../../../runtimeData/db.js");
        AccStore.singleton().set("invite_token_" + tokenId, JSON.stringify(invite));
        try { addFriendBoth(myId, friendId); } catch(e) {}
        console.log("[INVITE] accept:", tokenId, myId, "<->", friendId);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          invite_token_id: tokenId,
          invite_accepted: true,
          invite_result: "ok",
          invite_friend_id: friendId,
          update_friends: [{ friend_id: friendId, nickname: invite.nickname || "Sky Player", level: 1, abilities: [], given: 0, recvd: 0, when_created: new Date().toISOString() }]
        }));
      } catch (e) {
        console.error("[INVITE] accept error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ invite_token_id: "", invite_accepted: false, invite_result: "error", invite_friend_id: null }));
      }
      return true;
    }

if (path === "/service/message/api/v1/get") {
      var now = Math.floor(Date.now() / 1000);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      var reqGet = {};
      try { reqGet = JSON.parse(body); } catch(e) {}
      var reqIds = (reqGet.messages || []).map(m => m.id);
      var allMsgs = (global.SkyServerGlobal && global.SkyServerGlobal.customMessages) || [];
      

      try {
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        var dbMsgs = SkyServerStore.singleton().getString("custom_messages");
        if (dbMsgs) {
          var parsed = JSON.parse(dbMsgs);
          if (Array.isArray(parsed) && parsed.length) allMsgs = parsed;
        }
      } catch(e) {}
      var playerId = reqGet.user || reqGet.user_id || "";
      

      var seenSet = {};
      try {
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        var seenRaw = SkyServerStore.singleton().getString("seen_msgs_" + playerId);
        if (seenRaw) seenSet = JSON.parse(seenRaw);
      } catch(e) {}
      var outMsgs = [];
      for (var rid of reqIds) {
        var found = allMsgs.find(m => m.payload && m.payload.headers && m.payload.headers.id === rid);
        if (found) {
          

          var fid = found.payload.headers.id;
          if (seenSet[fid]) found.payload.headers.seen_at = seenSet[fid];
          outMsgs.push(found);
        }
      }
      

      if (!outMsgs.length && allMsgs.length) {
        var unread = allMsgs.filter(m => m.payload && m.payload.headers && !seenSet[m.payload.headers.id]);
        if (unread.length) outMsgs.push(unread[0]);
      }
      res.end(JSON.stringify({ status: "OK", update_messages: outMsgs }));
      return true;
    }

if (path === "/service/message/api/v1/mark_seen") {
      var now = Math.floor(Date.now() / 1000);
      var seenIds = [];
      try {
        var req = JSON.parse(body);
        var playerId = req.user || req.user_id || "";
        if (Array.isArray(req.messages)) {
          for (var m of req.messages) {
            

            var mid = m.id || "";
            if (mid) seenIds.push(mid);
          }
        }
        if (seenIds.length && playerId) {
          const { SkyServerStore } = require("../../../runtimeData/db.js");
          var seenRaw = SkyServerStore.singleton().getString("seen_msgs_" + playerId);
          var seenSet = seenRaw ? JSON.parse(seenRaw) : {};
          

          for (var seenId of seenIds) {
            if (!seenSet[seenId]) {
              var allMsgs = (global.SkyServerGlobal && global.SkyServerGlobal.customMessages) || [];
              if (!allMsgs || !allMsgs.length) {
                try {
                  var dbMsgs = SkyServerStore.singleton().getString("custom_messages");
                  if (dbMsgs) allMsgs = JSON.parse(dbMsgs);
                } catch(e) {}
              }
              var idx = parseInt(seenId.split("_")[1]) || 0;
              var origMsg = allMsgs[idx];
              if (origMsg && origMsg.rewards) {
                const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
                var player = ServerPlayerBarn.singleton().getPlayer(playerId);
                if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
                if (player) {
                  if (origMsg.rewards.candles) player.currency.candles = (player.currency.candles || 0) + origMsg.rewards.candles;
                  if (origMsg.rewards.hearts) player.currency.heart = (player.currency.heart || 0) + origMsg.rewards.hearts;
                  if (origMsg.rewards.season) player.currency.seasonCandle = (player.currency.seasonCandle || 0) + origMsg.rewards.season;
                  if (origMsg.rewards.ascended) player.currency.prestige = (player.currency.prestige || 0) + origMsg.rewards.ascended;
                  player.save();
                }
              }
            }
            seenSet[seenId] = now;
          }
          SkyServerStore.singleton().set("seen_msgs_" + playerId, JSON.stringify(seenSet));
        }
      } catch(e) {}
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", messages: seenIds.map(id => ({ payload: { headers: { id: id, seen_at: now } } })) }));
      return true;
    }

if (path === "/service/message/api/v1/mark_received") {
      var now2 = Math.floor(Date.now() / 1000);
      var recvMsgs = [];
      try {
        var req2 = JSON.parse(body);
        if (Array.isArray(req2.messages)) {
          recvMsgs = req2.messages.map(m => ({ payload: { headers: { id: m.id, received_at: now2 } } }));
        }
      } catch(e) {}
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", messages: recvMsgs }));
      return true;
    }

if (path === "/service/message/api/v2/get_all") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      var reqUser = "";
      try { var reqBody = JSON.parse(body); reqUser = (reqBody.user || reqBody.user_id || ""); } catch(e) {}
      var allMsgs = (global.SkyServerGlobal && global.SkyServerGlobal.customMessages) || [];
      try {
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        var dbMsgs = SkyServerStore.singleton().getString("custom_messages");
        if (dbMsgs) {
          var parsed = JSON.parse(dbMsgs);
          if (Array.isArray(parsed) && parsed.length) allMsgs = parsed;
        }
      } catch(e) {}
      var now = Math.floor(Date.now()/1000);
      var seenSet = {};
      try {
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        var seenRaw = SkyServerStore.singleton().getString("seen_msgs_" + (reqUser || ""));
        if (seenRaw) seenSet = JSON.parse(seenRaw);
      } catch(e) {}
      var messages = allMsgs.map(function(m, i) {
        var msgId = (m.payload && m.payload.headers && m.payload.headers.id) ? m.payload.headers.id : ("msg_" + i);
        var seenTs = seenSet[msgId] || 0;
        var headers = {
          id: msgId,
          type: (m.payload && m.payload.headers && m.payload.headers.type) || "event",
          from: (m.payload && m.payload.headers && m.payload.headers.from) || "44e9f7e2-c9fb-4328-87d4-3544221856ce",
          to: reqUser || "all",
          sent_at: (m.payload && m.payload.headers && m.payload.headers.sent_at) || m.sent_at || now,
          received_at: (m.payload && m.payload.headers && m.payload.headers.received_at) || now,
          expires_at: (m.payload && m.payload.headers && m.payload.headers.expires_at) || (now + 86400 * 90)
        };
        

        if (seenTs) headers.seen_at = seenTs;
        return {
          payload: {
            headers: headers,
            subject: (m.payload && m.payload.subject) || m.subject || m.title || "System message",
            body: (m.payload && m.payload.body) || m.body || m.text || "",
            properties: {
              HasCurrencies: !!(m.rewards && (m.rewards.candles || m.rewards.hearts || m.rewards.wax)),
              HasLinks: false,
              HasUnlocks: !!(m.rewards && m.rewards.outfits),
              HasRewards: !!(m.rewards && Object.keys(m.rewards).length)
            },
            currencies: m.rewards ? {
              candles: m.rewards.candles || 0,
              wax: m.rewards.wax || 0,
              heart: m.rewards.hearts || 0
            } : {candles:0, wax:0, heart:0}
          }
        };
      });
      res.end(JSON.stringify({ status: "OK", messages: messages }));
      return true;
    }

if (path === "/service/infraction/api/v1/get_infractions_status_decorated") {
      try {
        const req = JSON.parse(body);
        const userId = req.user || req.user_id || req.player_id || req.playerId || ctx?.user || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        const banInfo = ServerPlayerBarn.singleton().getBanInfo(userId);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        if (banInfo) {
          const expireSec = banInfo.expire_time ? Math.floor(banInfo.expire_time / 1000) : Math.floor(Date.now()/1000) + 86400*365*10;
          const now = Math.floor(Date.now()/1000);
          const infraction = {
            infraction_id: "ban_" + userId,
            id: "ban_" + userId,
            reference_id: "ban_" + userId,
            reason: banInfo.reason || "Terms of Service violation",
            message: banInfo.reason || "Terms of Service violation",
            type: "system_ban_type_account",
            active_until: expireSec,
            until: expireSec,
            expires_at: expireSec,
            created_at: now,
            created: now,
            appealable: true,
            active: true,
            info: {
              reason: banInfo.reason || "Terms of Service violation",
              type: "system_ban_type_account",
              reference_id: "ban_" + userId
            }
          };
          res.end(JSON.stringify({
            infractions: [infraction],
            total: 1,
            count: 1,
            banned: true,
            is_banned: true,
            active_count: 1,
            last_updated: now,
            baninfo: {
              reason: banInfo.reason || "Terms of Service violation",
              type: "system_ban_type_account",
              active_until: expireSec
            },
            access_status: {
              banned: true,
              type: "system_ban_type_account",
              reason: banInfo.reason || "Terms of Service violation",
              active_until: expireSec,
              action: "block"
            }
          }));
        } else {
          res.end(JSON.stringify({ infractions: [], total: 0, count: 0, banned: false, is_banned: false, active_count: 0, last_updated: Math.floor(Date.now()/1000), baninfo: null, access_status: null }));
        }
      } catch(e) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ infractions: [], total: 0, count: 0, banned: false, is_banned: false, active_count: 0, baninfo: null, access_status: null }));
      }
      return true;
    }

if (path === "/service/infraction/api/v1/get_infractions_status_many") {
      try {
        const req = JSON.parse(body);
        const userIds = req.user_ids || [];
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        const barn = ServerPlayerBarn.singleton();
        var results = [];
        for (const uid of userIds) {
          var banInfo = barn.getBanInfo(uid);
          results.push({
            user_id: uid,
            banned: !!banInfo,
            ban_reason: banInfo ? (banInfo.reason || "Terms of Service violation") : "",
            ban_expiration: banInfo ? (banInfo.expire_time || Math.floor(Date.now()/1000)+86400*365*10) : 0
          });
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ status: "OK", player_access_status: results }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ status: "OK", player_access_status: [] }));
      }
      return true;
    }

if (path === "/service/relationship/api/v1/get_follow") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ result: null, followers: [], following: [] }));
      return true;
    }

if (path === "/service/relationship/api/v1/get_soft_deleted_friend_by_id") {
      try {
        const req = JSON.parse(body);
        const friendId = req.friend_id || "";
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        var friendData = {};
        try {
          var raw = SkyServerStore.singleton().getString("friends_" + req.user);
          if (raw) friendData = JSON.parse(raw);
        } catch(e) {}
        var friend = (friendData.friends || []).find(f => f.id === friendId);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          is_soft_deleted: false,
          is_local_soft_deleted: false,
          nickname: friend ? (friend.nickname || friend.name || "Friend") : "Friend",
          abilities: friend ? (friend.abilities || [1,2,9,10,19,4,35]) : [1,2,9,10,19,4,35]
        }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ is_soft_deleted: false, is_local_soft_deleted: false, nickname: "Friend" }));
      }
      return true;
    }

if (path === "/service/relationship/api/v1/update_friend_constellation_pages") {
      try {
        const req = JSON.parse(body);
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        SkyServerStore.singleton().set("constellation_" + req.user, JSON.stringify({ pages: req.pages || [], updated_at: Math.floor(Date.now()/1000) }));
      } catch(e) {}
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK" }));
      return true;
    }

if (path === "/service/social-feed/api/v1/create") {
      try {
        const req = JSON.parse(body);
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        var feeds = [];
        try {
          var raw = SkyServerStore.singleton().getString("social_feeds");
          if (raw) feeds = JSON.parse(raw);
        } catch(e) {}
        feeds.push({ id: require("crypto").randomUUID(), user: req.user, data: req.data || req.feed || {}, created_at: Math.floor(Date.now()/1000) });
        if (feeds.length > 500) feeds = feeds.slice(-500);
        SkyServerStore.singleton().set("social_feeds", JSON.stringify(feeds));
      } catch(e) {}
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", feed_id: require("crypto").randomUUID() }));
      return true;
    }

if (path === "/service/social-feed/api/v1/get_reactions") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", reactions: [] }));
      return true;
    }

if (path === "/service/social-feed/api/v2/comments") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", comments: [] }));
      return true;
    }

if (path === "/service/social-feed/api/v2/get_daily_free") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", daily_free: 3, claimed: false }));
      return true;
    }

if (path === "/service/social-feed/api/v2/get_penpal_by_sender_receiver" || path === "/service/social-feed/api/v2/get_penpal_status") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", penpal: null, penpals: [] }));
      return true;
    }

if (path === "/service/status/api/v1/get_unlocks") {      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      var now = Math.floor(Date.now() / 1000);
      res.end(JSON.stringify({
        status_unlocks: [
          { name: "FinishedIntro", type: "level", ack: true, unlocked_at: now },
          { name: "AP20IntroBeginning", type: "level", ack: true, unlocked_at: now },
          { name: "LearnedResume", type: "level", ack: true, unlocked_at: now },
          { name: "PlayedFlyingIntro", type: "level", ack: true, unlocked_at: now },
          { name: "MainStreetFlyingIntro", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet", type: "level", ack: true, unlocked_at: now },
          { name: "AP20Unlock", type: "level", ack: true, unlocked_at: now },
          { name: "mainstreetRevealedMural", type: "level", ack: true, unlocked_at: now },
          { name: "MainstreetFirstWakeUp", type: "level", ack: true, unlocked_at: now },
          { name: "HomeWakeupComplete", type: "level", ack: true, unlocked_at: now },
          { name: "crest_unlocked", type: "level", ack: true, unlocked_at: now },
          { name: "WingedLightIntroSeen", type: "level", ack: true, unlocked_at: now },
          { name: "HomeDreamIntroComplete", type: "level", ack: true, unlocked_at: now },
          { name: "nestWelcomeSeen", type: "level", ack: true, unlocked_at: now },
          { name: "MainstreetSeasonIntroComplete", type: "level", ack: true, unlocked_at: now },
          { name: "MainstreetFirstVisit", type: "level", ack: true, unlocked_at: now },
          { name: "OnboardedInMainstreet", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_StorySpace", type: "level", ack: true, unlocked_at: now },
          { name: "OnboardedInStorySpace", type: "level", ack: true, unlocked_at: now },
          { name: "StorySpaceTutorialFinished", type: "level", ack: true, unlocked_at: now },
          { name: "help_howtoplay_basics_v2", type: "level", ack: true, unlocked_at: now },
          { name: "MainstreetFinishedOnboarding", type: "level", ack: true, unlocked_at: now },
          { name: "DayHub", type: "level", ack: true, unlocked_at: now },
          { name: "RewardsActive", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_CandleSpace", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_ShopOutfits", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_ShopSpells", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_ShopProps", type: "level", ack: true, unlocked_at: now },
          { name: "ShopSpellsIntro", type: "level", ack: true, unlocked_at: now },
          { name: "ShopPropsIntro", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dawn", type: "level", ack: true, unlocked_at: now },
          { name: "MainstreetDawnIntro", type: "level", ack: true, unlocked_at: now },
          { name: "PointToTempleHint", type: "level", ack: true, unlocked_at: now },
          { name: "FirstSpiritGained", type: "level", ack: true, unlocked_at: now },
          { name: "tutorial_shop", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Prairie_ButterflyFields", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Prairie_Village", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Prairie_Island", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Prairie_NestAndKeeper", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Prairie_Cave", type: "level", ack: true, unlocked_at: now },
          { name: "PrairieVillageIntro", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Rain", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dusk", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskStart", type: "level", ack: true, unlocked_at: now },
          { name: "DuskLanded", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_CandleSpaceEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DawnCave", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dawn_TrialsAir", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dawn_TrialsEarth", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dawn_TrialsFire", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dawn_TrialsWater", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DayEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DayHubCave", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskEnd_Past", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskGraveyard", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskMid", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskMid_Past", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskMid_PastMarket", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_DuskOasis", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dusk_CrabField", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dusk_HiddenTemple", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dusk_Triangle", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Dusk_TriangleEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreetFlyingIntro", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_Apartment", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_Cafe", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_Cafe_Wonderland", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_ConcertHall", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_Soundbath", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night2", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightArchive", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightDesert", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightDesert_Beach", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightDesert_Planets", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_IPHallway", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_InfiniteDesert", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_JarCave", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_Jumble", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_PaintedWorld", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_Shelter", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_StoryBook", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_ValleyForest", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_ValleyHouse", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_ValleyHouseSky", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_Workshop", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Prairie_WildLifePark", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainForest", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainMid", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainShelter", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Rain_BaseCamp", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Rain_BlueBirdTheater", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Rain_Cave", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetColosseum", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetEnd2", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetRace", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetVillage", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetVillage_MusicShop", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_Citadel", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_FlyRace", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_Theater", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_YetiPark", type: "level", ack: true, unlocked_at: now },
          { name: "DayStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "SunsetStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "RainStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "DuskStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "NightStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "StormStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "AP31Intro_01", type: "level", ack: true, unlocked_at: now },
          { name: "AP31Unlock", type: "level", ack: true, unlocked_at: now },
          { name: "MainstreetFinishedStorm", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_GO_Island", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384672330", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3480027379", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384674155", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384674384", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384673953", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384672886", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384674047", type: "level", ack: true, unlocked_at: now },
          { name: "nestWelcomeLevel", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_01_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_01_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_02_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_02_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_02_quest_started", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_03_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_03_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_03_quest_started", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_04_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_04_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_04_quest_started", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_05_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_06_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_07_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_08_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_09_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_10_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_Cafe_Wonderland", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_ConcertHall", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_MainStreet_Soundbath", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night2", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightArchive", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightDesert", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightDesert_Beach", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightDesert_Planets", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_NightEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_IPHallway", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_InfiniteDesert", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_JarCave", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_Jumble", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_PaintedWorld", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_Shelter", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_StoryBook", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_ValleyForest", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_ValleyHouse", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_ValleyHouseSky", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_Workshop", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Prairie_WildLifePark", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainForest", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainMid", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_RainShelter", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Rain_BaseCamp", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Rain_BlueBirdTheater", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Rain_Cave", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetColosseum", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetEnd", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetEnd2", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetRace", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetVillage", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_SunsetVillage_MusicShop", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_Citadel", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_FlyRace", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_Theater", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Sunset_YetiPark", type: "level", ack: true, unlocked_at: now },
          

          { name: "DayStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "SunsetStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "RainStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "DuskStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "NightStatueForm", type: "level", ack: true, unlocked_at: now },
          { name: "StormStatueForm", type: "level", ack: true, unlocked_at: now },
          

          { name: "AP31Intro_01", type: "level", ack: true, unlocked_at: now },
          { name: "AP31Unlock", type: "level", ack: true, unlocked_at: now },
          { name: "MainstreetFinishedStorm", type: "level", ack: true, unlocked_at: now },
          { name: "first_loaded_Night_GO_Island", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384672330", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3480027379", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384674155", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384674384", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384673953", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384672886", type: "level", ack: true, unlocked_at: now },
          { name: "timeline:mainstreet:3384674047", type: "level", ack: true, unlocked_at: now },
          { name: "nestWelcomeLevel", type: "level", ack: true, unlocked_at: now },
          

          { name: "ap06unlock_ap20_fetch_01_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_01_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_02_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_02_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_02_quest_started", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_03_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_03_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_03_quest_started", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_04_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_04_quest_done", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_04_quest_started", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_05_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_06_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_07_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_08_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_09_claimFx", type: "level", ack: true, unlocked_at: now },
          { name: "ap06unlock_ap20_fetch_10_claimFx", type: "level", ack: true, unlocked_at: now },
        ],
        status_unlocks_total_count: 139
      }));
      return true;
    }

if (path === "/service/status/api/v1/get_player_profile") {
      let req = {};
      try {
        req = JSON.parse(body);
        const playerId = req.user || req.user_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId) ||
                     ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var outfit = (player && player.outfit) ? player.outfit : {};
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          personality_type: 0,
          profile: null,
          player: {
            id: playerId,
            name: (player && player.username) || playerId.substring(0,8),
            outfit: {
              scale: outfit.scale || 0.0697,
              height: outfit.height || 0,
              wingCount: outfit.wingCount || 0,
              wing_count: outfit.wingCount || 0,
              attitude: "0",
              seed: 0,
              voice: 0,
              body: outfit.body || {id:3691343236,mask:0,pat:0,tex:0},
              feet: outfit.feet || {id:1532093990,mask:0,pat:0,tex:0},
              mask: outfit.mask || {id:3663390882,mask:0,pat:0,tex:0},
              neck: outfit.neck || {id:3800884691,mask:0,pat:0,tex:0},
              arms: outfit.arms || {id:0,mask:0,pat:0,tex:0},
              hair: outfit.hair || {id:1229053584,mask:0,pat:0,tex:0},
              hat: outfit.hat || {id:1470462579,mask:0,pat:0,tex:0},
              horn: outfit.horn || {id:3680499229,mask:0,pat:0,tex:0}
            }
          }
        }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ personality_type: 0, profile: null, player: { id: req.user||"", outfit: {scale:0.0697,height:0} } }));
      }
      return true;
    }

if (path === "/service/status/api/v1/add_unlock") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ result: "ok" }));
      return true;
    }

if (path === "/service/status/api/v1/delete_unlock") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ result: "ok" }));
      return true;
    }

if (path === "/service/social-feed/api/v1/get_user_feeds") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", feeds: [] }));
      return true;
    }

if (path === "/service/social-feed/api/v2/get_curated_feeds") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        inner_ring: { local: null, friends: null, followed: null, public: null, boosted: null, total_friends: 0, total_followed: 0, total_available_results: 0 },
        outer_ring: null
      }));
      return true;
    }

if (path === "/service/social-feed/api/v2/get_penpals") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ penpals: [] }));
      return true;
    }

if (path === "/service/stage/api/v1/get") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "no result" }));
      return true;
    }

if (path === "/service/stage/api/v1/set") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK" }));
      return true;
    }

if (path === "/service/recording/api/v2/create") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", recording_id: require("crypto").randomUUID() }));
      return true;
    }

if (path === "/service/recording/api/v2/get") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", recordings: [] }));
      return true;
    }

if (path === "/service/social-feed/api/v1/like" || path === "/service/social-feed/api/v1/super_like" || path === "/service/social-feed/api/v1/report") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK" }));
      return true;
    }

if (path === "/service/relationship/api/v1/add_follow") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK" }));
      return true;
    }

if (path === "/service/relationship/api/v1/free_gifts/send") {
      try {
        const req = JSON.parse(body);
        const fromId = req.user || req.user_id;
        const toId = req.to_id || req.recipient_id;
        const giftType = req.type || "gift_heart";
        const currencyType = req.to_currency_type || "heart";
        const count = req.to_currency_count || 1;

        

        var barn = ServerPlayerBarn.singleton();
        var sender = barn.getPlayer(fromId) || barn.loadOfflinePlayer(fromId);
        if (sender && sender.currency) {
          if (currencyType === "heart") sender.currency.heart = Math.max(0, (sender.currency.heart||0) - count);
          if (currencyType === "candles") sender.currency.candles = Math.max(0, (sender.currency.candles||0) - count);
          sender.save();
        }

        

        var giftId = Date.now();
        var gift = { gift_id: giftId, type: giftType, to_currency_type: currencyType, to_currency_count: count, recvd: false, from_id: fromId, to_id: toId };
        var sentKey = "gifts_sent_" + fromId;
        var recvKey = "gifts_recv_" + toId;
        var sent = JSON.parse(SkyServerStore.singleton().getString(sentKey) || "[]");
        sent.push(gift);
        SkyServerStore.singleton().set(sentKey, JSON.stringify(sent));
        var recv = JSON.parse(SkyServerStore.singleton().getString(recvKey) || "[]");
        recv.push(gift);
        SkyServerStore.singleton().set(recvKey, JSON.stringify(recv));

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ status: "OK", gift_id: giftId }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ status: "OK" }));
      }
      return true;
    }

if (path === "/service/quest/api/v1/create") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", quest_id: require("crypto").randomUUID() }));
      return true;
    }

  return false;
};
