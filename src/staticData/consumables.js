
const FNV1A = require("fnv1a");
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");
const { LOGI } = require("../utils/logger.js");

class SkyConsumableEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkyConsumableEntry();

    if (typeof obj !== "object")
      return result;

    result.id = obj.id || 0;
    result.isToy = obj.is_toy || false;
    result.buffId = obj.buff_id || 0;
    result.cooldown = obj.cooldown || 0;
    result.event = obj.event || "";
    result.icon = obj.icon || "";
    result.name = obj.name || "";
    result.param = obj.param || "";
    result.type = obj.type || "";

    return result;
  }

  constructor() {
    super();
    // Id.
    this.id = -1;
    // Is a placeable toy.
    this.isToy = false;
    // Related buff id.
    this.buffId = -1;
    // Cooldown time (second).
    this.cooldown = 0;
    // Client event.
    this.event = "none";
    // Icon.
    this.icon = "";
    // Buff name.
    this.name = "";
    // Param.
    this.param = "";
    // Type.
    this.type = "";
  }

  serialize() {
    return {
      "buff_id": this.buffId,
      "cooldown": this.cooldown,
      "event": this.event,
      "icon": this.icon,
      "id": this.id,
      "is_toy": this.isToy,
      "name": this.name,
      "param": this.param,
      "type": this.type
    };
  }
}

class SkyConsumableDefs extends ISingleton {
  constructor() {
    super();

    this.items = new Map();
    this.names = new Map();

    this.dirtyMark = false;
    this.jsonData = [];
  }

  dirty() {
    this.dirtyMark = true;
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || !Array.isArray(obj.get_consumable_defs))
      return;

    this.dirty();

    this.items.clear();
    this.names.clear();

    var defs = obj.get_consumable_defs;

    for (var item of defs) {
      var entry = SkyConsumableEntry.deserialize(item);

      if (entry.id != FNV1A(entry.name))
        // Invalid entry.
        continue;

      this.items.set(entry.id, entry);
      this.names.set(entry.name, entry);
    }

    LOGI(`SkyConsumableDefs: initialized ${this.items.size} entries from ${defs.length} entries.`);

    return this;
  }

  isValid(id) {
    if (id < 0)
      return false;
    return this.items.has(id);
  }

  isNameValid(name) {
    return this.names.has(name);
  }

  getItem(id) {
    if (!this.isValid(id))
      return void 0;
    return this.items.get(id);
  }

  getItemWithName(name) {
    if (!this.isNameValid(name))
      return void 0;
    return this.names.get(name);
  }

  toJSON() {
    if (!this.dirtyMark)
      return this.jsonData;

    var result = [];

    for (var v of this.items.values())
      result.push(v.serialize());

    this.jsonData = result;
    this.dirtyMark = false;

    return result;
  }
}

module.exports = {
  SkyConsumableEntry,
  SkyConsumableDefs
};
