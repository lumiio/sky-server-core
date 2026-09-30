// ============================================================


// ============================================================
const { SkyServerStore } = require("../runtimeData/db.js");

    function getQuestData(playerId) {
      const raw = SkyServerStore.singleton().getString("quests_" + playerId);
      return raw ? JSON.parse(raw) : { quests: [] };
    }

    function saveQuestData(playerId, data) {
      SkyServerStore.singleton().set("quests_" + playerId, JSON.stringify(data));
    }

module.exports = { getQuestData, saveQuestData };
