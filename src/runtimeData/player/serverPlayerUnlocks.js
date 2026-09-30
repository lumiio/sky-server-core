
const NBT = require("parsenbt-js");
const { getTimeSecond } = require("../../utils/chrono.js");
const { INbtify } = require("../../utils/helperClasses.js");
const { SkyOutfitEntry } = require("../../staticData/outfits.js");
const { SkySpiritShopDefs } = require("../../staticData/spiritShop.js");

class ServerPlayerUnlockEntry extends INbtify {
  static deserialize(nbt) {
    var result = new ServerPlayerUnlockEntry();

    if (typeof nbt !== "object")
      return result;

    result.ack = !!nbt["i8>ack"];
    result.name = nbt["str>name"] || "";
    result.type = nbt["str>type"] || "";
    result.unlockTime = nbt["i32>unlock_time"] || 0;

    return result;
  }

  static create(type, name, ack, time) {
    var result = new ServerPlayerUnlockEntry();

    result.name = name;
    result.type = type;
    result.ack = ack;
    result.unlockTime = time || getTimeSecond();

    return result;
  }

  /**
   * Defaults for service (status) unlocks.
   * @param {string} level - Unlock name.
   * @param {boolean} [ack] - Acknowledge flag.
   * @param {number} [time] - Unlock time.
   * @returns 
   */
  static createLevelUnlock(level, ack, time) {
    var result = new ServerPlayerUnlockEntry();

    // TODO: Verify the level name.
    result.name = level;
    result.ack = !!ack;
    result.type = "level";
    result.unlockTime = time || getTimeSecond();

    return result;
  }

  /**
   * Defaults for account unlocks.
   * @param {string|number} spirit - Unlock name.
   * @param {boolean} [ack] - Acknowledge flag.
   * @param {number} [time] - Unlock time.
   * @returns 
   */
  static createSpiritUnlock(spirit, ack, time) {
    var result = new ServerPlayerUnlockEntry()
      , base;

    if (typeof spirit === "string")
      base = SkySpiritShopDefs.singleton().getItemWithName(spirit);
    else
      base = SkySpiritShopDefs.singleton().getItem(spirit);

    if (!base)
      return null;

    result.ack = !!ack;
    result.name = base.name;
    result.type = "spiritshop";
    result.unlockTime = time || getTimeSecond();

    return result;
  }

  /**
   * Outfit unlock's type maybe "level" or "spiritshop".
   * @param {SkyOutfitEntry} outfit - Outfit def.
   * @param {number} [time] - Unlock time. 
   * @returns 
   */
  static createOutfitUnlock(outfit, time) {
    var result = new ServerPlayerUnlockEntry();

    result.name = outfit.name;
    result.type = "spiritshop";

    if (outfit.name.indexOf("_AP"))
      result.type = "level";

    result.unlockTime = time || getTimeSecond();

    return result;
  }

  constructor() {
    super();

    this.ack = false;
    this.type = "";
    this.name = "";
    this.unlockTime = 0;
  }

  isValid() {
    return ["spiritshop", "level", "season"].indexOf(this.type) != -1;
  }

  serialize() {
    var result = NBT.create(false);

    result["i8>ack"] = this.ack;
    result["str>name"] = this.name;
    result["str>type"] = this.type;
    result["i32>unlock_time"] = this.unlockTime;

    return result;
  }

  toJSON() {
    return {
      "ack": this.ack,
      "name": this.name,
      "type": this.type,
      "unlocked_at": this.unlockTime,
      "created_at": this.unlockTime
    };
  }
}

class ServerPlayerUnlocks extends INbtify {
  static deserialize(nbt) {
    var result = new ServerPlayerUnlocks();

    if (!Array.isArray(nbt) || nbt[0] !== "comp")
      return result;

    for (var i = 1; i < nbt.length; i++) {
      var entry = ServerPlayerUnlockEntry.deserialize(nbt[i]);
      result.entries.set(entry.name, entry);
    }

    result.dirtyFlag = true;

    return result;
  }

  constructor() {
    super();

    this.entries = new Map();

    this.dirtyFlag = false;
    this.data = [];
  }

  /**
   * Update cached data.
   */
  update() {
    this.dirtyFlag = false;
    this.data = Array.from(this.entries.values());
  }

  /**
   * Return a slice of the entries.
   * @param {number} offset 
   * @param {number} limit 
   * @returns {{data:ServerPlayerUnlockEntry[],count:number}}
   */
  pagination(offset, limit) {
    if (this.dirtyFlag && !offset)
      // Update only on first request.
      this.update();

    if (!limit)
      limit = this.data.length; // limit=0 means return all

    return {
      data: this.data.slice(offset, offset + limit),
      count: this.data.length
    };
  }

  /**
   * Check the dependency of the given entry.
   * @param {ServerPlayerUnlockEntry} entry 
   * @returns {boolean}
   */
  canUnlockSpirit(entry) {
    if (entry.type !== "spirit")
      return true;

    var base = SkySpiritShopDefs.singleton().getItemWithName(entry.name);
    if (!base)
      return false;

    if (!base.dependency)
      return true;

    var dep = SkySpiritShopDefs.singleton().getItem(base.dependency);
    if (!dep)
      return true;

    return this.hasUnlock(dep.name);
  }

  /**
   * Add a single unlock. If the same name is added for multiple times, only
   * the latest addition is stored.
   * @param {ServerPlayerUnlockEntry} entry 
   * @returns {ServerPlayerUnlockEntry|undefined}
   */
  addUnlock(entry) {
    this.dirtyFlag = true;
    this.entries.set(entry.name, entry);
    return entry;
  }

  /**
   * Acknowledge an unlock.
   * @param {string} name 
   * @returns {ServerPlayerUnlockEntry|undefined}
   */
  ackUnlock(name) {
    var entry = this.entries.get(name);
    if (!entry)
      return void 0;
    entry.ack = true;
    return entry;
  }

  /**
   * Remove an unlock.
   * @param {string} name  
   * @returns {ServerPlayerUnlockEntry|undefined}
   */
  removeUnlock(name) {
    var entry = this.entries.get(name);
    if (!entry)
      return void 0;
    this.entries.delete(name);
    return entry;
  }

  /**
   * Check an unlock.
   * @param {number|string} identifier 
   * @returns {boolean}
   */
  hasUnlock(identifier) {
    if (typeof identifier === "string")
      return this.entries.has(identifier);

    var base = SkySpiritShopDefs.singleton().getItem(identifier);
    if (!base)
      return false;

    return this.entries.has(base.name);
  }

  serialize() {
    var result = Array.from(this.entries.values()).map(value => value.serialize());
    result.unshift("comp");
    return result;
  }

  toJSON() {
    return this.entries;
  }
}

module.exports = {
  ServerPlayerUnlockEntry,
  ServerPlayerUnlocks,
};
