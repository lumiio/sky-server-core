// ============================================================




// ============================================================
const { SkyServerStore } = require("../../../runtimeData/db.js");
const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
const { SkySpiritShopDefs } = require("../../../staticData/spiritShop.js");
const { gameUri, PUBLIC_HOST, gamePort, gameHost } = require("../../../publicHost.js");
const { getFriendData, saveFriendData, addFriendBoth } = require("../../../utils/friendData.js");
const { getMailData, saveMailData } = require("../../../utils/mailData.js");

module.exports = function handleAccountFriend(path, body, res, headers, method, query) {
  if (!(path.startsWith("/account/friend") || path.startsWith("/account/invite") || path.startsWith("/account/relationship") || path.startsWith("/account/get_friends") || path.startsWith("/account/set_joinable") || path.startsWith("/account/gist"))) return false;
if (path === "/account/get_friends") {
      try {
        const req = JSON.parse(body);
        const myId = req.user || req.user_id || req.player_id || "";
        var fd = getFriendData(myId);
        var friendList = fd.friends.map(f => ({
          friend_id: f.id,
          nickname: f.name || (f.id || "").substring(0, 8),
          level: 1,
          abilities: [19, 6, 9, 2, 27, 1, 10],
          given: f.given || 0,
          recvd: f.recvd || 0,
          when_created: new Date().toISOString(),
          last_seen_outfit: null,
          unlinked_star_sku: "",
          soft_deleted: null,
          they_soft_deleted: null
        }));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ set_friends: friendList.length ? friendList : null }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ set_friends: null }));
      }
      return true;
    }

if (path === "/account/get_online_friends") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ online_friends: [] }));
      return true;
    }

if (path === "/account/create_invite") {
      try {
        const req = JSON.parse(body);
        const uid = req.user || req.user_id || req.player_id || "guest";
        const crypto = require("crypto");
        const tokenId = crypto.randomUUID();
        const nickname = req.invite_nickname || "Sky Player";
        const now = Math.floor(Date.now()/1000);
        

        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let shortCode = "";
        for (let i = 0; i < 9; i++) {
          shortCode += chars[Math.floor(Math.random() * chars.length)];
          if (i === 2 || i === 5) shortCode += "-";
        }
        const inviteData = {
          inviter_user_id: uid,
          token_id: tokenId,
          nickname: nickname,
          code: shortCode,
          friend_id: null,
          created: now
        };
        SkyServerStore.singleton().set("my_invite_" + uid, JSON.stringify(inviteData));
        SkyServerStore.singleton().set("invite_token_" + tokenId, JSON.stringify(inviteData));
        SkyServerStore.singleton().set("code_map_" + shortCode, tokenId);
        console.log("[INVITE] create:", tokenId, "code:", shortCode, "->", uid);
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

if (path === "/account/get_invites") {
      try {
        const req = JSON.parse(body);
        const uid = req.user || req.user_id || "";
        var invite = null;
        try {
          var raw = SkyServerStore.singleton().getString("my_invite_" + uid);
          if (raw) invite = JSON.parse(raw);
        } catch(e) {}
        

        if (!invite) {
          const crypto2 = require("crypto");
          const tokenId = crypto2.randomUUID();
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let shortCode = "";
          for (let i = 0; i < 9; i++) {
            shortCode += chars[Math.floor(Math.random() * chars.length)];
            if (i === 2 || i === 5) shortCode += "-";
          }
          invite = {
            inviter_user_id: uid,
            token_id: tokenId,
            nickname: "Sky Player",
            code: shortCode,
            friend_id: null,
            created: Math.floor(Date.now()/1000)
          };
          SkyServerStore.singleton().set("my_invite_" + uid, JSON.stringify(invite));
          SkyServerStore.singleton().set("invite_token_" + tokenId, JSON.stringify(invite));
          SkyServerStore.singleton().set("code_map_" + shortCode, tokenId);
          console.log("[INVITE] auto-create:", shortCode, "->", uid);
        } else if (!invite.code) {
          

          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let shortCode = "";
          for (let i = 0; i < 9; i++) {
            shortCode += chars[Math.floor(Math.random() * chars.length)];
            if (i === 2 || i === 5) shortCode += "-";
          }
          invite.code = shortCode;
          SkyServerStore.singleton().set("my_invite_" + uid, JSON.stringify(invite));
          SkyServerStore.singleton().set("code_map_" + shortCode, invite.token_id);
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ invites: [invite] }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ invites: [] }));
      }
      return true;
    }

if (path === "/account/add_friend_by_code") {
      try {
        const req = JSON.parse(body);
        const myId = req.user;
        var code = (req.code || req.token_id || "").toUpperCase().replace(/^SKY/, "");
        

        var mapped = SkyServerStore.singleton().getString("code_map_" + code);
        if (mapped) code = mapped;

        var friendId = SkyServerStore.singleton().getString("invite_" + code);
        

        if (!friendId) {
          var raw = SkyServerStore.singleton().getString("invite_token_" + code);
          if (raw) { var inv = JSON.parse(raw); friendId = inv.inviter_user_id; }
        }
        if (!friendId) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: false, error: "Invalid invite code" }));
          return true;
        }

        if (friendId === myId) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: false, error: "You cannot add yourself" }));
          return true;
        }

        const myData = getFriendData(myId);
        if (!myData.friends.find(f => f.id === friendId)) {
          myData.friends.push({
            id: friendId,
            name: friendId.substring(0, 8),
            note: "",
            added_time: Date.now(),
            favorite: false,
            blocked: false,
            muted: false
          });
          saveFriendData(myId, myData);
        }

        const friendData = getFriendData(friendId);
        if (!friendData.friends.find(f => f.id === myId)) {
          friendData.friends.push({
            id: myId,
            name: myId.substring(0, 8),
            note: "",
            added_time: Date.now(),
            favorite: false,
            blocked: false,
            muted: false
          });
          saveFriendData(friendId, friendData);
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, friend: { id: friendId, name: friendId.substring(0, 8) } }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false, error:e.message}));
      }
      return true;
    }

if (path === "/account/accept_invite") {
      try {
        const req = JSON.parse(body);
        console.log("[ACCEPT_INVITE] request:", JSON.stringify(req));
        const myId = req.user || req.user_id || req.player_id || "";
        var tokenId = req.token_id || req.invite_id || req.code || req.invite_token_id || req.qr_code || "";

        

        var mapped = SkyServerStore.singleton().getString("code_map_" + tokenId);
        if (mapped) tokenId = mapped;

        var raw = SkyServerStore.singleton().getString("invite_token_" + tokenId);
        if (!raw) {
          res.writeHead(200); res.end(JSON.stringify({ invite_token_id: tokenId, invite_accepted: false, invite_result: "invalid", invite_friend_id: null }));
          return true;
        }
        const invite = JSON.parse(raw);
        if (invite.used) {
          res.writeHead(200); res.end(JSON.stringify({ invite_token_id: tokenId, invite_accepted: false, invite_result: "already_used", invite_friend_id: null }));
          return true;
        }
        const friendId = invite.inviter_user_id;
        if (friendId === myId) {
          res.writeHead(200); res.end(JSON.stringify({ invite_token_id: tokenId, invite_accepted: false, invite_result: "self", invite_friend_id: null }));
          return true;
        }

        

        const myData = getFriendData(myId);
        if (!myData.friends.find(f => f.id === friendId)) {
          myData.friends.push({ id: friendId, name: invite.nickname || friendId.substring(0,8), note: "", added_time: Date.now(), favorite: false, blocked: false, muted: false });
          saveFriendData(myId, myData);
        }
        const friendData = getFriendData(friendId);
        if (!friendData.friends.find(f => f.id === myId)) {
          friendData.friends.push({ id: myId, name: myId.substring(0,8), note: "", added_time: Date.now(), favorite: false, blocked: false, muted: false });
          saveFriendData(friendId, friendData);
        }

        invite.used = true;
        invite.friend_id = myId;
        SkyServerStore.singleton().set("invite_token_" + tokenId, JSON.stringify(invite));

        res.writeHead(200); res.end(JSON.stringify({
          invite_token_id: tokenId,
          invite_accepted: true,
          invite_result: "ok",
          invite_friend_id: friendId,
          update_friends: [{
            unlinked_star_sku: "",
            given: 0,
            recvd: 1,
            level: 1,
            abilities: [19, 6, 9, 2, 27, 1, 10],
            when_created: new Date().toISOString(),
            friend_id: friendId,
            last_seen_outfit: null,
            nickname: invite.nickname || "Sky Player",
            soft_deleted: null,
            they_soft_deleted: null
          }],
          set_friend_count: myData.friends.length,
          update_online_friends: []
        }));
      } catch (e) {
        console.error("[INVITE] accept error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ invite_token_id: "", invite_accepted: false, invite_result: "error", invite_friend_id: null }));
      }
      return true;
    }

if (path === "/account/get_invites" || path === "/account/get_invite_list") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ invites: [] }));
      return true;
    }

if (path === "/account/delete_invite") {
      try {
        const req = JSON.parse(body);
        const myId = req.user;
        const friendId = req.friend_id || req.id || "";
        const myData = getFriendData(myId);
        myData.friends = myData.friends.filter(f => f.id !== friendId);
        saveFriendData(myId, myData);
        

        const friendData = getFriendData(friendId);
        friendData.friends = friendData.friends.filter(f => f.id !== myId);
        saveFriendData(friendId, friendData);
        res.writeHead(200); res.end(JSON.stringify({success:true}));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/set_friend_name") {
      try {
        const req = JSON.parse(body);
        const myId = req.user;
        const friendId = req.friend_id || req.id || "";
        const note = req.name || req.note || "";
        const myData = getFriendData(myId);
        const f = myData.friends.find(f => f.id === friendId);
        if (f) { f.note = note; saveFriendData(myId, myData); }
        res.writeHead(200); res.end(JSON.stringify({success:true}));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/set_friend_favorite") {
      try {
        const req = JSON.parse(body);
        const myId = req.user;
        const friendId = req.friend_id || req.id || "";
        const fav = !!req.favorite;
        const myData = getFriendData(myId);
        const f = myData.friends.find(f => f.id === friendId);
        if (f) { f.favorite = fav; saveFriendData(myId, myData); }
        res.writeHead(200); res.end(JSON.stringify({success:true}));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/set_friend_block") {
      try {
        const req = JSON.parse(body);
        const myId = req.user;
        const friendId = req.friend || req.friend_id || req.id || "";
        const blocked = !!req.blocked;
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          result: true,
          update_friends: [{
            friend_id: friendId,
            nickname: "Friend",
            created_at: new Date().toISOString(),
            abilities: [1,2,9,10,19,4,35],
            hints: [2,9,10,19,35],
            blocked: blocked,
            last_seen_outfit: null,
            soft_deleted: false,
            they_soft_deleted: false
          }]
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({result:false}));
      }
      return true;
    }

if (path === "/account/set_friend_mute") {
      try {
        const req = JSON.parse(body);
        const myId = req.user;
        const friendId = req.friend_id || req.id || "";
        const muted = !!req.muted;
        const myData = getFriendData(myId);
        const f = myData.friends.find(f => f.id === friendId);
        if (f) { f.muted = muted; saveFriendData(myId, myData); }
        res.writeHead(200); res.end(JSON.stringify({success:true}));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/commerce/friend_info") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ friends: [], total: 0 }));
      return true;
    }

if (path === "/account/accept_external_friend" || path === "/account/confirm_external_friend" || path === "/account/invite_external_friend") {
      try {
        const req = JSON.parse(body);
        const myId = req.user || req.user_id;
        const friendId = req.friend_id || req.other_id || req.target_id || req.uuid || req.to_id;
        if (friendId && myId && friendId !== myId) {
          addFriendBoth(myId, friendId);
        }
      } catch(e) {}
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/get_external_friends" || path === "/account/external_update_friends") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ external_account_friends: [] }));
      return true;
    }

if (path === "/account/check_invite") {
      try {
        const req = JSON.parse(body);
        console.log("[CHECK_INVITE] request:", JSON.stringify(req));
        const tokenId = req.token_id || req.invite_id || req.code || req.invite_token_id || req.qr_code || "";
        const myId = req.user || req.user_id || "";
        

        var raw = SkyServerStore.singleton().getString("invite_token_" + tokenId);
        if (!raw) {
          

          var mapped = SkyServerStore.singleton().getString("code_map_" + tokenId);
          if (mapped) {
            raw = SkyServerStore.singleton().getString("invite_token_" + mapped);
          }
        }
        if (!raw) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ invite_token_id: tokenId, invite_exists: false, invite_result: "invalid" }));
          return true;
        }
        const invite = JSON.parse(raw);
        

        if (invite.inviter_user_id === myId) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ invite_token_id: tokenId, invite_exists: false, invite_result: "own_invite" }));
          return true;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ invite_token_id: tokenId, invite_exists: true, invite_result: "ok" }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ invite_token_id: "", invite_exists: false, invite_result: "error" }));
      }
      return true;
    }

if (path === "/account/debug/make_n_friends") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/remove_relationship_hint" || path === "/account/set_friend_warp_blocked") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/get_relationship_abilities") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/relationship_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        console.error("get_relationship_abilities error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ relationship_defs: [] }));
      }
      return true;
    }

if (path === "/account/join_friend_game") {
      try {
        const req = JSON.parse(body);
        const friendId = req.friend_id || req.target_id || "";
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          current_room_ip: gameHost,
          current_room_port: gamePort,
          game_id: "default",
          friend_id: friendId,
          session_id: "sess_" + Date.now()
        }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({success:true, current_room_ip:gameHost, current_room_port:gamePort, game_id:"default", session_id:"sess_"+Date.now()}));
      }
      return true;
    }

  return false;
};
