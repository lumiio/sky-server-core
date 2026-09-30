// ============================================================




// ============================================================
const { SkyServerStore } = require("../../../runtimeData/db.js");
const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
const { SkySpiritShopDefs } = require("../../../staticData/spiritShop.js");
const { gameUri, PUBLIC_HOST, gamePort, gameHost } = require("../../../publicHost.js");
const { getFriendData, saveFriendData, addFriendBoth } = require("../../../utils/friendData.js");
const { getMailData, saveMailData } = require("../../../utils/mailData.js");
const { getQuestData, saveQuestData } = require("../../../utils/questData.js");
const { getReqPlayer } = require("../../../utils/reqPlayer.js");

module.exports = function handleAccountMisc(path, body, res, headers, method, query) {
  if (!path.startsWith("/account/")) return false;
if (path === "/account/get_motd") {
      

      const globalState = global.SkyServerGlobal || {};
      const motdTitle = globalState.motdTitle || "Sky";
      const motdText = globalState.motdText || "Welcome to the Sky private server!";
      
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      const now = Math.floor(Date.now() / 1000);
      res.end(JSON.stringify({
        motd: motdText,
        motd_title: motdTitle,
        motd_timestamp: now,
        motd_version: 410941,
        motd_buttons: [],
        motd_season_end: now + 86400 * 30
      }));
      return true;
    }

if (path === "/account/userdata" || path === "/account/get_userdata") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({error:"unauthorized"})); return true; }

        

        if (req.data && typeof req.data === "string" && req.data.length > 10) {
          player.userData = req.data;
          player.save();
        }

        

        

        var base64Data = player.userData;
        if (!base64Data || base64Data.length < 10) {
          var defaultUserData = {
            achievements: { daily_quests_activated: [false,false,false,false], daily_quests_reward_given: [false,false,false,false] },
            last_project: 0,
            menu: {
              emote_groups: [{ emotes: [
                {id:2253933824,level:1,type:1},{id:0,level:0,type:0},
                {id:3325034847,level:1,type:1},{id:0,level:0,type:0},
                {id:3536372366,level:1,type:1},{id:0,level:0,type:0},
                {id:0,level:0,type:0},{id:0,level:0,type:0}
              ], name: "Favorites", userEdited: false }],
              friendConstellationPreferred: false,
              nestWelcomeLevel: 0
            },
            misc: { preferredHomeLevel: 0, sharedMemoryRecordMode: 255, submitTutorialEvents: true },
            revealedQuestTimes: [0,0,0,0],
            tutorial: {
              breath: 0, buddyReq: 1, dive: 0, diveMove: 0, editmode: 0,
              ff: false, forge: 0,
              lastJoinRandomGameTime: 3498079864, lastTeleportHomeTime: 3498079864,
              memoryShrinesViewed: 0, memorySpellsViewed: 0,
              menu: 1, shop: 0, shout: 0,
              spaceShrinesViewed: 0, spaceSpellsViewed: 0, webRemote: 0
            }
          };
          base64Data = Buffer.from(JSON.stringify(defaultUserData)).toString("base64");
        }

        

        try {
          if (base64Data && base64Data.length > 10) {
            var ud = JSON.parse(Buffer.from(base64Data, "base64").toString("utf8"));
            if (!ud.misc) ud.misc = {};
            ud.misc.story_space_reroute_override = 0;
            ud.misc.submitTutorialEvents = true;
            ud.misc.tutorialComplete = true;
            ud.misc.skippedTutorial = true;
            

            if (!ud.tutorial) ud.tutorial = {};
            ud.tutorial.breath = 1;
            ud.tutorial.buddyReq = 1;
            ud.tutorial.dive = 1;
            ud.tutorial.diveMove = 1;
            ud.tutorial.ff = true;
            ud.tutorial.forge = 1;
            ud.tutorial.menu = 1;
            ud.tutorial.shop = 1;
            ud.tutorial.shout = 1;
            ud.tutorial.editmode = 1;
            ud.tutorial.webRemote = 1;
            ud.tutorial.memoryShrinesViewed = 999;
            ud.tutorial.memorySpellsViewed = 999;
            ud.tutorial.spaceShrinesViewed = 999;
            ud.tutorial.spaceSpellsViewed = 999;
            if (ud.menu) ud.menu.nestWelcomeLevel = 99;
            base64Data = Buffer.from(JSON.stringify(ud)).toString("base64");
          }
        } catch(e) {}

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          userdata: {
            time: Math.floor(Date.now() / 1000),
            version: 3,
            data: base64Data
          }
        }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({userdata:{time:Math.floor(Date.now()/1000),version:3,data:"e30="}}));
      }
      return true;
    }

if (path === "/account/get_spirit_shops") {
      try {
        const fs = require("fs");
        const path = require("path");
        var reqBody = {};
        try { reqBody = JSON.parse(body || "{}"); } catch(e) {}
        

        const offset = reqBody.o || reqBody.offset || reqBody.start || 0;
        const SERVER_VERSION = 412887;
        

        const page = Math.floor(offset / 1000) * 1000;
        const dataPath = path.join(__dirname, `../../../../data/defs/spirit_shops/${page}.json`);
        if (!fs.existsSync(dataPath)) {
          res.writeHead(200); res.end(JSON.stringify({ spirit_shops: [], spirit_shops_version: SERVER_VERSION, spirit_shops_total_count: 2494 }));
          return true;
        }
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        var result = data;
        

        // try {
        //   var sraw = SkyServerStore.singleton().getString("admin_spirit");
        //   if (sraw) {
        //     var scfg = JSON.parse(sraw);
        //     if (scfg.spirit) {
        //       var matched = [];
        //       for (const pg of ["0", "1000", "2000"]) {
        //         const pp = path.join(__dirname, `../../../../data/defs/spirit_shops/${pg}.json`);
        //         if (!fs.existsSync(pp)) continue;
        //         const pd = JSON.parse(fs.readFileSync(pp, "utf8"));
        //         const items = pd.spirit_shops || [];
        //         for (const it of items) if (it.spirit === scfg.spirit) matched.push(it);
        //       }
        //       if (matched.length > 0) {
        //         result = { spirit_shops: matched, spirit_shops_version: SERVER_VERSION, spirit_shops_total_count: matched.length };
        //       }
        //     }
        //   }
        // } catch(filterErr) { console.error("[get_spirit_shops] filter error:", filterErr.message); }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result));
      } catch (e) {
        console.error("get_spirit_shops error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ spirit_shops: [], spirit_shops_version: 0, spirit_shops_total_count: 0 }));
      }
      return true;
    }

if (path === "/account/get_event_schedule") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/event_schedule_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        const parsed = JSON.parse(raw);
        

        var now = Math.floor(Date.now() / 1000);
        try {
          var tRaw = SkyServerStore.singleton().getString("admin_time");
          if (tRaw) { var tObj = JSON.parse(tRaw); if (tObj.fixed) now = Number(tObj.fixed); }
        } catch(e) {}
        

        var adminSeason = "";
        try {
          var sraw = SkyServerStore.singleton().getString("admin_season");
          if (sraw) { var scfg = JSON.parse(sraw); adminSeason = (scfg.season_id || "").toLowerCase(); }
        } catch(e) {}
        

        var forcedEvents = [];
        try {
          var eraw = SkyServerStore.singleton().getString("admin_events");
          if (eraw) forcedEvents = JSON.parse(eraw);
        } catch(e) {}
        

        var EVENT_MAP = {
          'event_feast': ['global_feast_wonderland', 'feast_toyvendorforever', 'feast_teatable_rotation'],
          'event_mischief': ['global_skyfest'],
          'event_fortune': ['global_newyear_firework_interval', 'global_rosegarden_forever'],
          'event_bloom': ['global_flowflowerjourney_evergreen', 'global_flowflowerpack_launch'],
          'event_anniversary': ['global_sky_anniversary', 'global_ann_perf1', 'global_ann_perf12'],
          'event_qixi': ['global_qixi_couple'],
          'event_summer': ['global_summer', 'global_ball_beach'],
          'event_skyfest': ['global_skyfest', 'skyfest_fireworks_show', 'skyfest_parade'],
          'event_wildlife': ['global_nature_geyser', 'wildlifepark_cycle_day'],
          'event_fireworks': ['fireworks_show_act1', 'fireworks_show_medpad'],
          'event_double_candles': ['wing_buff_conversion_period'],
          'event_night': ['stormy_night', 'event_night_tcandles1'],
          'event_dusk': ['stormy_dusk', 'event_dusk_tcandles3'],
          'event_prairie': ['stormy_prairie', 'event_prairie_tcandles2'],
          

          'event_aurora': ['global_aurora', 'aurora_concert', 'aurora_orbit'],
          'event_office': ['global_office_shop', 'tgcoffice_behavior_employees'],
          'event_weekend_shop': ['global_weekend_shop', 'global_weekend_shop2'],
          'event_dye_shop': ['enable_dye_shop', 'weekly_dye_rotation_02'],
          'event_magic_shop': ['sunset_village_spell_shop'],
          'event_merch': ['global_merchandise_live'],
          'event_music_shop': ['global_musicshop_sale', 'musicshop_weekly_rotation_02'],
          'event_cafe': ['global_cafe_open', 'quest_cafe_serving'],
          'event_hub_clocktower': ['hub_clocktower'],
          'event_colosseum_fw': ['sunset_colosseum_firework_interval'],
          'event_yeti': ['quest_sunset_yeti_race'],
          'event_fishing': ['sunset_village_fishing'],
          'event_armoire': ['collectible_armoire1', 'collectible_armoire2'],
          'event_turtle': ['social_turtle_on'],
          'event_wax': ['social_wax_on'],
        };
        

        var nowTs = Math.floor(Date.now() / 1000);
        var expandedEvents = [];
        for (var fe of forcedEvents) {
          var fid = (fe.name || fe).toString();
          if (EVENT_MAP[fid]) {
            for (var en of EVENT_MAP[fid]) {
              expandedEvents.push({ name: en, duration: '999999999', when: [nowTs] });
            }
          } else {
            if (fe.when && fe.when[0] === 0) fe.when = [nowTs];
            expandedEvents.push(fe);
          }
        }
        forcedEvents = expandedEvents;
        const events = (parsed.events || []).map(ev => {
          const e2 = Object.assign({}, ev);
          if (typeof e2.duration === "number") e2.duration = String(e2.duration);
          if (adminSeason && adminSeason !== "none") {
            var ename = (e2.name || "").toLowerCase();
            var seasonNum = adminSeason.replace(/[^0-9]/g, "");
            if (seasonNum && (ename.includes("ap" + seasonNum) || ename.includes("season_" + seasonNum))) {
              e2.when = [nowTs];
              e2.duration = "999999999";
            }
          }
          return e2;
        });
        

        try {
          var spRaw = SkyServerStore.singleton().getString("admin_spirit");
          if (spRaw) {
            var sp = JSON.parse(spRaw);
            if (sp.spirit) {
              var spName = sp.spirit.toLowerCase();
              for (const ev of events) {
                var en = (ev.name || "").toLowerCase();
                if (en.includes(spName) && en.includes("spiritshopitem")) {
                  forcedEvents.push({ name: ev.name, duration: "999999999", when: [nowTs] });
                }
              }
              

              forcedEvents.push({ name: "collectible_" + spName, duration: "999999999", when: [nowTs] });
            }
          }
        } catch(e) {}
        

        for (const fe of forcedEvents) {
          events.push({
            name: fe.name,
            duration: String(fe.duration || 999999999),
            when: fe.when || [0]
          });
        }
        const wrapped = {
          event_schedule: {
            server_time: now,
            valid_until: now + 1800,
            base_time: 1587366000,
            events: events
          }
        };
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(wrapped));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ event_schedule: { server_time: Math.floor(Date.now()/1000), valid_until: Math.floor(Date.now()/1000)+1800, base_time: 1587366000, events: [] } }));
      }
      return true;
    }

if (path === "/account/support/has_reply") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ has_reply: false, result: "ok" }));
      return true;
    }

if (path === "/account/support/get") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ messages: [], total: 0 }));
      return true;
    }

if (path === "/account/report/create_report") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ result: "OK" }));
      return true;
    }

if (path === "/account/commerce/submit_order" || path === "/account/commerce/fulfill") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, order_id: "order_" + Date.now(), transaction_id: "tx_" + Date.now() }));
      return true;
    }

if (path === "/account/commerce/product_info") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      try {
        const fs3 = require("fs");
        const path3 = require("path");
        const iapPath = path3.join(__dirname, "../../../../data/defs/iap_list.json");
        if (fs3.existsSync(iapPath)) {
          const iapData = JSON.parse(fs3.readFileSync(iapPath, "utf8"));
          res.end(JSON.stringify({
            iap_list: iapData.iap_list || [],
            purchased_non_consumables: [],
            unfulfilled_purchases: [],
            commerce_gift_count: 0,
            store_state: "available",
            store_open: true,
            maintenance: false,
            maintenance_msg: ""
          }));
          return true;
        }
      } catch(e) {}
      res.end(JSON.stringify({ iap_list: [], purchased_non_consumables: [], unfulfilled_purchases: [], commerce_gift_count: 0, store_state: "available", store_open: true, maintenance: false }));
      return true;
    }

if (path === "/account/commerce/receipt") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, verified: true }));
      return true;
    }

if (path === "/account/commerce/update" || path === "/account/commerce/update_external" || path === "/account/commerce/ack_external") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/season_start" || path === "/account/season_finalize") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/buff/get_buff_defs" || path === "/account/get_buff_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/buff_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        console.error("get_buff_defs error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ get_buff_defs: {} }));
      }
      return true;
    }

if (path === "/account/get_buffs" || path === "/account/buff/get_buffs" || path === "/account/buff/get_buffs1") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ get_buffs: [], get_buffs_sign: "2f903c3a5ffa6eba6b4c1ab103a130a642f95ac69530fa36cad91023d6970200" }));
      return true;
    }

if (path === "/account/buff/remove_buff1") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ remove_buff: "success", get_buffs: [] }));
      return true;
    }

if (path === "/account/buff/remove_buff") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/consumable/get_consumable_defs" || path === "/account/get_consumable_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/consumable_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        console.error("get_consumable_defs error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ get_consumable_defs: [] }));
      }
      return true;
    }

if (path === "/account/get_consumables" || path === "/account/consumable/get_consumables" || path === "/account/consumable/get_consumables1") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || req.player_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var list = [];
        if (player && player.consumables && player.consumables.items) {
          for (var [id, entry] of player.consumables.items) {
            if (entry.count > 0) list.push({ consumable_id: entry.id, quantity: entry.count, cooldown_until: entry.cooldownUntil || 0 });
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ get_consumables: list, get_consumables_sign: "" }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ get_consumables: [], get_consumables_sign: "" }));
      }
      return true;
    }

if (path === "/account/consumable/consume_item" || path === "/account/consumable/consume_item1") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || req.player_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var consumedId = req.consumable_id || req.id || req.item || 0;
        var consumeCount = req.consumable_count || req.count || 1;
        

        if (player && player.consumables && player.consumables.items) {
          player.clearConsumable(consumedId, consumeCount);
          player.save();
        }
        

        var list = [];
        if (player && player.consumables && player.consumables.items) {
          for (var [id, entry] of player.consumables.items) {
            if (entry.count > 0) list.push({ consumable_id: entry.id, quantity: entry.count, cooldown_until: entry.cooldownUntil || 0 });
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ consume_item: "success", get_consumables: list, get_consumables_sign: "" }));
      } catch(e) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ consume_item: "error", get_consumables: [], get_consumables_sign: "" }));
      }
      return true;
    }

if (path === "/account/wing_buffs/convert") {
      

      try {
        const req = JSON.parse(body);
        const barn = ServerPlayerBarn.singleton();
        var p = barn.getPlayer(req.user, req.session) || barn.loadOfflinePlayer(req.user);
        if (!p) { res.writeHead(200); res.end(JSON.stringify({ success: true, converted: 0 })); return true; }
        var key = "wings_" + p.id;
        var raw = SkyServerStore.singleton().getString(key);
        var wings = raw ? JSON.parse(raw) : [];
        var deposited = wings.filter(w => w.deposited).length;
        if (deposited > 0) {
          

          p.currency.prestige = (p.currency.prestige || 0) + deposited;
          

          p.outfit.wingCount = (p.outfit.wingCount || 0) + deposited;
          

          wings = wings.filter(w => !w.deposited);
          SkyServerStore.singleton().set(key, JSON.stringify(wings));
          p.save();
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, converted: deposited, prestige: p.currency.prestige, wing_count: p.outfit.wingCount }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ success: true, converted: 0 }));
      }
      return true;
    }

if (path === "/account/wing_buffs/deposit" || path === "/account/wing_buffs/drop") {
      

      try {
        const req = JSON.parse(body);
        const barn = ServerPlayerBarn.singleton();
        var p = barn.getPlayer(req.user, req.session) || barn.loadOfflinePlayer(req.user);
        if (!p) { res.writeHead(200); res.end(JSON.stringify({ success: true })); return true; }
        var key = "wings_" + p.id;
        var raw = SkyServerStore.singleton().getString(key);
        var wings = raw ? JSON.parse(raw) : [];
        

        if (req.deposited && Array.isArray(req.deposited)) {
          for (var w of wings) {
            if (req.deposited.includes(w.name)) w.deposited = true;
          }
        }
        

        var droppedNames = req.names || (req.name ? [req.name] : []);
        if (droppedNames.length) {
          var droppedSet = new Set(droppedNames);
          wings = wings.filter(w => {
            if (droppedSet.has(w.name)) {
              p.outfit.wingCount = Math.max(0, (p.outfit.wingCount || 0) - 1);
              return false;
            }
            return true;
          });
          p.save();
        }
        SkyServerStore.singleton().set(key, JSON.stringify(wings));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, wing_buffs: wings, wing_count: p.outfit.wingCount }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ success: true }));
      }
      return true;
    }

if (path === "/account/get_surveys" || path === "/account/get_questionnaires") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ surveys: [] }));
      return true;
    }

if (path === "/account/claim_survey_reward") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/code/redeem" || path === "/account/code/verify") {
      try {
        const req = JSON.parse(body);
        const code = req.code || req.token_id || req.invite_id || "";
        

        var tokenId = SkyServerStore.singleton().getString("code_map_" + code);
        if (!tokenId) {
          

          var raw = SkyServerStore.singleton().getString("invite_token_" + code);
          if (raw) tokenId = code;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: "ok", type: "i", code: tokenId || code }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "ok", type: "i", code: "" }));
      }
      return true;
    }

if (path === "/account/redeem_reward" || path === "/account/rewards/resolve") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/get_latest_build_version") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        latest_build_version: 410941,
        min_gpu_rating: 540,
        maintenance_mode: global.SkyServerGlobal?.maintenanceMode || false,
        maintenance_msg: global.SkyServerGlobal?.maintenanceMsg || "",
        app_store_uri: "itms-apps://itunes.apple.com/app/id1462117269",
        tos: {
          version: 4,
          tos_url: "https://legal.thatskygame.com/?p=hc/en/17-sky-children-of-the-light/faq/460-eula-terms-of-service/",
          pp_url: "https://legal.thatskygame.com/?p=hc/en/17-sky-children-of-the-light/faq/461-privacy-policy/"
        },
        cs_enabled: false,
        cs_db_enabled: false,
        country_code: "CN"
      }));
      return true;
    }

if (path === "/account/get_vars" || path === "/account/translate") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/vars.json");
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        data.vars = data.vars || {};
        

        data.vars["TUTORIAL_COMPLETE"] = true;
        data.vars["NEW_USER_EXPERIENCE_DISABLED"] = true;
        data.vars["SKIP_INTRO"] = true;
        data.vars["enable_autoskip_cutscenes"] = 1;
        data.vars["daily_candle_cap"] = 9999;
        data.vars["daily_candle_limit"] = 9999;
        data.vars["candle_daily_cap"] = 9999;
        data.vars["max_daily_candles"] = 9999;
        

        data.vars["level_dawn"] = 1;
        data.vars["level_day"] = 1;
        data.vars["level_rain"] = 1;
        data.vars["level_dusk"] = 1;
        data.vars["level_sunset"] = 1;
        data.vars["level_night"] = 1;
        data.vars["level_storm"] = 1;
        data.vars["mainstreet_spirit_dailies"] = 1;
        data.vars["onboarding_mainstreet_00"] = 1;
        data.vars["past_collectibles_enabled"] = 1;
        data.vars["beta_mode"] = 1;
        data.vars["c_max_friend_pages"] = 10;
        data.vars["story_space_reroute_override"] = 0;
        data.vars["nest_welcome_level"] = 0;
        data.vars["skip_nest_intro"] = 1;
        data.vars["disable_nest_cutscene"] = 1;
        data.vars["onboarding_nest_00"] = 1;
        data.vars["ap06_intro_complete"] = 1;
        data.vars["ap20_intro_complete"] = 1;
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(data));
      } catch (e) {
        console.error("get_vars error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ vars: {} }));
      }
      return true;
    }

if (path === "/account/get_video_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/video_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        console.error("get_video_defs error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ video_defs: [], video_schedule: [] }));
      }
      return true;
    }

if (path === "/account/get_radiance_spawn_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/radiance_spawn_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ radiance_spawn_defs: [] }));
      }
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

if (path === "/account/set_outfit") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        

        var player = ServerPlayerBarn.singleton().players[playerId] ||
                     ServerPlayerBarn.singleton().getPlayer(playerId) ||
                     ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var so = req.set_outfit || req.outfit || null;
        if (player && so) {
          var slots = ["wing","prop","neck","mask","legs","horn","hat","hair","feet","face","body","arms"];
          for (var s of slots) {
            if (so[s] && typeof so[s] === 'object' && 'id' in so[s]) {
              if (!player.outfit[s]) player.outfit[s] = { id: 0, mask: 0, pat: 0, tex: 0 };
              player.outfit[s].id = so[s].id;
              if (typeof so[s].tex === 'number') player.outfit[s].tex = so[s].tex;
              if (typeof so[s].pat === 'number') player.outfit[s].pat = so[s].pat;
              if (typeof so[s].mask === 'number') player.outfit[s].mask = so[s].mask;
            }
          }
          

          if (typeof so.voice === 'number') player.outfit.voice = so.voice;
          if (typeof so.attitude !== 'undefined') player.outfit.attitude = String(so.attitude);
          player.save();
        }
        var merged = { voice: 0, seed: 0, refreshVersion: 0, attitude: "0" };
        if (player) {
          var slotDefaults2 = {
            wing: 2245279351, body: 3691343236, face: 3599986885, feet: 1532093990,
            hair: 1229053584, hat: 1470462579, horn: 3680499229, mask: 3663390882,
            neck: 3800884691, prop: 2035109393, legs: 0, arms: 0
          };
          for (var s of slots) {
            var sid = slotDefaults2[s];
            if (player.outfit && player.outfit[s] && typeof player.outfit[s].id === 'number' && player.outfit[s].id !== 0) {
              sid = player.outfit[s].id;
            }
            merged[s] = { id: sid };
          }
          merged.scale = (player.outfit && typeof player.outfit.scale === 'number') ? player.outfit.scale : 0.0697;
          merged.height = (player.outfit && typeof player.outfit.height === 'number') ? player.outfit.height : 0.0;
          merged.wingCount = (player.outfit && player.outfit.wingCount) || 0;
          merged.wing_count = merged.wingCount;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: "ok", set_outfit: merged }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "ok", set_outfit: {} }));
      }
      return true;
    }

if (path === "/account/set_joinable") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ joinable: true }));
      return true;
    }

if (path === "/account/set_checkpoint") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || "";
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        if (playerId) {
          

          

          const cps = {
            checkpoints: [
              { user: playerId, level_id: 1649439303, level_hash: 19812, bst_id: 0, states: req.states || [], updated_at: new Date().toISOString(), updated_ts: Math.floor(Date.now()/1000), is_furthest: true, arc_order: 1 },
              { user: playerId, level_id: 817373972, level_hash: 0, bst_id: 0, states: [false], updated_at: new Date().toISOString(), updated_ts: Math.floor(Date.now()/1000), is_furthest: false, arc_order: 2 },
              { user: playerId, level_id: 2477345666, level_hash: 0, bst_id: 0, states: [false,false,false,false,false,false], updated_at: new Date().toISOString(), updated_ts: Math.floor(Date.now()/1000), is_furthest: false, arc_order: 3 },
              { user: playerId, level_id: 3110721718, level_hash: 0, bst_id: 0, states: [false,false,false], updated_at: new Date().toISOString(), updated_ts: Math.floor(Date.now()/1000), is_furthest: false, arc_order: 4 },
              { user: playerId, level_id: 3057325709, level_hash: 0, bst_id: 0, states: [], updated_at: new Date().toISOString(), updated_ts: Math.floor(Date.now()/1000), is_furthest: false, arc_order: 5 },
              { user: playerId, level_id: 312004957, level_hash: 0, bst_id: 0, states: [], updated_at: new Date().toISOString(), updated_ts: Math.floor(Date.now()/1000), is_furthest: false, arc_order: 6 }
            ]
          };
          SkyServerStore.singleton().set("checkpoint_" + playerId, JSON.stringify(cps));
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: "ok" }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "ok" }));
      }
      return true;
    }

if (path === "/account/purchase_event_buff") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/collect_pickup_batch") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var waxCollected = 0;
        var batchResults = [];
        

        var pickupIds = req.pickup_ids || [];
        for (var pid of pickupIds) {
          waxCollected += 1;
          batchResults.push({ w: 1, r: "ok", id: pid, ct: "wax", cid: "", cc: 1 });
        }
        

        if (Array.isArray(req.pickups)) {
          for (var pk of req.pickups) {
            var pid2 = typeof pk === 'object' ? (pk.id || pk.pickup_id) : pk;
            waxCollected += 1;
            batchResults.push({ w: 1, r: "ok", id: pid2, ct: "wax", cid: "", cc: 1 });
          }
        }
        if (player && waxCollected > 0) {
          player.currency.wax = (player.currency.wax || 0) + waxCollected;
          

          var allIds = pickupIds.concat(Array.isArray(req.pickups) ? req.pickups.map(p => typeof p === 'object' ? (p.id||p.pickup_id) : p) : []);
          var key = "collected_pickups_" + playerId;
          var collected = [];
          try { collected = JSON.parse(SkyServerStore.singleton().getString(key) || "[]"); } catch(e) {}
          var collectedSet = new Set(collected);
          for (var nid of allIds) {
            if (!collectedSet.has(String(nid))) collected.push(String(nid));
          }
          SkyServerStore.singleton().set(key, JSON.stringify(collected));
          player.save();
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          batch_results: batchResults,
          currency: {
            candles: player ? (player.currency.candles || 0) : 0,
            color_red_wax: 0, color_white_wax: 0, color_yellow_wax: 0,
            heart: player ? (player.currency.heart || 0) : 0,
            prestige: player ? (player.currency.prestige || 0) : 0,
            prestige_vip: player ? (player.currency.prestige || 0) : 0,
            prestige_wax: 0, season_candle: 0, season_wax: 0,
            wax: player ? (player.currency.wax || 0) : 0
          },
          update_forge_rates: [],
          level_id: req.level_id || 0
        }));
      } catch (e) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ batch_results: [], currency: { candles: 0, wax: 0 }, update_forge_rates: [] }));
      }
      return true;
    }

if (path === "/account/get_level_pickups") {
      let reqLevel = 0;
      let reqUser = "";
      try { var _b = JSON.parse(body); reqLevel = _b.level || 0; reqUser = _b.user || _b.user_id || ""; } catch(e) {}
      var commonEmitters = [
        { emitter_name: "SocialFeedChallenge", events: [{ preactive_duration: 0, pool_name: "anylevel_social_feed_challenge", pool_amount: 2000, last_chunk_seq: -1, event_name: "global_daily_reset_time", emit_interval: 1, currency_type: "wax", collected: 0, chunks_per_emit: 1, chunk_size_likelihood: [1.0,0.0,0.0], chunk_size_amount: [5,0,0], active_duration: 1440 }] },
        { emitter_name: "TreasureShovel", events: [{ preactive_duration: 0, pool_name: "anylevel_social_feed_challenge", pool_amount: 2000, last_chunk_seq: -1, event_name: "global_daily_reset_time", emit_interval: 1, currency_type: "wax", collected: 0, chunks_per_emit: 1, chunk_size_likelihood: [1.0,0.0,0.0], chunk_size_amount: [5,0,0], active_duration: 1440 }] }
      ];
      

      var collectedPickups = [];
      if (reqUser) {
        try { collectedPickups = JSON.parse(SkyServerStore.singleton().getString("collected_pickups_" + reqUser) || "[]"); } catch(e) {}
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ level: reqLevel, pickups: collectedPickups, global_pickups: [], pickup_emitters: commonEmitters }));
      return true;
    }

if (path === "/account/get_local_notifications") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ notifications: [], total: 0 }));
      return true;
    }

if (path === "/account/get_external_rewards") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ rewards: [], total: 0 }));
      return true;
    }

if (path === "/account/get_generic_shop_item_tracking_info") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ tracking: {} }));
      return true;
    }

if (path === "/account/set_achievement_stats") {
      let stats = [];
      try { stats = (JSON.parse(body).achievement_stats) || []; } catch(e) {}
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ achievement_stats: stats }));
      return true;
    }

if (path === "/account/quest/get_quest_defs" || path === "/account/get_quest_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/quest_defs.json");
        const rawText = fs.readFileSync(dataPath, "utf8");
        

        

        

        

        const count = (rawText.match(/"id":/g) || []).length;
        const finalText = rawText.replace(/\}\s*$/, `,"quest_defs_version":1,"quest_defs_total_count":${count}}`);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(finalText);
      } catch (e) {
        console.error("quest_defs error:", e.message);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ get_quest_defs: [], quest_defs_version: 0, quest_defs_total_count: 0 }));
      }
      return true;
    }

if (path === "/account/link_external" || path === "/account/link_info_external" || path === "/account/unlink_external") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/remote_config/upload") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/ack_forge_rate_reset") {
      try {
        const req = JSON.parse(body);
        const barn = ServerPlayerBarn.singleton();
        const player = barn.getPlayer(req.user, req.session) || barn.loadOfflinePlayer(req.user);
        

        if (player && player.currency) {
          player.currency.wax = Math.max(0, (player.currency.wax || 0) - 1);
          player.save();
        }
        

        const tier = Math.floor(Math.random() * 10) + 1;
        const level = Math.floor(Math.random() * 5) + 1;
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          result: "ok",
          update_forge_rates: [{
            source_type: "wax",
            current_tier: tier,
            current_level: level,
            tier_completion: 0.0,
            level_completion: 0.0,
            level_tier_index: 0,
            level_tier_count: 5,
            reset_acknowledged: true,
            enabled: true
          }],
          currency: player ? { candles: player.currency.candles || 0, vip: 1, wax: player.currency.wax || 0 } : { candles: 0, vip: 1, wax: 0 }
        }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "ok", update_forge_rates: [] }));
      }
      return true;
    }

if (path === "/account/auth/delete") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/trust/get_trust_activity_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/trust_activity_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ get_trust_activity_defs: [] }));
      }
      return true;
    }

if (path === "/account/trust/get_trust_group_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/trust_group_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ get_trust_group_defs: [] }));
      }
      return true;
    }

if (path === "/account/trust/get_trust_tier_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/trust_tier_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ get_trust_tier_defs: [] }));
      }
      return true;
    }

if (path === "/account/get_pending_messages") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ set_sent_messages: [], set_recvd_messages: [] }));
      return true;
    }

if (path === "/account/claim_message_gift" || path === "/account/claim_message_gifts") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(404); res.end(JSON.stringify({success:false, error:"player not found"})); return true; }
        const mailList = getMailData(req.user);
        let claimed = 0;

        for (const m of mailList) {
          if (!m.claimed && m.rewards) {
            

            if (m.rewards.candles) { player.currency.candles += m.rewards.candles; claimed++; }
            if (m.rewards.hearts) { player.currency.heart += m.rewards.hearts; claimed++; }
            if (m.rewards.season) { player.currency.seasonCandle += m.rewards.season; claimed++; }
            if (m.rewards.ascended) { player.currency.prestige += m.rewards.ascended; claimed++; }
            

            if (m.rewards.items && Array.isArray(m.rewards.items)) {
              m.rewards.items.forEach(it => {
                player.giveItem(it.id, it.count || 1);
              });
              claimed++;
            }
            

            if (m.rewards.unlocks && Array.isArray(m.rewards.unlocks)) {
              m.rewards.unlocks.forEach(id => {
                player.addSpiritUnlock(id, false);
              });
              claimed++;
            }
            m.claimed = true;
          }
          m.read = true;
        }

        player.save();
        player.save();
        saveMailData(req.user, mailList);

        res.writeHead(200); res.end(JSON.stringify({
          success: true,
          claimed: claimed,
          candles: player.currency.candles,
          hearts: player.currency.heart
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false, error: e.message}));
      }
      return true;
    }

if (path === "/account/read_message") {
      try {
        const req = JSON.parse(body);
        const mailList = getMailData(req.user || req.player_id || "");
        var found = false;
        mailList.forEach(m => {
          if (m.id === req.message_id || m.id === req.id) {
            m.read = true;
            found = true;
          }
        });
        if (found) saveMailData(req.user, mailList);
        res.writeHead(200); res.end(JSON.stringify({ success: found }));
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({ success: false })); }
      return true;
    }

if (path === "/account/delete_message") {
      try {
        const req = JSON.parse(body);
        var mailList = getMailData(req.user || req.player_id || "");
        mailList = mailList.filter(m => m.id !== req.message_id && m.id !== req.id);
        saveMailData(req.user, mailList);
        res.writeHead(200); res.end(JSON.stringify({ success: true }));
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({ success: false })); }
      return true;
    }

if (path === "/account/get_app_badge_number") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ set_app_badge_number: 0 }));
      return true;
    }

if (path === "/account/add_currency") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false, error:"Not logged in"})); return true; }

        const type = req.currency_type || req.type || "candles";
        const amount = req.amount || req.count || 1;

        if (player.currency[type] !== undefined) {
          player.currency[type] += amount;
          player.save();
          player.save();
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, currency: player.currency.toJSON() }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false, error:e.message}));
      }
      return true;
    }

if (path === "/account/give_candle") {
      try {
        const req = JSON.parse(body);
        const myId = req.user || req.user_id || req.player_id || "";
        

        var recvRaw = req.recv_user || req.recvUser || "";
        var friendId = "";
        if (recvRaw) {
          friendId = recvRaw.split(":")[0];
        }
        if (!friendId) {
          friendId = req.friend || req.friend_id || req.target || req.recipient ||
                     req.to || req.other || req.partner || req.buddy || req.uuid || "";
        }
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");

        

        if (!friendId) {
          const barn = ServerPlayerBarn.singleton();
          const me = barn.players[myId];
          if (me && me.levelId) {
            for (const pid of Object.keys(barn.players)) {
              if (pid !== myId && barn.players[pid].levelId === me.levelId) {
                friendId = pid;
                break;
              }
            }
          }
        }

        

        if (friendId && friendId !== myId) {
          try { addFriendBoth(myId, friendId); } catch(e) {}
          try {
            const myData = getFriendData(myId);
            if (!myData.friends.find(f => f.id === friendId)) {
              myData.friends.push({ id: friendId, name: friendId.substring(0,8), note: "", added_time: Date.now(), favorite: false, blocked: false, muted: false, given: 1, recvd: 0 });
              saveFriendData(myId, myData);
            }
            const fData = getFriendData(friendId);
            if (!fData.friends.find(f => f.id === myId)) {
              fData.friends.push({ id: myId, name: myId.substring(0,8), note: "", added_time: Date.now(), favorite: false, blocked: false, muted: false, given: 0, recvd: 1 });
              saveFriendData(friendId, fData);
            }
          } catch(e) {}
        }

        var myPlayer = ServerPlayerBarn.singleton().players[myId] || ServerPlayerBarn.singleton().loadOfflinePlayer(myId);
        var cur = { candles: 0, color_red_wax: 0, color_white_wax: 0, color_yellow_wax: 0, heart: 0, prestige: 0, prestige_vip: 0, prestige_wax: 0, season_candle: 0, season_wax: 0, wax: 0 };
        if (myPlayer && myPlayer.currency) {
          cur.candles = myPlayer.currency.candles || 0;
          cur.heart = myPlayer.currency.heart || 0;
          cur.prestige = myPlayer.currency.prestige || 0;
          cur.prestige_vip = myPlayer.currency.prestige || 0;
          cur.wax = myPlayer.currency.wax || 0;
          cur.season_candle = myPlayer.currency.seasonCandle || 0;
          cur.season_wax = myPlayer.currency.seasonWax || 0;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          res: "ok",
          result: true,
          currency: cur,
          update_friends: friendId ? [{
            unlinked_star_sku: "",
            given: 1,
            recvd: 0,
            level: 1,
            abilities: [1, 2, 9, 10, 19],
            when_created: new Date().toISOString(),
            friend_id: friendId,
            hints: [1, 2, 9, 10, 19],
            last_seen_outfit: null,
            soft_deleted: null,
            they_soft_deleted: null
          }] : [],
          set_sent_messages: friendId ? [{
            msg_id: Date.now(),
            type: "gift",
            to_id: friendId,
            currency_type: "candles",
            currency_count: 1,
            recvd: false,
            gift_id: Date.now()
          }] : [],
          set_recvd_messages: [],
          set_friend_count: 1,
          update_online_friends: friendId ? [{ friend_id: friendId, level_id: 0 }] : [],
          trust_update: "ok"
        }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ res: "error", result: false }));
      }
      return true;
    }

if (path === "/account/buy_candle_wax") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({result:"error"})); return true; }

        

        const cost = req.cost || 150;
        const count = req.count || 1;
        if (player.currency.wax >= cost) {
          player.currency.wax -= cost;
          player.currency.candles += count;
          player.save();
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({
            result: "ok",
            currency: { candles: player.currency.candles || 0, vip: 1, wax: player.currency.wax || 0 },
            update_forge_rates: [{
              source_type: "wax",
              current_tier: 26,
              current_level: 4,
              tier_completion: 0.0,
              level_completion: 0.0,
              level_tier_index: 0,
              level_tier_count: 5,
              reset_acknowledged: true,
              enabled: true
            }]
          }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ result: "error", currency: { candles: player.currency.candles || 0, vip: 1, wax: player.currency.wax || 0 } }));
        }
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({result:"error"}));
      }
      return true;
    }

if (path === "/account/get_shop") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/shop.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ get_shop: [[]] }));
      }
      return true;
    }

if (path === "/account/get_generic_shops") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/generic_shops.json");
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        const all = data.generic_shop_defs || [];

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          generic_shop_defs: all,
          generic_shop_defs_version: 412887,
          generic_shop_defs_total_count: all.length
        }));
      } catch (e) {
        console.error("get_generic_shops error:", e.message);
        res.writeHead(200); res.end(JSON.stringify({ generic_shop_defs: [], generic_shop_defs_version: 0, generic_shop_defs_total_count: 0 }));
      }
      return true;
    }

if (path === "/account/lootboxes/get") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ get_lootboxes: [] }));
      return true;
    }

if (path === "/account/lootboxes/redeem_box") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        

        const defs = SkySpiritShopDefs.singleton();
        const items = Array.from(defs.spiritShops.keys());
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const entry = player.addSpiritUnlock(randomItem, false);
        player.save();

        res.writeHead(200); res.end(JSON.stringify({
          success: true,
          items: entry ? [{ id: randomItem }] : []
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/lootboxes/redeem_item") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        const itemId = req.item_id || req.id || "";
        const entry = player.addSpiritUnlock(itemId, false);
        player.save();

        res.writeHead(200); res.end(JSON.stringify({
          success: true,
          item: entry ? { id: itemId } : null
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/promo/get" || path === "/account/promo/info") {
      res.writeHead(200); res.end(JSON.stringify({
        promos: [
          { id: "welcome_pack", name: "Welcome Pack", cost: 0, discount: 100, end_time: Date.now() + 86400000 * 7 }
        ],
        total: 1
      }));
      return true;
    }

if (path === "/account/purchase_dye") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        const color = req.color || "red";
        

        if (player.currency.wax >= 5) {
          player.currency.wax -= 5;
          if (player.currency.dye[color] !== undefined) {
            player.currency.dye[color] += 1;
          }
          player.save();
          player.save();
          res.writeHead(200); res.end(JSON.stringify({ success: true, dye: { [color]: 1 } }));
        } else {
          res.writeHead(200); res.end(JSON.stringify({ success: false, error: "Not enough candles" }));
        }
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/ack_collectible" || path === "/account/collect_collectible") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        const collectibleId = req.collectible_id || req.id || req.name || "";
        const entry = player.addSpiritUnlock(collectibleId, false);
        player.save();

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          result: true,
          collectible: entry ? { id: collectibleId, ack: true } : null,
          update_collectibles: entry ? [{ id: collectibleId, ack: true }] : []
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/update_collectible") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        const collectibleId = req.collectible_id || req.id || req.name || "";
        const cmd = req.cmd || req.command || "yes_carrying";

        const store = SkyServerStore.singleton();
        let equipped = {};
        try {
          const eqRaw = store.getString("equipped_" + player.id);
          if (eqRaw) equipped = JSON.parse(eqRaw);
        } catch(e) {}

        if (cmd === "yes_carrying" || cmd === "carry") {
          equipped[collectibleId] = true;
        } else if (cmd === "not_carrying") {
          equipped[collectibleId] = false;
        }
        store.set("equipped_" + player.id, JSON.stringify(equipped));

        
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          result: true,
          collectible: {
            id: collectibleId,
            used: equipped[collectibleId] || false,
            candle_space: false,
            carrying: equipped[collectibleId] || false
          }
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/drop_unlock") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        const unlockName = req.name || req.unlock_name || req.id || "";
        if (unlockName) {
          player.accountUnlocks.removeUnlock(unlockName);
          player.save();
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, result: true }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/purchase_unlock_list") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        const names = req.names || req.unlocks || req.items || [];
        const newUnlocks = [];
        for (const name of names) {
          const result = player.purchaseItem(name);
          if (result && result.unlock) {
            newUnlocks.push(result.unlock);
          }
        }
        player.save();

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          result: true,
          unlocks: newUnlocks,
          update_unlocks: newUnlocks,
          currency: player.currency ? player.currency.toJSON() : {}
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/lock_collectibles") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, result: true }));
      return true;
    }

if (path === "/account/get_player_info") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          player: {
            id: player.id,
            session: player.session,
            candles: player.currency.candles,
            hearts: player.currency.heart,
            season_candles: player.currency.seasonCandle,
            ascended: player.currency.prestige,
            outfit_height: player.outfit?.height || 1.0,
            outfit_scale: player.outfit?.scale || 1.0
          }
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({player:{}}));
      }
      return true;
    }

if (path === "/account/get_achievement_stats") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      var ts = Math.floor(Date.now()/1000);
      var statTypes = [
        "new_acquaintance_count", "wax_pickup_count", "darkstone_melted_count",
        "collectible_count", "emotes_collected_count", "emotes_used_count",
        "cape_change_count", "join_1_player_count", "remote_avatar_charge_count",
        "highest_carry_stack_count", "light_candle_count", "join_2_players_count",
        "dawn_collectibles_collected_count", "highest_flight_altitude",
        "avatar_charge_count", "engine_activated_count"
      ];
      var stats = statTypes.map(function(t) {
        return { type: t, value: 0, update: ts };
      });
      res.end(JSON.stringify({ achievement_stats: stats }));
      return true;
    }

if (path === "/account/get_event_currency_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/event_currency_defs.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(raw);
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ event_currency_defs: [] }));
      }
      return true;
    }

if (path === "/account/get_account_world_quests") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      const future = Math.floor(Date.now()/1000) + 86400;
      const allQuests = [
        "dawn_come","dawn_nothanks","dawn_point",
        "prairie_bird","prairie_butterfly","prairie_laugh","prairie_thumbsup","prairie_wave","prairie_wipe","prairie_yawn",
        "rain_cold","rain_cry","rain_ohno","rain_pout","rain_seek","rain_shy","rain_sorry","rain_whale",
        "dusk_brave","dusk_die","dusk_lookaround","dusk_salute","dusk_scared","dusk_sneaky",
        "sunset_backflip","sunset_bow","sunset_cheer","sunset_handstand","sunset_manta","sunset_proud","sunset_strong",
        "night_float","night_force","night_ghost","night_love","night_pray"
      ];
      res.end(JSON.stringify({ set_world_quests: allQuests.map(id => ({
        "world_quest_def_id": id, "cooldown_over_time": future, "ever_completed": true
      })) }));
      return true;
    }

if (path === "/account/activate_season_quest") {
      try {
        const req = JSON.parse(body);
        const questId = req.quest_id || req.id || "";
        const data = getQuestData(req.user);

        if (!data.quests.find(q => q.id === questId)) {
          data.quests.push({
            id: questId,
            state: "active",
            progress: 0,
            claimed: false,
            activated_time: Date.now()
          });
          saveQuestData(req.user, data);
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, quest: { id: questId, state: "active" } }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/claim_quest_reward" || path === "/account/claim_season_quest_reward") {
      try {
        const req = JSON.parse(body);
        const questId = req.quest_id || req.id || "";
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);

        if (!player) {
          res.writeHead(401); res.end(JSON.stringify({success:false}));
          return true;
        }

        const data = getQuestData(req.user);
        const q = data.quests.find(q => q.id === questId);

        if (q && !q.claimed) {
          q.claimed = true;
          q.state = "completed";
          q.completed_time = Date.now();
          saveQuestData(req.user, data);

          

          player.currency.candles += 5;
          player.currency.heart += 1;
          player.save();
          player.save();
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          reward: { candles: 5, hearts: 1 },
          currency: player.currency.toJSON()
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/get_remote_outfit") {
      try {
        const req = JSON.parse(body);
        const targetId = req.target || req.target_id || req.id || "";
        const barn = ServerPlayerBarn.singleton();
        var player = barn.players[targetId];
        if (!player) player = barn.loadOfflinePlayer(targetId);
        var o = player && player.outfit ? player.outfit : null;
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          result: "ok",
          get_remote_outfit: {
            wing: { id: o && o.wing ? o.wing.id : 0 },
            voice: o ? o.voice : 0,
            seed: o ? o.seed : 0,
            scale: o ? o.scale : 0,
            refreshVersion: 0,
            prop: { id: o && o.prop ? o.prop.id : 0 },
            neck: { id: o && o.neck ? o.neck.id : 0 },
            mask: { id: o && o.mask ? o.mask.id : 0 },
            legs: { id: 0 },
            horn: { id: o && o.horn ? o.horn.id : 0 },
            height: o ? o.height : 0.5,
            hat: { id: o && o.hat ? o.hat.id : 0 },
            hair: { id: o && o.hair ? o.hair.id : 0 },
            feet: { id: o && o.feet ? o.feet.id : 0 },
            face: { id: o && o.face ? o.face.id : 3599986885 },
            body: { id: o && o.body ? o.body.id : 0 },
            attitude: o ? String(o.attitude || "0") : "0",
            arms: { id: 0 }
          },
          serendipity_types: []
        }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({result:"ok", get_remote_outfit:{wing:{id:0},prop:{id:0},neck:{id:0},mask:{id:0},legs:{id:0},horn:{id:0},hat:{id:0},hair:{id:0},feet:{id:0},face:{id:3599986885},body:{id:0},arms:{id:0},height:0.5,scale:0,seed:0,voice:0,attitude:"0",refreshVersion:0},serendipity_types:[]}));
      }
      return true;
    }

if (path === "/account/debug/add_outfit_dye") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(401); res.end(JSON.stringify({success:false})); return true; }

        const color = req.color || "red";
        const amount = req.amount || 1;

        if (player.currency.dye[color] !== undefined) {
          player.currency.dye[color] += amount;
          player.save();
          player.save();
        }

        res.writeHead(200); res.end(JSON.stringify({
          success: true,
          dye: { [color]: player.currency.dye[color] }
        }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/get_forge_rates") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        forge_rates: [
          { source_type: "wax", current_tier: 26, current_level: 4, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 5, reset_acknowledged: true, enabled: true },
          { source_type: "event_candle_days_of_moonlight_wax", current_tier: 6, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 5, reset_acknowledged: false, enabled: true },
          { source_type: "color_yellow_wax", current_tier: 4, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 3, reset_acknowledged: false, enabled: true },
          { source_type: "color_white_wax", current_tier: 2, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 1, reset_acknowledged: false, enabled: true },
          { source_type: "color_red_wax", current_tier: 5, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 4, reset_acknowledged: false, enabled: true },
          { source_type: "color_magenta_wax", current_tier: 4, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 3, reset_acknowledged: false, enabled: true },
          { source_type: "color_green_wax", current_tier: 5, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 4, reset_acknowledged: false, enabled: true },
          { source_type: "color_cyan_wax", current_tier: 4, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 3, reset_acknowledged: false, enabled: true },
          { source_type: "color_blue_wax", current_tier: 5, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 4, reset_acknowledged: false, enabled: true },
          { source_type: "color_black_wax", current_tier: 2, current_level: 1, tier_completion: 0.0, level_completion: 0.0, level_tier_index: 0, level_tier_count: 1, reset_acknowledged: false, enabled: true }
        ]
      }));
      return true;
    }

if (path === "/account/get_map_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../../../data/defs/map_defs.json");
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ map_defs: [] }));
      }
      return true;
    }

if (path === "/account/device_capabilities/lookup") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        device_capabilities: {
          gpu_rating: 6500,
          hash_id: 3994268958
        }
      }));
      return true;
    }

if (path === "/account/set_device_token") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return true;
    }

if (path === "/account/rebirth") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (player) {
          player.currency.prestige += 1;
          player.currency.candles = Math.floor(player.currency.candles * 0.5);
          player.save();
          player.save();
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, rebirths: player ? player.currency.prestige : 0 }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({success:false}));
      }
      return true;
    }

if (path === "/account/code/login") {
      

      path = "/account/auth/login";
    }

if (path === "/account/get_daily_quests") {
      try {
        var p = getReqPlayer(body);
        var store = SkyServerStore.singleton();
        var graw = store.getString("game_config");
        var gcfg = graw ? JSON.parse(graw) : { daily_quest_count: 4, daily_quest_reward: 1 };
        var questTemplates = [
          { id: "collect_candles", name: "Collect Candles", target: 5, desc: "Collect 5 candles in the realms" },
          { id: "hold_hands", name: "Hold Hands", target: 1, desc: "Hold hands with a friend" },
          { id: "do_emote", name: "Express Yourself", target: 3, desc: "Do 3 emotes in front of others" },
          { id: "chase_butterflies", name: "Chase Butterflies", target: 2, desc: "Chase 2 groups of butterflies" },
          { id: "light_candle", name: "Light Candles", target: 3, desc: "Light 3 candles" },
          { id: "meditate", name: "Meditate", target: 1, desc: "Meditate at the designated spot" },
          { id: "high_five", name: "High Five", target: 1, desc: "High five a friend" },
          { id: "give_candle", name: "Give Candle", target: 1, desc: "Give a candle to a friend" },
          { id: "follow_dragon", name: "Chase Crabs", target: 1, desc: "Chase a crab in Wasteland" },
          { id: "hide_seek", name: "Hide & Seek", target: 1, desc: "Play hide and seek with a friend" }
        ];
        var today = Math.floor(Date.now() / 86400000);
        var quests = [];
        for (var i = 0; i < (gcfg.daily_quest_count || 4); i++) {
          var t = questTemplates[(today + i) % questTemplates.length];
          quests.push({
            id: t.id + "_" + today,
            template_id: t.id,
            name: t.name,
            desc: t.desc || "",
            state: "available",
            progress: 0,
            target: t.target,
            reward: gcfg.daily_quest_reward || 1,
            claimed: false,
            date: today
          });
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ quests: quests, total: quests.length, reset_time: (today + 1) * 86400 }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ quests: [], total: 0 }));
      }
      return true;
    }

if (path === "/account/get_season_info") {
      try {
        var p = getReqPlayer(body);
        var store = SkyServerStore.singleton();
        var sraw = store.getString("admin_season");
        var scfg = sraw ? JSON.parse(sraw) : {
          season_id: "none",
          name: "No Season",
          start_time: Math.floor(Date.now()/1000),
          end_time: Math.floor(Date.now()/1000) + 86400 * 90
        };
        var sid = scfg.season_id || "none";
        var now = Math.floor(Date.now()/1000);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        if (sid === "none" || sid === "") {
          res.end(JSON.stringify({
            season_id: "none",
            season_name: "",
            season_number: 0,
            season_level: 0,
            season_xp: 0,
            season_start_time: 0,
            season_end_time: 0,
            season_pass_active: false
          }));
        } else {
          res.end(JSON.stringify({
            season_id: sid,
            season_name: scfg.name || sid,
            season_number: parseInt(sid.replace(/\D/g,'')) || 1,
            season_level: p ? (p.serviceUnlocks ? Object.keys(p.serviceUnlocks.unlocks || {}).length : 1) : 1,
            season_xp: scfg.xp || 0,
            season_start_time: scfg.start_time || now - 86400 * 30,
            season_end_time: scfg.end_time || now + 86400 * 60,
            season_pass_active: true,
            season_pass_owned: true
          }));
        }
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ season_id: "none", season_name: "", season_level: 0, season_xp: 0 }));
      }
      return true;
    }

if (path === "/account/get_eden" || path === "/account/get_eye_of_eden") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        unlocked: true,
        completed: false,
        ascended: 0,
        ofb_saved: 0,
        strength: 0,
        message: ""
      }));
      return true;
    }

if (path === "/account/get_traveling_spirit") {
      try {
        var shopDefs = require("../../../../data/defs/spirit_shop_defs.json");
        var spiritId = "beacon";
        var spiritName = "Traveling Spirit";
        try {
          var sraw = SkyServerStore.singleton().getString("admin_spirit");
          if (sraw) {
            var scfg = JSON.parse(sraw);
            if (scfg.spirit) { spiritId = scfg.spirit; spiritName = scfg.name || spiritId; }
          }
        } catch(e) {}
        var items = (shopDefs.spirit_shops || []).filter(s => s.spirit === spiritId);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          spirit: {
            id: spiritId,
            name: spiritName,
            arrival_time: Date.now() / 1000 - 86400,
            departure_time: Date.now() / 1000 + 86400 * 30,
            items: items,
            spirit_id: spiritId,
            departure_time_ms: Date.now() + 86400 * 30000
          }
        }));
      } catch(e) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ spirit: { id: "beacon", items: [] } }));
      }
      return true;
    }

if (path === "/account/get_leaderboard") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ leaderboard: [], my_rank: 0, total_players: 0 }));
      return true;
    }

if (path === "/account/get_notifications") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ notifications: [], unread_count: 0 }));
      return true;
    }

if (path === "/account/get_home_settings") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        home_settings: {
          furniture: [],
          decor: [],
          layout: "default",
          unlocked: true
        }
      }));
      return true;
    }

if (path === "/account/get_relics") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ relics: [], total: 0 }));
      return true;
    }

if (path === "/account/get_mail" || path === "/account/get_messages") {
      try {
        const req = JSON.parse(body);
        const mailList = getMailData(req.user || req.player_id || "");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ mail: mailList, total: mailList.length }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ mail: [], error: e.message }));
      }
      return true;
    }

if (path === "/account/get_gift_messages") {
      try {
        const req = JSON.parse(body);
        const mailList = getMailData(req.user || req.player_id || "");
        var gifts = mailList.filter(m => m.rewards && m.rewards.length > 0).map(m => ({
          id: m.id || ("mail_" + m.time),
          sender: m.from || m.sender || "System",
          sender_id: m.from || m.sender_id || "system",
          title: m.title || "Gift",
          body: m.body || "",
          timestamp: m.time || Date.now(),
          claimed: !!m.claimed,
          rewards: m.rewards || null
        }));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ gift_messages: gifts, total: gifts.length }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ gift_messages: [] }));
      }
      return true;
    }

if (path === "/account/send_message" || path === "/account/send_gift_message") {
      try {
        const req = JSON.parse(body);
        const toPlayer = req.to || req.player_id || req.to_user || req.target || "";
        const title = req.title || req.subject || "Message";
        const msgBody = req.body || req.message || req.text || "";
        const from = req.user || "System";
        const fromName = req.from_name || "";
        const rewards = req.rewards || [];

        const mailList = getMailData(toPlayer);
        mailList.unshift({
          id: "mail_" + Date.now(),
          from: from,
          from_name: fromName,
          title: title,
          body: msgBody,
          rewards: rewards,
          time: Date.now(),
          read: false,
          claimed: false
        });
        saveMailData(toPlayer, mailList);

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, message_id: "mail_" + Date.now() }));
      } catch (e) {
        console.error("send_message error:", e.message);
        res.writeHead(500); res.end(JSON.stringify({ success: false, error: e.message }));
      }
      return true;
    }

  return false;
};
