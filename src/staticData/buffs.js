
const FNV1A = require("fnv1a");
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");
const { LOGI } = require("../utils/logger.js");

class SkyBuffEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkyBuffEntry();

    if (typeof obj !== "object")
      return result;

    result.auraDist = obj.aura_dist || 0.0;
    result.cancelCooldown = obj.aura_dist || 0.0;
    result.clientEventNames = obj.client_event_names || [];
    result.clientLevelNames = obj.client_level_names || [];
    result.cooldown = obj.cooldown || 0.0;
    result.dependBuffs = obj.depend_buffs || [];
    result.disableFx = obj.disable_fx || false;
    result.disableIcon = obj.disable_con || false;
    result.duration = obj.duration || 20.0;
    result.effect = obj.effect || "";
    result.event = obj.event || "none";
    result.fxType = obj.fx_type || "";
    result.icon = obj.icon || "";
    result.id = obj.id || -1;
    result.isAura = obj.is_aura || false;
    result.isRemovable = obj.is_removable || true;
    result.isStackable = obj.is_stackable || false;
    result.multiplier = obj.multiplier || 1.0;
    result.name = obj.name || "";
    result.params = obj.params || [];
    result.recipientType = obj.recipient_type || "local";

    return result;
  }

  constructor() {
    super();

    this.auraDist = 0.0;
    this.cancelCooldown = 0.0;
    this.clientEventNames = [];
    this.clientLevelNames = [];
    this.cooldown = 0.0;
    this.dependBuffs = [];
    this.disableFx = false;
    this.disableIcon = false;
    this.duration = 20.0;
    this.effect = "";
    this.event = "none";
    this.fxType = "";
    this.icon = "";
    this.id = -1;
    this.isAura = false;
    this.isRemovable = true;
    this.isStackable = false;
    this.multiplier = 1.0;
    this.name = "";
    this.params = [];
    this.recipientType = "local";
  }

  serialize() {
    return {
      "aura_dist": this.auraDist,
      "cancel_cooldown": this.cancelCooldown,
      "client_event_names": this.clientEventNames.length
        ? this.clientEventNames
        : null,
      "client_level_names": this.clientLevelNames.length
        ? this.clientLevelNames
        : null,
      "cooldown": this.cooldown,
      "depend_buffs": this.dependBuffs,
      "disable_fx": this.disableFx,
      "disable_icon": this.disableIcon,
      "duration": this.duration,
      "effect": this.effect,
      "event": this.event,
      "fx_type": this.fxType,
      "icon": this.icon,
      "id": this.id,
      "is_aura": this.isAura,
      "is_removable": this.isRemovable,
      "is_stackable": this.isStackable,
      "multiplier": this.multiplier,
      "name": this.name,
      "params": this.params,
      "recipient_type": this.recipientType
    }
  }
}

class SkyBuffDefs extends ISingleton {
  constructor() {
    super();

    this.buffs = new Map();
    this.names = new Map();

    this.dirtyMark = false;
    this.jsonData = [];
  }

  dirty() {
    this.dirtyMark = true;
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || !Array.isArray(obj.get_buff_defs))
      return;

    this.dirty();
    this.buffs.clear();
    this.names.clear();

    var defs = obj.get_buff_defs;

    for (var buff of defs) {
      var entry = SkyBuffEntry.deserialize(buff);

      if (entry.id != FNV1A(entry.name))
        // Invalid entry.
        continue;

      this.buffs.set(entry.id, entry);
      this.names.set(entry.name, entry);
    }

    LOGI(`SkyBuffDefs: initialized ${this.buffs.size} entries from ${defs.length} entries.`);

    return this;
  }

  isValid(id) {
    return this.buffs.has(id);
  }

  getBuff(id) {
    return this.buffs.get(id);
  }

  getBuffWithName(name) {
    return this.names.get(name);
  }

  toJSON() {
    if (!this.dirtyMark)
      return this.jsonData;

    var result = [];

    

    

    for (var v of this.buffs.values())
      result.push(v.serialize());

    this.jsonData = result;
    this.dirtyMark = false;

    return result;
  }
}

module.exports = {
  SkyBuffEntry,
  SkyBuffDefs
};
