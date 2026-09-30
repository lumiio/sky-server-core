
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");
const { LOGI } = require("../utils/logger.js");

class SkyQuestEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkyQuestEntry();

    if (typeof obj !== "object")
      return result;

    result.id = obj.id || "";
    result.icon = obj.icon || "";
    result.npc = obj.npc || "";
    result.landmark = obj.landmark || "";
    result.requiresQuestgiver = obj.requires_questgiver || false;
    result.rewardId = obj.reward_id || "";
    result.prereqQuests = obj.prereq_quests || [];
    result.completionQuests = obj.completion_quests || [];
    result.completionStatsTypes = obj.completion_stats_types || [];
    result.completionStatsValues = obj.completion_stats_values || [];
    result.completionWorldquests = obj.completion_worldquests || [];
    result.repeatable = obj.repeatable || true;
    result.trustActivity = obj.trust_activity || "";
    result.completionType = obj.completion_type || "";
    result.repeatCooldownSeconds = obj.repeat_cooldown_seconds || 0;
    result.prereqInventoryUnlocks = obj.prereq_inventory_unlocks || [];
    result.scheduledEvent = obj.scheduled_event || "";
    result.requiresManualCompletion = obj.requires_manual_completion || false;

    return result;
  }

  constructor() {
    super();

    this.id = "";
    this.icon = "";
    this.npc = "";
    this.landmark = "";
    this.requiresQuestgiver = false;
    this.rewardId = "";
    this.prereqQuests = [];
    this.completionQuests = [];
    this.completionStatsTypes = [];
    this.completionStatsValues = [];
    this.completionWorldquests = [];
    this.repeatable = true;
    this.trustActivity = "";
    this.completionType = "";
    this.repeatCooldownSeconds = 0;
    this.prereqInventoryUnlocks = [];
    this.scheduledEvent = "";
    this.requiresManualCompletion = false;
  }

  serialize() {
    return {
      "id": this.id,
      "icon": this.icon,
      "npc": this.npc,
      "landmark": this.landmark,
      "requires_questgiver": this.requiresQuestgiver,
      "reward_id": this.rewardId,
      "prereq_quests": this.prereqQuests,
      "completion_quests": this.completionQuests,
      "completion_stats_types": this.completionStatsTypes,
      "completion_stats_values": this.completionStatsValues,
      "completion_worldquests": this.completionWorldquests,
      "repeatable": this.repeatable,
      "trust_activity": this.trustActivity,
      "completion_type": this.completionType,
      "repeat_cooldown_seconds": this.repeatCooldownSeconds,
      "prereq_inventory_unlocks": this.prereqInventoryUnlocks,
      "scheduled_event": this.scheduledEvent,
      "requires_manual_completion": this.requiresManualCompletion
    }
  }
}

class SkyQuestDefs extends ISingleton {
  constructor() {
    super();

    this.quests = new Map();

    this.dirtyMark = false;
    this.jsonData = [];
  }

  dirty() {
    this.dirtyMark = true;
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || !Array.isArray(obj.get_quest_defs))
      return;

    this.dirty();

    this.quests.clear();

    var defs = obj.get_quest_defs;

    for (var item of defs) {
      var entry = SkyQuestEntry.deserialize(item);

      if (entry.id === "")
        continue;

      this.quests.set(entry.id, entry);
    }

    LOGI(`SkyQuestDefs: initialized ${this.quests.size} entries from ${defs.length} entries.`);

    return this;
  }

  toJSON() {
    if (!this.dirtyMark)
      return this.jsonData;

    var result = [];

    for (var v of this.quests.values())
      result.push(v.serialize());

    this.jsonData = result;
    this.dirtyMark = false;

    return result;
  }
}

module.exports = {
  SkyQuestEntry,
  SkyQuestDefs
};
