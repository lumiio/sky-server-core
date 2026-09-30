

const { PUBLIC_HOST, gamePort, gameHost } = require("../../publicHost.js");

module.exports = function handleMissingEndpoints(path, body, res) {
    const missingEndpoints = {
      "/account/accept_external_friend": {"success":true,"friend":null},
      "/account/check_invite": {"valid":false,"invite":null},
      "/account/commerce/friend_info": {"friends":[],"total":0},
      "/account/confirm_external_friend": {"success":true},
      "/account/debug/make_n_friends": {"success":true,"count":0},
      "/account/external_update_friends": {"success":true,"friends":[]},
      "/account/get_external_friends": {"external_account_friends":[]},
      "/account/get_friend_statues": {"set_friend_statues":[],"constellation_friend_pages":[]},
      "/account/invite_external_friend": {"success":true,"invite_id":"invite_"+Date.now()},
      "/account/join_friend_game": {"success":true,"current_room_ip":gameHost,"current_room_port":gamePort,"game_id":"game_friend","session_id":"sess_"+Date.now()},
      "/account/join_previous_game": {"success":true,"current_room_ip":gameHost,"current_room_port":gamePort,"game_id":"game_previous","session_id":"sess_"+Date.now()},
      "/account/join_random_game": {"success":true,"current_room_ip":gameHost,"current_room_port":gamePort,"game_id":"game_random","session_id":"sess_"+Date.now()},
      "/account/report/create_report": {"success":true,"report_id":"report_"+Date.now()},
      "/account/season_start": {"success":true,"season_id":"default_season"},
      "/account/serendipity/join": {"success":true,"current_room_ip":gameHost,"current_room_port":gamePort,"game_id":"game_serendipity","session_id":"sess_"+Date.now()},
      "/account/set_friend_warp_blocked": {"success":true},
      "/account/set_joinable": {"success":true},
      "/account/star/bind": {"success":true},
      "/account/star/get": {"stars":[],"total":0},
      "/account/star/join": {"success":true,"current_room_ip":gameHost,"current_room_port":gamePort,"game_id":"game_star","session_id":"sess_"+Date.now()},
      "/account/star/link": {"success":true,"code":"SKY"+Math.random().toString(36).substring(2,8).toUpperCase()},
      "/account/star/undo": {"success":true},
      "/account/star/verify": {"valid":true,"star":null},
      "/account/claim_survey_reward": {"success":true,"reward":null},
      "/account/get_local_notifications": {"notifications":[],"total":0},
      "/account/get_surveys": {"surveys":[]},
      "/account/support/get": {"tickets":[],"total":0,"has_reply":false},
      "/account/buy_candle_wax": {"success":true,"candles":0},
      "/account/commerce/ack_external": {"success":true},
      "/account/commerce/fulfill": {"success":true,"order":null},
      "/account/commerce/product_info": {"products":[],"total":0},
      "/account/commerce/receipt": {"receipts":[],"total":0},
      "/account/commerce/submit_order": {"success":true,"order_id":"order_"+Date.now()},
      "/account/commerce/update": {"success":true,"order":null},
      "/account/commerce/update_external": {"success":true},
      "/account/get_generic_shop_item_tracking_info": {"items":[],"total":0},
      "/account/get_generic_shops": {"generic_shop_defs":[]},
      "/account/get_shop": {"get_shop":[]},
      "/account/lootboxes/get": {"get_lootboxes":[]},
      "/account/lootboxes/redeem_box": {"success":true,"items":[]},
      "/account/lootboxes/redeem_item": {"success":true,"item":null},
      "/account/promo/get": {"promos":[],"total":0},
      "/account/promo/info": {"promo":null},
      "/account/purchase_dye": {"success":true,"dye":null},
      "/account/purchase_event_buff": {"success":true,"buff":null},
      "/account/purchase_generic_shop_item": {"success":true,"item":null},
      "/account/purchase_unlock_list": {"success":true,"unlocks":[]},
      "/account/ack_collectible": {"success":true},
      "/account/collect_collectible": {"success":true,"collectible":null},
      "/account/collect_pickup_batch": {"success":true,"collected":[]},
      "/account/drop_unlock": {"success":true},
      "/account/get_checkpoints": {"checkpoints":[]},
      "/account/get_collectibles": {"collectibles":[]},
      "/account/get_level_pickups": {"level":0,"pickups":[],"global_pickups":[],"pickup_emitters":[]},
      "/account/lock_collectibles": {"success":true},
      "/account/set_checkpoint": {"success":true},
      "/account/update_collectible": {"success":true},
      "/account/wing_buffs/collect": {"success":true,"wingbuffs":[]},
      "/account/wing_buffs/convert": {"success":true,"converted":0},
      "/account/wing_buffs/deposit": {"success":true,"deposited":0},
      "/account/wing_buffs/drop": {"success":true,"dropped":0},
      "/account/wing_buffs/get": {"result":"ok","wing_buffs":[]},
      "/account/activate_season_quest": {"success":true,"quest":null},
      "/account/claim_quest_reward": {"success":true,"reward":null},
      "/account/claim_season_quest_reward": {"success":true,"reward":null},
      "/account/get_account_world_quests": {"quests":[],"total":0},
      "/account/get_achievement_stats": {"stats":{},"achievements":[]},
      "/account/get_external_rewards": {"rewards":[],"total":0},
      "/account/redeem_reward": {"success":true,"reward":null},
      "/account/rewards/resolve": {"success":true,"rewards":[]},
      "/account/season_finalize": {"success":true},
      "/account/set_achievement_stats": {"success":true},
      "/account/debug/add_outfit_dye": {"success":true,"dye":null},
      "/account/get_remote_outfit": {"outfit":null},
      "/account/device_capabilities/lookup": {"capabilities":{},"supported":true},
      "/account/get_event_currency_defs": {"event_currency_defs":[]},
      "/account/get_forge_rates": {"forge_rates":[]},
      "/account/get_map_defs": {"get_map_defs":[]},
      "/account/get_player_info": {"player":{},"info":null},
    };

    if (missingEndpoints[path]) {
      

      
      

      if (path === "/account/star/get") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          stars: [], 
          total: 0,
          max_stars: 0,
          friends: [],
          redeemed: []
        }));
        return true;
      }
      if (path === "/account/star/bind") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          star: null,
          updated: []
        }));
        return true;
      }
      if (path === "/account/star/join") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          joined: true,
          star_id: "",
          expires_at: 0
        }));
        return true;
      }
      if (path === "/account/star/link") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          linked: true,
          link_id: "",
          friend: null
        }));
        return true;
      }
      if (path === "/account/star/undo") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          undone: true,
          restored: []
        }));
        return true;
      }
      if (path === "/account/star/verify") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          valid: true, 
          verified: true,
          verified_at: Date.now(),
          user_id: ""
        }));
        return true;
      }

      

      if (path === "/account/commerce/product_info") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          products: [], 
          total: 0,
          currency: "cny",
          regions: []
        }));
        return true;
      }
      if (path === "/account/commerce/receipt") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          verified: true,
          receipt_valid: true,
          product_id: "",
          purchase_time: 0
        }));
        return true;
      }
      if (path === "/account/commerce/submit_order") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          order_id: "order_" + Date.now(),
          status: "pending",
          total_amount: 0,
          currency: "CNY"
        }));
        return true;
      }
      if (path === "/account/commerce/update") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          updated: [],
          failed: []
        }));
        return true;
      }
      if (path === "/account/commerce/friend_info") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          friend: null, 
          info: null,
          exists: false
        }));
        return true;
      }
      if (path === "/account/commerce/ack_external") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          acknowledged: true
        }));
        return true;
      }
      if (path === "/account/commerce/fulfill") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          fulfilled: true,
          items: [],
          grant_result: []
        }));
        return true;
      }
      if (path === "/account/commerce/update_external") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          updated: 0
        }));
        return true;
      }

      

      if (path === "/account/lootboxes/get") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          lootboxes: [], 
          total: 0,
          unopened: 0,
          keys: 0
        }));
        return true;
      }
      if (path === "/account/lootboxes/redeem_box") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          items: [],
          rarity: "",
          new_unlocks: []
        }));
        return true;
      }
      if (path === "/account/lootboxes/redeem_item") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          item: null,
          inventory: []
        }));
        return true;
      }

      

      if (path === "/account/serendipity/get") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          match: null, 
          in_queue: false,
          queue_position: 0,
          estimated_wait: 0
        }));
        return true;
      }
      if (path === "/account/serendipity/join") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          queue_id: "queue_" + Date.now(),
          in_queue: true,
          joined_at: Date.now()
        }));
        return true;
      }

      

      if (path === "/account/support/get") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          messages: [], 
          total: 0, 
          has_reply: false,
          tickets: []
        }));
        return true;
      }
      if (path === "/account/report/create_report") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          report_id: "report_" + Date.now(),
          status: "submitted",
          created_at: Date.now()
        }));
        return true;
      }

      

      if (path === "/account/wing_buffs/collect") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          collected: [],
          new_buffs: []
        }));
        return true;
      }
      if (path === "/account/wing_buffs/convert") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          converted: 0,
          new_buff: null
        }));
        return true;
      }
      if (path === "/account/wing_buffs/deposit") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          deposited: 0,
          balance: 0
        }));
        return true;
      }
      if (path === "/account/wing_buffs/drop") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          dropped: [],
          buffs: []
        }));
        return true;
      }

      

      if (path === "/account/external_update_friends") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          updated: 0,
          added: [],
          removed: []
        }));
        return true;
      }
      if (path === "/account/accept_external_friend") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          accepted: true,
          friend: null
        }));
        return true;
      }
      if (path === "/account/confirm_external_friend") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          confirmed: true
        }));
        return true;
      }
      if (path === "/account/invite_external_friend") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          invite_id: "invite_" + Date.now(),
          link: "",
          expires_at: 0
        }));
        return true;
      }

      

      if (path === "/account/get_local_notifications") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          notifications: [], 
          total: 0,
          unread: 0,
          last_checked: Date.now()
        }));
        return true;
      }
      if (path === "/account/save_checkpoint") {
        try {
          const req = JSON.parse(body);
          const playerId = req.user || req.user_id || "";
          const { SkyServerStore } = require("../../runtimeData/db.js");
          if (playerId) {
            SkyServerStore.singleton().set("checkpoint_" + playerId, JSON.stringify(req));
          }
        } catch(e) {}
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          checkpoint_saved: true,
          checkpoint_id: "",
          saved_at: Date.now()
        }));
        return true;
      }
      if (path === "/account/set_checkpoint") {
        try {
          const req = JSON.parse(body);
          const playerId = req.user || req.user_id || "";
          const { SkyServerStore } = require("../../runtimeData/db.js");
          if (playerId) {
            SkyServerStore.singleton().set("checkpoint_" + playerId, JSON.stringify(req));
          }
        } catch(e) {}
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          checkpoint_set: true,
          loaded: true
        }));
        return true;
      }
      if (path === "/account/set_achievement_stats") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          updated: [],
          new_unlocks: []
        }));
        return true;
      }
      if (path === "/account/set_joinable") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          joinable: true,
          privacy: "public"
        }));
        return true;
      }
      if (path === "/account/set_friend_warp_blocked") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          blocked: [],
          unblocked: []
        }));
        return true;
      }
      if (path === "/account/buy_candle_wax") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          candles: 0,
          wax: 0,
          new_balance: { candles: 0, wax: 0 }
        }));
        return true;
      }
      if (path === "/account/check_invite") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          valid: false, 
          exists: false,
          expired: false,
          invite: null
        }));
        return true;
      }
      if (path === "/account/collect_pickup_batch") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          collected: [],
          total_collected: 0,
          rewards: []
        }));
        return true;
      }
      if (path === "/account/redeem_reward") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          reward: null,
          redeemed: true,
          new_items: []
        }));
        return true;
      }
      if (path === "/account/rewards/resolve") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          rewards: [],
          resolved: 0,
          failed: []
        }));
        return true;
      }
      if (path === "/account/purchase_unlock_list") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          purchased: [],
          new_unlocks: [],
          remaining_candles: 0
        }));
        return true;
      }
      if (path === "/account/purchase_dye") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          dyed: true,
          item: null,
          new_color: null
        }));
        return true;
      }
      if (path === "/account/purchase_event_buff") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          buff: null,
          expires_at: 0
        }));
        return true;
      }
      if (path === "/account/purchase_generic_shop_item") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          item: null,
          purchased: true,
          remaining_currency: 0
        }));
        return true;
      }
      if (path === "/account/claim_survey_reward") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          reward: null,
          claimed: true
        }));
        return true;
      }
      if (path === "/account/join_friend_game") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          joined: false,
          game_id: "",
          reason: ""
        }));
        return true;
      }
      if (path === "/account/join_previous_game") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          joined: false,
          game_id: "",
          reason: "no_previous_game"
        }));
        return true;
      }
      if (path === "/account/join_random_game") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          joined: false,
          game_id: "",
          reason: "no_match"
        }));
        return true;
      }
      if (path === "/account/get_rank") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          set_rank: {
            social: 0.0,
            is_shepherd: false,
            is_beginner: true
          }
        }));
        return true;
      }
      if (path === "/account/get_shop") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          shop: [], 
          items: [], 
          total: 0,
          currency: "candles",
          refreshed_at: Date.now()
        }));
        return true;
      }
      if (path === "/account/get_generic_shops") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          shops: [], 
          total: 0,
          categories: []
        }));
        return true;
      }
      if (path === "/account/get_generic_shop_item_tracking_info") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          tracking: null, 
          info: null,
          purchases: 0
        }));
        return true;
      }
      if (path === "/account/debug/add_outfit_dye") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true,
          dye_added: true,
          item: null
        }));
        return true;
      }
      if (path === "/account/debug/make_n_friends") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ 
          success: true, 
          friends_made: 0,
          friends: []
        }));
        return true;
      }

      

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(missingEndpoints[path]));
      return true;
    }
  return false; 

};
