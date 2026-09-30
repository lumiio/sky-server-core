
const NBT = require("parsenbt-js");
const { INbtify } = require("../../utils/helperClasses.js");
const { SkyConsumableDefs, SkyConsumableEntry } = require("../../staticData/consumables.js");

/** Single stack of items. */
class ServerPlayerConsumableEntry extends INbtify {
  static deserialize(nbt) {
    var result = new ServerPlayerConsumableEntry();

    if (typeof nbt !== "object")
      return result;

    // Convert the id to u32.
    result.id = nbt["i32>consumable_id"] >>> 0;
    result.count = nbt["i32>quantity"];
    result.cooldownUntil = nbt["i32>cooldown_until"];

    return result;
  }

  constructor(id, count) {
    super();

    this.id = id || 0;
    this.count = count || 0;
    this.cooldownUntil = 0;
  }

  /**
   * Get the buff definition.
   * @returns {SkyConsumableEntry} Definition.
   */
  getItemBase() {
    return SkyConsumableDefs.singleton().getItem(this.id);
  }

  serialize() {
    var result = NBT.create(false);

    // Convert the id to i32.
    result["i32>consumable_id"] = this.id | 0;
    result["i32>quantity"] = this.count;
    result["i32>cooldown_until"] = this.cooldownUntil;

    return result;
  }

  toJSON() {
    return {
      "consumable_id": this.id,
      "cooldown_until": this.cooldownUntil,
      "quantity": this.count
    }
  }
}

/** Consumable items of a player. */
class ServerPlayerConsumables extends INbtify {
  static deserialize(nbt) {
    var result = new ServerPlayerConsumables();

    if (!Array.isArray(nbt) || nbt[0] !== "comp")
      return result;

    for (var i = 1; i < nbt.length; i++) {
      var entry = ServerPlayerConsumableEntry.deserialize(nbt[i]);
      result.items.set(entry.id, entry);
    }

    return result;
  }

  constructor() {
    super();
    this.items = new Map();
  }

  /**
   * Add items.
   * @param {number} id 
   * @param {number} count 
   * @returns {ServerPlayerConsumableEntry}
   */
  giveConsumable(id, count) {
    if (!SkyConsumableDefs.singleton().isValid(id))
      return void 0;

    if (typeof count !== "number" || count <= 0)
      count = 1;

    if (!this.items.has(id)) {
      var entry = new ServerPlayerConsumableEntry(id, count);
      this.items.set(id, entry);
    } else {
      var entry = this.items.get(id);
      entry.count += count;
    }

    return entry;
  }

  /**
   * Remove items.
   * @param {number} id 
   * @param {number} [count] 
   * @returns {ServerPlayerConsumableEntry}
   */
  clearConsumable(id, count) {
    if (!SkyConsumableDefs.singleton().isValid(id))
      return void 0;

    if (!this.items.has(id))
      return void 0;

    var entry = this.items.get(id);

    if (typeof count !== "number")
      count = entry.count;

    entry.count -= count;

    if (entry.count <= 0)
      this.items.delete(id);

    return entry;
  }

  serialize() {
    var result = [];
    for (var v of this.items.values()) {
      result.push(v.serialize());
    }
    result.unshift("comp");
    return result;
  }

  toJSON() {
    var result = [];

    for (var v of this.items.values())
      result.push(v.toJSON());

    return result;
  }
}

module.exports = {
  ServerPlayerConsumableEntry,
  ServerPlayerConsumables
};
