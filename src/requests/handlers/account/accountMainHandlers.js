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

module.exports = function handleAccountMain(path, body, res, headers, method, query) {
  if (!path.startsWith("/account/")) return false;

if (path === "/account/get_currency") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || req.player_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var candles = 0, wax = 0;
        if (player && player.currency) {
          candles = player.currency.candles || 0;
          wax = player.currency.wax || player.currency.prestige || 0;
        }
        

        if (candles === 0 && wax === 0) {
          candles = 200;
          wax = 20;
          if (player && player.currency) {
            player.currency.candles = candles;
            player.currency.wax = wax;
          }
        }
        if (player) player.save();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          currency: {
            candles: candles,
            vip: 1,
            wax: wax,
            hearts: player && player.currency ? (player.currency.heart || 10) : 10,
            season_candles: player && player.currency ? (player.currency.seasonCandle || 20) : 20,
            ascended: player && player.currency ? (player.currency.ascended || 0) : 0,
            event_currency: player && player.currency ? (player.currency.eventCurrency || 0) : 0
          }
        }));
      } catch (e) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ currency: { candles: 200, vip: 1, wax: 20 } }));
      }
      return true;
    }

if (path === "/account/consumable/consume_item1") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || req.player_id || "";
        const consumableId = req.consumable_id || 0;
        const count = req.consumable_count || 1;
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        

        if (player && player.consumables && player.consumables.items) {
          var entry = player.consumables.items.get(consumableId);
          if (entry && entry.count >= count) entry.count -= count;
          if (player.consumables.items.get(consumableId) && player.consumables.items.get(consumableId).count <= 0)
            player.consumables.items.delete(consumableId);
          player.save();
        }
        

        var list = [];
        if (player && player.consumables && player.consumables.items) {
          for (var [id, e] of player.consumables.items) {
            if (e.count > 0) list.push({ consumable_id: id, cooldown_until: 0, quantity: e.count });
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ consume_item: "success", get_consumables: list }));
      } catch(e) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ consume_item: "error", get_consumables: [] }));
      }
      return true;
    }

if (path === "/account/get_blocked_friends") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ set_blocked_friends: {} }));
      return true;
    }

if (path === "/account/get_unlocks") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || req.player_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var unlockMap = new Map();
        if (player && player.accountUnlocks && player.accountUnlocks.entries && player.accountUnlocks.entries.size) {
          for (const e of player.accountUnlocks.entries.values()) {
            unlockMap.set(e.name, { name: e.name, type: e.type, ack: !!e.ack, created_at: e.unlockTime || Math.floor(Date.now()/1000) });
          }
        }
        

        try {
          const fs2 = require("fs");
          const path2 = require("path");
          var ts = Math.floor(Date.now()/1000);
          for (const page of ["0", "1000", "2000"]) {
            const fp = path2.join(__dirname, `../../data/defs/spirit_shops/${page}.json`);
            if (!fs2.existsSync(fp)) continue;
            const pageData = JSON.parse(fs2.readFileSync(fp, "utf8"));
            const items = pageData.spirit_shops || [];
            for (const item of items) {
              var nm = item.nm || item.name;
              if (!nm || unlockMap.has(nm)) continue;
              if (item.typ === "spirit_upgrade" && nm.match(/^emote_upgrade_[a-z]+_\d+$/)) {
                unlockMap.set(nm, { name: nm, type: "spiritshop", ack: true, created_at: ts });
              }
            }
          }
        } catch(e) {}

        var unlocks = Array.from(unlockMap.values());
        

        unlocks = unlocks.map(u => ({ ...u, ack: true }));

        

        var animUnlocks = [
          "ap06unlock_ap06_hug","ap06unlock_ap07_fetch_01","ap06unlock_ap07_fetch_02","ap06unlock_ap07_fetch_03","ap06unlock_ap07_fetch_04","ap06unlock_ap07_fetch_05","ap06unlock_ap07_fetch_06","ap06unlock_ap07_hug",
          "ap06unlock_ap08_fetch_01","ap06unlock_ap08_fetch_02","ap06unlock_ap08_fetch_03","ap06unlock_ap08_fetch_04","ap06unlock_ap08_hug",
          "ap06unlock_ap09_fetch_01","ap06unlock_ap09_fetch_02","ap06unlock_ap09_fetch_03","ap06unlock_ap09_fetch_04","ap06unlock_ap09_fetch_05","ap06unlock_ap09_hug",
          "ap06unlock_ap10_fetch_01","ap06unlock_ap10_fetch_02","ap06unlock_ap10_fetch_03","ap06unlock_ap10_fetch_04","ap06unlock_ap10_fetch_05","ap06unlock_ap10_fetch_06","ap06unlock_ap10_high_five","ap06unlock_ap10_high_five_3","ap06unlock_ap10_hug",
          "ap06unlock_ap11_fetch_01","ap06unlock_ap11_fetch_02","ap06unlock_ap11_fetch_03","ap06unlock_ap11_fetch_04","ap06unlock_ap11_fetch_05","ap06unlock_ap11_fetch_06","ap06unlock_ap11_fetch_07",
          "ap06unlock_ap12_fetch_01","ap06unlock_ap12_fetch_02","ap06unlock_ap12_fetch_03","ap06unlock_ap12_fetch_04","ap06unlock_ap12_fetch_05","ap06unlock_ap12_high_five","ap06unlock_ap12_hug",
          "ap06unlock_ap13_fetch_01","ap06unlock_ap13_fetch_02","ap06unlock_ap13_fetch_03","ap06unlock_ap13_fetch_04","ap06unlock_ap13_fetch_05",
          "ap06unlock_ap14_duetdance","ap06unlock_ap14_fetch_01","ap06unlock_ap14_fetch_02","ap06unlock_ap14_fetch_03","ap06unlock_ap14_fetch_04","ap06unlock_ap14_fetch_05","ap06unlock_ap14_high_five","ap06unlock_ap14_high_five_3","ap06unlock_ap14_hug",
          "ap06unlock_ap15_fetch_01","ap06unlock_ap15_fetch_02","ap06unlock_ap15_fetch_03","ap06unlock_ap15_fetch_04","ap06unlock_ap15_fetch_05","ap06unlock_ap15_fetch_06",
          "ap06unlock_ap16_fetch_01","ap06unlock_ap16_fetch_02","ap06unlock_ap16_fetch_03","ap06unlock_ap16_fetch_04","ap06unlock_ap16_fetch_05",
          "ap06unlock_ap17_fetch_01","ap06unlock_ap17_fetch_02","ap06unlock_ap17_fetch_03","ap06unlock_ap17_fetch_04","ap06unlock_ap17_fetch_05","ap06unlock_ap17_fetch_06","ap06unlock_ap17_fetch_07","ap06unlock_ap17_fetch_08","ap06unlock_ap17_fetch_09","ap06unlock_ap17_fetch_10","ap06unlock_ap17_high_five","ap06unlock_ap17_high_five_3","ap06unlock_ap17_hug",
          "ap06unlock_ap18_fetch_01","ap06unlock_ap18_fetch_02","ap06unlock_ap18_fetch_03","ap06unlock_ap18_fetch_04","ap06unlock_ap18_fetch_05",
          "ap06unlock_ap19_fetch_01","ap06unlock_ap19_fetch_02","ap06unlock_ap19_fetch_03","ap06unlock_ap19_fetch_04","ap06unlock_ap19_fetch_05","ap06unlock_ap19_high_five",
          "ap06unlock_ap20_fetch_01","ap06unlock_ap20_fetch_02","ap06unlock_ap20_fetch_03","ap06unlock_ap20_fetch_04","ap06unlock_ap20_fetch_05","ap06unlock_ap20_fetch_06","ap06unlock_ap20_fetch_07","ap06unlock_ap20_fetch_08","ap06unlock_ap20_fetch_09","ap06unlock_ap20_fetch_10","ap06unlock_ap20_high_five","ap06unlock_ap20_hug",
          "ap06unlock_ap21_fetch_01","ap06unlock_ap21_fetch_02","ap06unlock_ap21_fetch_03","ap06unlock_ap21_fetch_04","ap06unlock_ap21_fetch_05",
          "ap06unlock_ap22_fetch_01","ap06unlock_ap22_fetch_02","ap06unlock_ap22_fetch_03","ap06unlock_ap22_fetch_04","ap06unlock_ap22_fetch_05","ap06unlock_ap22_miniHouse_01","ap06unlock_ap22_miniHouse_02","ap06unlock_ap22_miniHouse_03","ap06unlock_ap22_miniShop_01","ap06unlock_ap22_miniShop_02","ap06unlock_ap22_miniShop_03","ap06unlock_ap22_miniSocial_01","ap06unlock_ap22_miniSocial_02","ap06unlock_ap22_miniSocial_03",
          "ap06unlock_ap23_fetch_01","ap06unlock_ap23_fetch_02","ap06unlock_ap23_fetch_03","ap06unlock_ap23_fetch_04","ap06unlock_ap23_fetch_05",
          "ap06unlock_ap24_fetch_01","ap06unlock_ap24_fetch_03","ap06unlock_ap24_fetch_05","ap06unlock_ap24_fetch_07","ap06unlock_ap24_fetch_09","ap06unlock_ap24_fetch_11",
          "ap06unlock_ap25_fetch_01","ap06unlock_ap25_fetch_02","ap06unlock_ap25_fetch_03","ap06unlock_ap25_fetch_04","ap06unlock_ap25_fetch_05",
          "ap06unlock_ap26_fetch_01","ap06unlock_ap26_fetch_02","ap06unlock_ap26_fetch_03","ap06unlock_ap26_fetch_04","ap06unlock_ap26_fetch_05","ap06unlock_ap26_fetch_06",
          "ap06unlock_ap27_fetch_01","ap06unlock_ap27_fetch_02","ap06unlock_ap27_fetch_03","ap06unlock_ap27_fetch_04","ap06unlock_ap27_fetch_05","ap06unlock_ap27_manatee_01"
        ];
        var existingNames = new Set(unlocks.map(u => u.name));
        for (var an of animUnlocks) {
          if (!existingNames.has(an)) {
            unlocks.push({ name: an, type: "story", ack: true, created_at: ts });
          }
        }
        

        var skipAnims = [
          "FinishedIntro","AP20IntroBeginning","LearnedResume","PlayedFlyingIntro","MainStreetFlyingIntro",
          "first_loaded_MainStreet","AP20Unlock","mainstreetRevealedMural",
          "MainstreetFirstWakeUp","HomeWakeupComplete","crest_unlocked","WingedLightIntroSeen",
          "HomeDreamIntroComplete","nestWelcomeSeen","MainstreetSeasonIntroComplete","MainstreetFirstVisit",
          "OnboardedInMainstreet","first_loaded_MainStreet_StorySpace","OnboardedInStorySpace","StorySpaceTutorialFinished",
          "help_howtoplay_basics_v2","MainstreetFinishedOnboarding","DayHub","RewardsActive",
          "first_loaded_CandleSpace","first_loaded_MainStreet_ShopOutfits","first_loaded_MainStreet_ShopSpells","first_loaded_MainStreet_ShopProps",
          "ShopSpellsIntro","ShopPropsIntro",
          "first_loaded_Dawn","MainstreetDawnIntro","PointToTempleHint","FirstSpiritGained","tutorial_shop",
          "first_loaded_Prairie_ButterflyFields","first_loaded_Prairie_Village","first_loaded_Prairie_Island",
          "first_loaded_Prairie_NestAndKeeper","first_loaded_Prairie_Cave","PrairieVillageIntro",
          "first_loaded_Rain","first_loaded_Sunset","first_loaded_Dusk","first_loaded_DuskStart","DuskLanded","first_loaded_Night",
          "first_loaded_CandleSpaceEnd","first_loaded_DawnCave","first_loaded_Dawn_TrialsAir","first_loaded_Dawn_TrialsEarth",
          "first_loaded_Dawn_TrialsFire","first_loaded_Dawn_TrialsWater","first_loaded_DayEnd","first_loaded_DayHubCave",
          "first_loaded_DuskEnd","first_loaded_DuskEnd_Past","first_loaded_DuskGraveyard","first_loaded_DuskMid",
          "first_loaded_DuskMid_Past","first_loaded_DuskMid_PastMarket","first_loaded_DuskOasis",
          "first_loaded_Dusk_CrabField","first_loaded_Dusk_HiddenTemple","first_loaded_Dusk_Triangle","first_loaded_Dusk_TriangleEnd",
          "first_loaded_MainStreetFlyingIntro","first_loaded_MainStreet_Apartment","first_loaded_MainStreet_Cafe",
          "first_loaded_MainStreet_Cafe_Wonderland","first_loaded_MainStreet_ConcertHall","first_loaded_MainStreet_Soundbath",
          "first_loaded_Night2","first_loaded_NightArchive","first_loaded_NightDesert","first_loaded_NightDesert_Beach",
          "first_loaded_NightDesert_Planets","first_loaded_NightEnd","first_loaded_Night_IPHallway","first_loaded_Night_InfiniteDesert",
          "first_loaded_Night_JarCave","first_loaded_Night_Jumble","first_loaded_Night_PaintedWorld","first_loaded_Night_Shelter",
          "first_loaded_Night_StoryBook","first_loaded_Night_ValleyForest","first_loaded_Night_ValleyHouse","first_loaded_Night_ValleyHouseSky",
          "first_loaded_Night_Workshop","first_loaded_Prairie_WildLifePark","first_loaded_RainEnd","first_loaded_RainForest",
          "first_loaded_RainMid","first_loaded_RainShelter","first_loaded_Rain_BaseCamp","first_loaded_Rain_BlueBirdTheater","first_loaded_Rain_Cave",
          "first_loaded_SunsetColosseum","first_loaded_SunsetEnd","first_loaded_SunsetEnd2","first_loaded_SunsetRace",
          "first_loaded_SunsetVillage","first_loaded_SunsetVillage_MusicShop","first_loaded_Sunset_Citadel","first_loaded_Sunset_FlyRace",
          "first_loaded_Sunset_Theater","first_loaded_Sunset_YetiPark",
          "DayStatueForm","SunsetStatueForm","RainStatueForm","DuskStatueForm","NightStatueForm","StormStatueForm",
          "AP31Intro_01","AP31Unlock","MainstreetFinishedStorm","first_loaded_Night_GO_Island",
          "timeline:mainstreet:3384672330","timeline:mainstreet:3480027379","timeline:mainstreet:3384674155",
          "timeline:mainstreet:3384674384","timeline:mainstreet:3384673953","timeline:mainstreet:3384672886","timeline:mainstreet:3384674047",
          "nestWelcomeLevel",
          "ap06unlock_ap20_fetch_01_claimFx","ap06unlock_ap20_fetch_01_quest_done","ap06unlock_ap20_fetch_02_claimFx","ap06unlock_ap20_fetch_02_quest_done","ap06unlock_ap20_fetch_02_quest_started",
          "ap06unlock_ap20_fetch_03_claimFx","ap06unlock_ap20_fetch_03_quest_done","ap06unlock_ap20_fetch_03_quest_started",
          "ap06unlock_ap20_fetch_04_claimFx","ap06unlock_ap20_fetch_04_quest_done","ap06unlock_ap20_fetch_04_quest_started",
          "ap06unlock_ap20_fetch_05_claimFx","ap06unlock_ap20_fetch_06_claimFx","ap06unlock_ap20_fetch_07_claimFx",
          "ap06unlock_ap20_fetch_08_claimFx","ap06unlock_ap20_fetch_09_claimFx","ap06unlock_ap20_fetch_10_claimFx"
        ];
        for (var sa of skipAnims) {
          if (!existingNames.has(sa)) {
            unlocks.push({ name: sa, type: "level", ack: true, created_at: ts });
            existingNames.add(sa);
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          unlocks: unlocks,
          unlocks_total_count: unlocks.length
        }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ unlocks: [], unlocks_total_count: 0 }));
      }
      return true;
    }

if (path === "/account/ack_unlock") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || req.player_id || "";
        const unlockId = req.unlock_id || req.id || req.unlock || req.item_id || req.name || "";

        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);

        if (player && unlockId && player.accountUnlocks && player.accountUnlocks.entries) {
          var entry = player.accountUnlocks.entries.get(unlockId);
          if (entry) {
            entry.ack = true;
            player.save();
          }
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, unlocked: true, unlock_id: unlockId, name: unlockId }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ success: true, unlocked: true }));
      }
      return true;
    }

if (path === "/account/purchase_spirit_shop_item") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || req.player_id || "";
        

        const unlockId = req.unlock_id || req.item_id || req.id || 0;
        const itemName = req.item_name || req.nm || req.name || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId);
        if (!player) player = ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        if (!player) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: false, error: "player not found" }));
          return true;
        }

        

        const fs2 = require("fs");
        const path2 = require("path");
        var shopItem = null;
        for (const pg of ["0", "1000", "2000"]) {
          const fp = path2.join(__dirname, `../../data/defs/spirit_shops/${pg}.json`);
          if (!fs2.existsSync(fp)) continue;
          const pd = JSON.parse(fs2.readFileSync(fp, "utf8"));
          const items = pd.spirit_shops || (Array.isArray(pd) ? pd : []);
          for (const it of items) {
            if ((unlockId && String(it.id) === String(unlockId)) || (itemName && it.nm === itemName)) { shopItem = it; break; }
          }
          if (shopItem) break;
        }
        if (!shopItem) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: false, error: "item not found", unlock_id: unlockId, item_name: itemName }));
          return true;
        }
        const nm = shopItem.nm || shopItem.name || itemName;
        const cost = shopItem.cst || 0;
        const ctyp = shopItem.ctyp || "candles";

        

        if (player.accountUnlocks && player.accountUnlocks.entries && player.accountUnlocks.entries.has(nm)) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: false, error: "already unlocked", nm: nm }));
          return true;
        }

        

        var bal = 0;
        if (ctyp === "hearts") bal = player.currency.heart || 0;
        else if (ctyp === "season_candle") bal = player.currency.seasonCandle || 0;
        else bal = player.currency.candles || 0;
        if (cost > 0 && bal < cost) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({
            success: false, error: "insufficient currency", nm: nm, cost: cost, currency_type: ctyp,
            currency: { candles: player.currency.candles || 0, heart: player.currency.heart || 0, season_candle: player.currency.seasonCandle || 0, wax: player.currency.wax || 0 }
          }));
          return true;
        }

        

        if (ctyp === "hearts") player.currency.heart = (player.currency.heart || 0) - cost;
        else if (ctyp === "season_candle") player.currency.seasonCandle = (player.currency.seasonCandle || 0) - cost;
        else player.currency.candles = (player.currency.candles || 0) - cost;

        

        if (nm.indexOf("heart_") === 0) {
          player.currency.heart = (player.currency.heart || 0) + 1;
        } else {
          try { player.addSpiritUnlock(nm, false); }
          catch (e) { console.error("[spirit purchase] unlock error:", e.message); }
        }
        player.save();

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: true,
          result: "ok",
          nm: nm,
          currency: {
            candles: player.currency.candles || 0,
            hearts: player.currency.heart || 0,
            season_candles: player.currency.seasonCandle || 0,
            vip: 1,
            wax: player.currency.wax || 0
          },
          update_status_unlocks: [{ nm: nm, time: Date.now() }]
        }));
      } catch (e) {
        console.error("[purchase_spirit_shop_item] error:", e.message);
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: e.message || "internal error" }));
      }
      return true;
    }

if (path === "/account/get_outfit") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || "";
        const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
        var player = ServerPlayerBarn.singleton().getPlayer(playerId) ||
                     ServerPlayerBarn.singleton().loadOfflinePlayer(playerId);
        var slots = ["wing","prop","neck","mask","legs","horn","hat","hair","feet","face","body","arms"];
        var slotDefaults = {
          wing: 2245279351, body: 3691343236, face: 3599986885, feet: 1532093990,
          hair: 1229053584, hat: 1470462579, horn: 3680499229, mask: 3663390882,
          neck: 3800884691, prop: 2035109393, legs: 0, arms: 0
        };
        var outfit = { voice: 0, seed: 0, refreshVersion: 0, attitude: "0" };
        if (player && player.outfit) {
          for (var s of slots) {
            var sid = slotDefaults[s];
            if (player.outfit[s] && typeof player.outfit[s].id === 'number' && player.outfit[s].id !== 0) {
              sid = player.outfit[s].id;
            }
            outfit[s] = { id: sid };
          }
          outfit.scale = typeof player.outfit.scale === 'number' ? player.outfit.scale : 0.0697;
          outfit.height = typeof player.outfit.height === 'number' ? player.outfit.height : 0.0;
          

          var wKey = "wings_" + playerId;
          var wRaw = SkyServerStore.singleton().getString(wKey);
          var wCount = 0;
          if (wRaw) { try { wCount = JSON.parse(wRaw).length; } catch(e) {} }
          if (wCount > 0) player.outfit.wingCount = wCount;
          outfit.wingCount = player.outfit.wingCount || 0;
          outfit.wing_count = player.outfit.wingCount || 0;
        } else {
          for (var s2 of slots) outfit[s2] = { id: slotDefaults[s2] };
          outfit.scale = 0.0697; outfit.height = 0.0;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: "ok", set_outfit: outfit }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "should_sync" }));
      }
      return true;
    }

if (path === "/account/get_outfit_defs") {
      

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ outfit_defs: [], total: 0 }));
      return true;
    }

if (path === "/account/get_achievements") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        const achievements = [];
        if (player) {
          for (const unlock of player.accountUnlocks.list || []) {
            achievements.push({
              id: unlock.name || unlock.id,
              completed: true,
              progress: 1,
              total: 1,
              timestamp: unlock.epoch || Date.now()
            });
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ achievements: achievements, total: achievements.length }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ achievements: [], total: 0 }));
      }
      return true;
    }

if (path === "/account/get_questionnaires") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ questionnaires: [], total: 0 }));
      return true;
    }

if (path === "/account/get_iap_list" || path === "/account/iaplist") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../data/defs/iap_list.json");
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        data.purchased_non_consumables = data.purchased_non_consumables || [];
        data.unfulfilled_purchases = data.unfulfilled_purchases || [];
        data.commerce_gift_count = data.commerce_gift_count || 0;
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ iap_list: [], purchased_non_consumables: [], unfulfilled_purchases: [], commerce_gift_count: 0 }));
      }
      return true;
    }

if (path === "/account/get_checkpoints") {
      try {
        const req = JSON.parse(body);
        const playerId = req.user || req.user_id || "";
        const { SkyServerStore } = require("../../../runtimeData/db.js");
        var raw = SkyServerStore.singleton().getString("checkpoint_" + playerId);
        var cps;
        if (raw) {
          cps = JSON.parse(raw);
        } else {
          

          cps = {
            checkpoints: [
              { user: playerId, level_id: 1649439303, level_hash: 19812, bst_id: 0, states: [true,true,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false], updated_at: new Date().toISOString(), updated_ts: Math.floor(Date.now()/1000), is_furthest: true, arc_order: 1 }
            ]
          };
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(cps));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ checkpoints: [] }));
      }
      return true;
    }

if (path === "/account/get_external_account_friends") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ friends: [], total: 0 }));
      return true;
    }

if (path === "/account/get_star_tag_defs") {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../data/defs/star_tag_defs.json");
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ star_tag_defs: [], total: 0 }));
      }
      return true;
    }

if (path === "/account/get_achievement_defs") {
      try {
        const questDefs = require("../../../../data/defs/quest_defs.json");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ achievement_defs: questDefs.get_quest_defs || [], total: (questDefs.get_quest_defs||[]).length }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ achievement_defs: [] }));
      }
      return true;
    }

if (path === "/account/get_achievement_stats_tracking") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        const stats = {
          candles_collected: player ? (player.currency.candles || 0) : 0,
          hearts_given: 0,
          hearts_received: 0,
          wing_buffs: player && player.outfit ? (player.outfit.wingCount || 0) : 0,
          friends_made: 0
        };
        

        const fd = getFriendData(req.user);
        stats.friends_made = fd.friends.length;
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ stats: stats, tracking: stats }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ stats: {} }));
      }
      return true;
    }

if (path === "/account/get_infractions") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ infractions: [], total: 0 }));
      return true;
    }

if (path === "/account/get_user_profile") {
      try {
        const req = JSON.parse(body);
        const myId = req.user || "";
        const player = ServerPlayerBarn.singleton().getPlayer(myId, req.session);
        const fd = getFriendData(myId);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          id: myId,
          name: myId.substring(0, 8),
          candles: player ? (player.currency.candles || 0) : 0,
          hearts: player ? (player.currency.heart || 0) : 0,
          wing_buffs: player && player.outfit ? (player.outfit.wingCount || 0) : 0,
          friends_count: fd.friends.length,
          outfit: player && player.outfit ? player.outfit.toJSON() : null
        }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({}));
      }
      return true;
    }

if (path === "/account/get_emote_sequences") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ emote_sequences: [], total: 0 }));
      return true;
    }

if (path === "/account/get_collectibles") {
      try {
        var fs2 = require("fs");
        var path2 = require("path");
        var emoteSet = new Set([
          "butterfly","cape","flame","home","normal","point","presence","sit","skykid",
          "acknowledge","anxious","armwave","awww","babymanta","backflip","balance","beacon",
          "bearhug","beckon","bellyscratch","bird","bow","brave","bubbles","carry","celebrate",
          "cheer","chestpound","chuckle","cold","come","crabvoice","crabwalk","cry","dance",
          "deepbreath","die","dontgo","doublefive","doze","duetdance","dustoff","evillaugh",
          "eww","facepalm","float","floatdance","force","ghost","gloat","gratitude","grief",
          "grumpy","hackysack","hairtousle","handshake","handstand","headbob","hearthands",
          "injured","jelly","jollydance","joy","juggle","kiss","kungfu","laugh","lazycool",
          "lookaround","loopdance","love","manta","marching","mope","muscle","nerdy","nod",
          "nothanks","ohno","ouch","peek","playfight","plead","pointup","pout","pray",
          "princesscarry","proud","pullup","raisetheroof","rally","respect","rhythmicclap",
          "roll","salutation","salute","sarcastic","sass","scare","scared","scheme","seek",
          "shh","showdance","shrug","shy","slouch","sneaky","sneeze","sorry","sparkler",
          "spintrick","stretch","strong","think","thumbsup","timid","tiptoe","tripleaxel",
          "tsktsk","twirl","voila","wait","wave","welcome","whale","whistle","windpose",
          "wipe","wise","yawn"
        ]);
        

        for (var page of ["0","1000","2000"]) {
          try {
            var fp = path2.join(__dirname, `../../data/defs/spirit_shops/${page}.json`);
            if (!fs2.existsSync(fp)) continue;
            var pageData = JSON.parse(fs2.readFileSync(fp, "utf8"));
            for (var item of (pageData.spirit_shops||[])) {
              if (item.nm) {
                var m = item.nm.match(/^emote_upgrade_([a-z]+)_\d+$/);
                if (m) emoteSet.add(m[1]);
              }
            }
          } catch(e) {}
        }
        var collectibles = Array.from(emoteSet).map(function(name) {
          return { id: name, used: true, candle_space: false, carrying: false, level: 4, permanent_level: 4 };
        });
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ collectibles: collectibles }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({ collectibles: [] }));
      }
      return true;
    }

if (path === "/account/collect_wax") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(200); res.end(JSON.stringify({ success: false, error: "not online" })); return true; }
        var waxId = req.id || req.wax_id || req.location || ("wax_" + Date.now());
        var today = Math.floor(Date.now() / 86400000);
        var key = "wax_" + player.id + "_" + today;
        var raw = SkyServerStore.singleton().getString(key);
        var collected = raw ? JSON.parse(raw) : [];
        if (collected.indexOf(waxId) >= 0) {
          res.writeHead(200); res.end(JSON.stringify({ success: false, error: "already collected" })); return true;
        }
        collected.push(waxId);
        SkyServerStore.singleton().set(key, JSON.stringify(collected));
        player.currency.wax = (player.currency.wax || 0) + 1;
        player.save();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, wax: player.currency.wax, collected_count: collected.length }));
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({ success: false })); }
      return true;
    }

if (path === "/account/wing_buffs/collect") {
      try {
        const req = JSON.parse(body);
        const barn = ServerPlayerBarn.singleton();
        var player = barn.getPlayer(req.user, req.session) || barn.loadOfflinePlayer(req.user);
        if (!player) { res.writeHead(200); res.end(JSON.stringify({ result: "ok", update_wing_buffs: [], wing_count: 0 })); return true; }
        var key = "wings_" + player.id;
        var raw = SkyServerStore.singleton().getString(key);
        var wings = raw ? JSON.parse(raw) : [];
        

        var existingNames = wings.map(w => (typeof w === "string" ? w : w.name));
        var names = req.names || (req.name ? [req.name] : []);
        for (var n of names) {
          if (!existingNames.includes(n)) {
            wings.push({ name: n, collected: true, deposited: true, last_conversion: 0, deposit_id: 0 });
            player.outfit.wingCount = (player.outfit.wingCount || 0) + 1;
          }
        }
        SkyServerStore.singleton().set(key, JSON.stringify(wings));
        player.save();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          result: "ok",
          update_wing_buffs: wings.map(w => ({ name: (typeof w === "string" ? w : w.name), collected: true }))
        }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "ok", update_wing_buffs: [] }));
      }
      return true;
    }

if (path === "/account/wing_buffs/get") {
      try {
        const req = JSON.parse(body);
        const barn = ServerPlayerBarn.singleton();
        var p = barn.getPlayer(req.user, req.session) || barn.loadOfflinePlayer(req.user);
        var list = [];
        if (p) {
          var key = "wings_" + p.id;
          var raw = SkyServerStore.singleton().getString(key);
          if (raw) {
            var parsed = JSON.parse(raw);
            list = parsed.map(w => {
              if (typeof w === "string") return { name: w, collected: true, deposited: true, last_conversion: 0, deposit_id: 0 };
              return { name: w.name, collected: true, deposited: true, last_conversion: 0, deposit_id: 0 };
            });
          }
          

          if (list.length === 0 && p.outfit && p.outfit.wingCount > 0) {
            const fs = require("fs");
            const path = require("path");
            const mapData = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/defs/map_defs.json"), "utf8"));
            const allWings = mapData.get_map_defs.filter(d => d.type === "wing_buff");
            var count = Math.min(p.outfit.wingCount, allWings.length);
            list = allWings.slice(0, count).map(w => ({ name: w.name, collected: true, deposited: true, last_conversion: 0, deposit_id: 0 }));
            SkyServerStore.singleton().set(key, JSON.stringify(list));
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: "ok", wing_buffs: list, wing_count: list.length }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ result: "ok", wing_buffs: [], wing_count: 0 }));
      }
      return true;
    }

if (path === "/account/get_winged_lights" || path === "/account/get_wings") {
      try {
        const req = JSON.parse(body);
        const barn = ServerPlayerBarn.singleton();
        var p = barn.getPlayer(req.user, req.session) || barn.loadOfflinePlayer(req.user);
        var wings = [];
        if (p) {
          var raw = SkyServerStore.singleton().getString("wings_" + p.id);
          if (raw) wings = JSON.parse(raw);
          

          if (!wings.length && p.outfit && p.outfit.wingCount > 0) {
            const fs = require("fs");
            const path = require("path");
            const mapData = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/defs/map_defs.json"), "utf8"));
            var allWings = mapData.get_map_defs.filter(d => d.type === "wing_buff");
            var count = Math.min(p.outfit.wingCount, allWings.length);
            wings = allWings.slice(0, count).map(w => w.name);
            SkyServerStore.singleton().set("wings_" + p.id, JSON.stringify(
              wings.map(n => ({ name: n, collected: true, deposited: true, last_conversion: 0, deposit_id: 0 }))
            ));
          }
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ winged_lights: wings, total: wings.length }));
      } catch(e) { res.writeHead(200); res.end(JSON.stringify({ winged_lights: [], total: 0 })); }
      return true;
    }

if (path === "/account/get_relationship_defs") {
      try {
        var relData = require("../../../../data/defs/relationship_defs.json");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          relationship_defs: relData.relationship_defs || [],
          relationship_defs_total_count: (relData.relationship_defs || []).length,
          relationship_defs_version: 1
        }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ relationship_defs: [] }));
      }
      return true;
    }

if (path === "/account/get_relationship_tree") {
      try {
        var relData = require("../../../../data/defs/relationship_defs.json");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          relationship_defs: relData.relationship_defs || [],
          tree: relData.relationship_defs || []
        }));
      } catch(e) {
        res.writeHead(200); res.end(JSON.stringify({ relationship_defs: [] }));
      }
      return true;
    }

if (path === "/account/get_daily_magic_shop") {
      try {
        var store = SkyServerStore.singleton();
        var graw = store.getString("game_config");
        var gcfg = graw ? JSON.parse(graw) : { daily_magic_shop_enabled: true };
        if (!gcfg.daily_magic_shop_enabled) {
          res.writeHead(200); res.end(JSON.stringify({ items: [] })); return true;
        }
        

        var today = Math.floor(Date.now() / 86400000);
        var allMagic = require("../../../../data/defs/consumable_defs.json");
        var list = allMagic.get_consumable_defs || [];
        var shopItems = [];
        for (var i = 0; i < 3; i++) {
          var m = list[(today * 7 + i * 13) % list.length];
          if (m) shopItems.push({ id: m.id, name: m.name, price: 5, discount: 0 });
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ items: shopItems, refresh_time: (today + 1) * 86400 }));
      } catch(e) { res.writeHead(200); res.end(JSON.stringify({ items: [] })); }
      return true;
    }

if (path === "/account/get_traveling_spirit_shop") {
      try {
        var store = SkyServerStore.singleton();
        var graw = store.getString("game_config");
        var gcfg = graw ? JSON.parse(graw) : { traveling_spirit_enabled: true };
        if (!gcfg.traveling_spirit_enabled) {
          res.writeHead(200); res.end(JSON.stringify({ items: [] })); return true;
        }
        

        var spiritId = "";
        var spiritName = "";
        try {
          var sraw = store.getString("admin_spirit");
          if (sraw) {
            var scfg = JSON.parse(sraw);
            if (scfg.spirit) { spiritId = scfg.spirit; spiritName = scfg.name || spiritId; }
          }
        } catch(e) {}
        if (!spiritId) {
          res.writeHead(200); res.end(JSON.stringify({ items: [], spirit_shops: [], spirit_id: "" })); return true;
        }
        var defs = require("../../../../data/defs/spirit_shop_defs.json");
        var all = defs.spirit_shops || [];
        var items = all.filter(s => s.spirit === spiritId);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          items: items,
          spirit_shops: items,
          departure_time: Date.now() + 86400 * 3000,
          spirit_id: spiritId
        }));
      } catch(e) { res.writeHead(200); res.end(JSON.stringify({ items: [] })); }
      return true;
    }

if (path === "/account/purchase_generic_shop_item") {
      try {
        const req = JSON.parse(body);
        const player = ServerPlayerBarn.singleton().getPlayer(req.user, req.session);
        if (!player) { res.writeHead(200); res.end(JSON.stringify({ generic_shop_purchase: "error" })); return true; }
        var cost = req.currency_count || req.cost || 0;
        var currencyType = req.currency_type || "candles";
        if (currencyType === "candles") {
          if (player.currency.candles < cost) {
            res.writeHead(200); res.end(JSON.stringify({ generic_shop_purchase: "error" })); return true;
          }
          player.currency.candles -= cost;
        }
        if (currencyType === "wax" || currencyType === "prestige") {
          if (player.currency.wax < cost) {
            res.writeHead(200); res.end(JSON.stringify({ generic_shop_purchase: "error" })); return true;
          }
          player.currency.wax -= cost;
        }
        

        try {
          var buyId = req.item_id || req.id || req.itemId || 0;
          var buyNm = req.nm || req.name || req.item_name || "";
          var allShop = (require("../../../../data/defs/spirit_shop_defs.json").spirit_shops) || [];
          var bought = allShop.find(it =>
            (buyId && String(it.id) === String(buyId)) ||
            (buyNm && it.nm === buyNm)
          );
          if (bought) {
            var unlockName = bought.nm || bought.name;
            if (unlockName) {
              var { ServerPlayerUnlockEntry } = require("../../../runtimeData/player/serverPlayerUnlocks.js");
              

              if (bought.typ === "heart") {
                player.currency.heart = (player.currency.heart || 0) + 1;
              } else if (!player.accountUnlocks.entries.has(unlockName)) {
                var e = ServerPlayerUnlockEntry.create(bought.typ || "spiritshop", unlockName, false);
                if (e) player.accountUnlocks.addUnlock(e);
              }
            }
          }
        } catch(grantErr) { console.error("[purchase] grant error:", grantErr.message); }
        player.save();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          generic_shop_purchase: "success",
          generic_shop_item_tracking_info: [],
          currency: { candles: player.currency.candles || 0, vip: 1, wax: player.currency.wax || 0, heart: player.currency.heart || 0 },
          get_consumables: []
        }));
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({ generic_shop_purchase: "error" })); }
      return true;
    }

if (path === "/account/get_friend_statues") {
      try {
        const req = JSON.parse(body);
        var uid = req.user || req.user_id;
        var fkey = "friends_" + uid;
        var raw = SkyServerStore.singleton().getString(fkey);
        var myFriends = raw ? JSON.parse(raw) : { friends: [] };
        var statues = [];
        for (var f of (myFriends.friends || [])) {
          

          var abilities = [];
          for (var i = 0; i < 84; i++) abilities.push(i);
          statues.push({
            friend_id: f.id,
            given: f.given || 1,
            nickname: f.name || f.id.substring(0, 8),
            when_created: f.added_time || Math.floor(Date.now() / 1000),
            level: 1,
            abilities: abilities,
            hints: [],
            outfit: { arms:{id:0}, attitude:"0", body:{id:3691343236}, face:{id:3599986885}, feet:{id:1532093990}, hair:{id:1229053584}, hat:{id:1470462579}, height:0, horn:{id:3680499229}, legs:{id:0}, mask:{id:3663390882}, neck:{id:3800884691}, prop:{id:2035109393}, refreshVersion:0, scale:0.069, seed:0, voice:0, wing:{id:2245279351} },
            player_badge_type: 0
          });
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ set_friend_statues: statues, constellation_friend_pages: [] }));
      } catch(e) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ set_friend_statues: [], constellation_friend_pages: [] }));
      }
      return true;
    }

if (path === "/account/auth/create") path = "/account/auth/login";

    

    if (path === "/account/chat/send") {
      try {
        const req = JSON.parse(body);
        const message = req.msg || req.message || req.text || '';
        const from = req.user || req.user_id || req.playerId || 'Unknown';
        const ch = req.ch || 'local';
        const lvl = req.lvl || '';

        console.log("[CHAT] [" + ch + (lvl?'/'+lvl:'') + "] " + from + ": " + message);

        


        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: "success", msg_id: require("crypto").randomUUID() }));
      } catch (e) {
        console.error("[CHAT] error: " + e.stack);
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: e.message }));
      }
      return true;
    }

if (path === "/account/chat/history") {
      try {
        const chatHistory = SkyServerStore.singleton().getString("chat_history");
        let history = chatHistory ? JSON.parse(chatHistory) : [];
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ messages: history.slice(-50), total: history.length }));
      } catch (e) {
        res.writeHead(200); res.end(JSON.stringify({messages:[], total:0}));
      }
      return true;
    }

if (path === "/account/get_news") {
      const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
      const barn = ServerPlayerBarn.singleton();
      var now = Math.floor(Date.now() / 1000);
      var sraw = SkyServerStore.singleton().getString("admin_season");
      var scfg = sraw ? JSON.parse(sraw) : { name: "Default Season", start_time: now, end_time: now + 86400*90 };
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        news: [{
          news_id: "1",
          news_type: 1,
          news_title: barn.motdTitle || "Welcome to Sky",
          news_body: barn.motdText || "May your journey be filled with light.",
          news_timestamp: now,
          news_version: 1,
          news_buttons: [{ label: "OK", action: "close" }],
          id: "1",
          title: barn.motdTitle || "Welcome to Sky",
          body: barn.motdText || "May your journey be filled with light.",
          timestamp: now,
          buttons: [{ label: "OK", action: "close" }],
          season_name: scfg.name || "Season",
          season_start: scfg.start_time || now,
          season_end: scfg.end_time || (now + 86400*90)
        }],
        last_updated: now,
        news_version: 1,
        motd: barn.motdText || "May your journey be filled with light.",
        motd_title: barn.motdTitle || "Welcome to Sky",
        motd_timestamp: now,
        motd_version: 410941,
        motd_buttons: [
          { url: "https://www.tiktok.com/@thatskygame", img: "Icon_tiktok" },
          { url: "https://www.youtube.com/user/thatgamecompany", img: "Icon_youtube" },
          { url: "https://www.instagram.com/thatskygame/?hl=en", img: "Icon_instagram" },
          { url: "https://www.facebook.com/thatskygame/", img: "Icon_facebook" }
        ],
        motd_season_start: scfg.start_time || now,
        motd_season_end: scfg.end_time || (now + 86400*90)
      }));
      return true;
    }

  return false;
};
