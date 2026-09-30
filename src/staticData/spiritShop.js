
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");
const FNV1A = require("fnv1a");
const { LOGI } = require("../utils/logger.js");

class SkySpiritShopEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkySpiritShopEntry();

    if (typeof obj !== "object")
      return result;

    result.id = obj.id || "";
    result.name = obj.nm || "";
    result.type = obj.typ || "";
    result.spirit = obj.spirit || "";
    result.cost = obj.cst || 0;
    result.seasonPass = !!obj.ap;
    result.currrencyType = obj.ctyp || "";
    result.dependency = obj.dep || 0;
    result.trust = obj.ta || "";
    result.tier = obj.tt || 0;
    result.tierOrder = obj.to || 0;
    result.tierDep = obj.td || 0;
    result.event = obj.evn || 0;

    return result;
  }

  constructor() {
    super();

    this.id = "";
    this.name = "";
    this.type = "";
    this.spirit = "";
    this.cost = 0;
    this.seasonPass = false;
    this.currrencyType = "";
    this.dependency = 0;
    this.trust = "";
    this.tier = 0;
    this.tierOrder = 0;
    this.tierDep = 0;
    this.event = 0;
  }

  serialize() {
    var out = {
      "id": this.id,
      "nm": this.name,
      "typ": this.type,
      "spirit": this.spirit,
      "cst": this.cost,
      "ap": this.seasonPass,
      "ctyp": this.currrencyType,
      "dep": this.dependency,
      "ta": this.trust
    };
    if (this.tier) out["tt"] = this.tier;
    if (this.tierOrder) out["to"] = this.tierOrder;
    if (this.tierDep) out["td"] = this.tierDep;
    if (this.event) out["evn"] = this.event;
    return out;
  }
}

class SkySpiritShopDefs extends ISingleton {
  constructor() {
    super();

    this.spiritShops = new Map();
    this.names = new Map();

    this.dirtyMark = false;
    this.jsonData = [];
  }

  dirty() {
    this.dirtyMark = true;
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || !Array.isArray(obj.spirit_shops))
      return;

    this.dirty();

    this.spiritShops.clear();
    this.names.clear();

    var defs = obj.spirit_shops;

    for (var item of defs) {
      var entry = SkySpiritShopEntry.deserialize(item);

      if (entry.id != FNV1A(entry.name))
        // Invalid entry.
        continue;

      this.spiritShops.set(entry.id, entry);
      this.names.set(entry.name, entry);
    }

    // TODO: Add validation for dependency tree.

    LOGI(`SkySpiritShopDefs: initialized ${this.spiritShops.size} entries from ${defs.length} entries.`);

    return this;
  }

  getItem(id) {
    return this.spiritShops.get(id);
  }

  getItemWithName(name) {
    return this.names.get(name);
  }

  toJSON() {
    if (!this.dirtyMark)
      return this.jsonData;

    var result = [];

    for (var v of this.spiritShops.values())
      result.push(v.serialize());

    this.jsonData = result;
    this.dirtyMark = false;

    return result;
  }
}

module.exports = {
  SkySpiritShopEntry,
  SkySpiritShopDefs
};
