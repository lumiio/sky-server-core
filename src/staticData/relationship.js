
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");
const { LOGI } = require("../utils/logger.js");

class SkyRelationshipEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkyRelationshipEntry();

    if (typeof obj !== "object")
      return result;

    result.ability = obj.ability || "";
    result.anim = obj.anim || "";
    result.anims = obj.anims || [];
    result.controller = obj.controller || "";
    result.cost = obj.cost || 0;
    result.currencyType = obj.currency_type || "";
    result.enabled = obj.enabled || false;
    result.event = obj.event || "";
    result.giftingHint = obj.gifting_hint || "";
    result.giveAlso = obj.give_also || [];
    result.icon = obj.icon || "";
    result.iconHint = obj.icon_hint || "";
    result.iconLocked = obj.icon_locked || "";
    result.id = obj.id || 0;
    result.listed = obj.listed || false;
    result.permanent = obj.permanent || false;
    result.preReqs = obj.pre_reqs || false;
    result.rewardAmount = obj.reward_amount || 0;
    result.rewardType = obj.reward_type || "";
    result.scheduledEvent = obj.scheduled_event || "";
    result.tier = obj.tier || 0;
    result.trustActivity = obj.trust_activity || "";
    result.trustDependency = obj.trust_dependency || "";
    result.trustOrder = obj.trust_order || 0;
    result.trustTier = obj.trust_tier || 0;
    result.unwrapHint = obj.unwrap_hint || "";
    result.x = obj.x || 0;
    result.y = obj.y || 0;

    return result;
  }

  constructor() {
    super();

    this.ability = "";
    this.anim = "";
    this.anims = [];
    this.controller = "";
    this.cost = 0;
    this.currencyType = "";
    this.enabled = false;
    this.event = "";
    this.giftingHint = "";
    this.giveAlso = [];
    this.icon = "";
    this.iconHint = "";
    this.iconLocked = "";
    this.id = 0;
    this.listed = false;
    this.permanent = false;
    this.preReqs = [];
    this.rewardAmount = 0;
    this.rewardType = "";
    this.scheduledEvent = "";
    this.tier = 0;
    this.trustActivity = "";
    this.trustDependency = "";
    this.trustOrder = 0;
    this.trustTier = 0;
    this.unwrapHint = "";
    this.x = 0;
    this.y = 0;
  }

  serialize() {
    return {
      "ability": this.ability,
      "anim": this.anim,
      "anims": this.anims,
      "controller": this.controller,
      "cost": this.cost,
      "currency_type": this.currencyType,
      "enabled": this.enabled,
      "event": this.event,
      "gifting_hint": this.giftingHint,
      "give_also": this.giveAlso,
      "icon": this.icon,
      "icon_hint": this.iconHint,
      "icon_locked": this.iconLocked,
      "id": this.id,
      "listed": this.listed,
      "permanent": this.permanent,
      "pre_reqs": this.preReqs,
      "reward_amount": this.rewardAmount,
      "reward_type": this.rewardType,
      "scheduled_event": this.scheduledEvent,
      "tier": this.tier,
      "trust_activity": this.trustActivity,
      "trust_dependency": this.trustDependency,
      "trust_order": this.trustOrder,
      "trust_tier": this.trustTier,
      "unwrap_hint": this.unwrapHint,
      "x": this.x,
      "y": this.y
    };
  }
}

class SkyRelationshipDefs extends ISingleton {
  constructor() {
    super();

    this.relationAbilities = new Map();

    this.dirtyMark = false;
    this.jsonData = [];
  }

  dirty() {
    this.dirtyMark = true;
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || !Array.isArray(obj.relationship_defs))
      return;

    var defs = obj.relationship_defs;

    this.relationAbilities.clear();

    for (var item of defs) {
      var entry = SkyRelationshipEntry.deserialize(item);

      if (!entry.id)
        // Invalid entry.
        continue;

      this.relationAbilities.set(entry.id, entry);
    }

    LOGI(`SkyRelationshipDefs: initialized ${this.relationAbilities.size} entries from ${defs.length} entries.`);

    this.dirty();

    return this;
  }

  isValid(id) {
    return this.relationAbilities.has(id);
  }

  getRelation(id) {
    return this.relationAbilities.get(id);
  }

  toJSON() {
    if (!this.dirtyMark)
      return this.jsonData;

    var result = [];

    for (var v of this.relationAbilities.values())
      result.push(v.serialize());

    this.jsonData = result;
    this.dirtyMark = false;

    return result;
  }
}

module.exports = {
  SkyRelationEntry: SkyRelationshipEntry,
  SkyRelationDefs: SkyRelationshipDefs
};
