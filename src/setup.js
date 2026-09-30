

const fs = require("fs")
  , arg = require("arg");  

const { LOGI, LOGW } = require("./utils/logger.js");



const { PATHS } = require("./runtimeData/folders.js")



const { SkyConsumableDefs } = require("./staticData/consumables.js");    

const { SkyBuffDefs } = require("./staticData/buffs.js");               

const { SkyOutfitDefs } = require("./staticData/outfits.js");           

const { SkyQuestDefs } = require("./staticData/quests.js");             

const { SkySpiritShopDefs } = require("./staticData/spiritShop.js");    

const { SkyRelationDefs } = require("./staticData/relationship.js");   

const { SkyVars } = require("./staticData/vars.js");                    

const { SkyEventSchedule } = require("./staticData/eventSchedule.js");  

const { SkyServerArgs } = require("./skyServerArgs.js");                

const { SkyServerTimer } = require("./runtimeData/skyServerTimer.js"); 

const { playerBarnFlushTimer } = require("./timer.js");                 

const { SkyLevelDefs } = require("./staticData/levels.js");             



function setupServerArgs() {
  var args = arg({
    "--port": Number,
    "--no-log-requests": Boolean,
    "--DEBUG-no-db": Boolean,
    "--DEBUG-always-new-user": Boolean,

    "-p": "--port"  

  }, {
    permissive: true  

  });
  SkyServerArgs.singleton().fromArgs(args);  

}


function setupStaticData() {
  

  SkyVars.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.vars, "utf-8")));

  

  SkyEventSchedule.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.eventSchedules, "utf-8")));

  

  // SkyQuestDefs.singleton().initWithJson(
  //   JSON.parse(fs.readFileSync(PATHS.defs.quest, "utf-8")));

  

  SkyConsumableDefs.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.defs.consumable, "utf-8")));

  

  SkyBuffDefs.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.defs.buff, "utf-8")));

  

  SkyOutfitDefs.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.defs.outfit, "utf-8")));

  

  SkySpiritShopDefs.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.defs.spiritShop, "utf-8")));

  

  SkyRelationDefs.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.defs.relationship, "utf-8")));

  

  SkyLevelDefs.singleton().initWithJson(
    JSON.parse(fs.readFileSync(PATHS.defs.level, "utf-8")));
}


function setupTimers() {
  SkyServerTimer.singleton().every(
    5 * 60,        

    playerBarnFlushTimer  

  );
  

  SkyServerTimer.singleton().every(
    24 * 60 * 60,  

    function() {
      try {
        const store = require("./runtimeData/db.js").SkyServerStore.singleton();
        const barn = require("./runtimeData/player.js").ServerPlayerBarn.singleton();
        const now = Date.now();
        const TWO_DAYS = 2 * 86400000;
        let deleted = 0;
        const it = store.db.iterator();
          while (it.valid()) {
            try {
              var k = it.key();
              var key = typeof k === "string" ? k : new TextDecoder().decode(k);
              if (key.startsWith("lastseen_")) {
                var pid = key.substring(9);
                var v = it.value();
                var ts = parseInt(typeof v === "string" ? v : new TextDecoder().decode(v));
                if (!barn.players[pid] && now - ts > TWO_DAYS) {
                  store.db.del("player:" + pid);
                  store.db.del(key);
                  deleted++;
                }
              }
            } catch(e) {}
            it.next();
        }
        LOGI("Cleanup: deleted " + deleted + " offline players (2 days inactive)");
      } catch(e) {
        LOGI("Cleanup error: " + e.message);
      }
    }
  );
}



module.exports = {
  setupStaticData,
  setupServerArgs,
  setupTimers
};
