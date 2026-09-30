
const NBT = require("parsenbt-js");
const { INbtify } = require("../../utils/helperClasses.js");
const { getTimeSecond, getSecondFromMinute } = require("../../utils/chrono.js");
const { SkyBuffDefs, SkyBuffEntry } = require("../../staticData/buffs.js");

/** A single activated buff. */
class ServerPlayerBuffEntry extends INbtify {
  /**
   * Deserializes data from NBT.
   * @param {object} nbt 
   * @returns 
   */
  static deserialize(nbt) {
    var result = new ServerPlayerBuffEntry();

    if (typeof nbt !== "object")
      return result;

    result.id = (nbt["i32>id"] >>> 0) || 0;
    result.startTime = nbt["i32>start_time"] || 0;
    result.endTime = nbt["i32>end_time"] || 0;
    result.cooldownUntil = nbt["i32>cooldown_until"] || 0;
    result.giverId = nbt["str>giver_user_id"] || "";

    return result;
  }

  constructor() {
    super();

    /** Buff id. */
    this.id = 0;
    /** The time this buff has been given. */
    this.startTime = 0;
    /** The time this buff has expired. */
    this.endTime = 0;
    /** Cooldown until this time. */
    this.cooldownUntil = 0;
    /** Buff giver's uuid. */
    this.giverId = "";
  }

  /**
   * Get the buff definition.
   * @returns {SkyBuffEntry} Definition.
   */
  getBuffBase() {
    return SkyBuffDefs.singleton().getItem(this.id);
  }

  /**
   * Serialize this entry to NBT for persistent storage.
   * @returns {object}
   */
  serialize() {
    var result = NBT.create(false);

    result["i32>id"] = this.id | 0;
    result["i32>start_time"] = this.startTime;
    result["i32>end_time"] = this.endTime;
    result["i32>cooldown_until"] = this.cooldownUntil;
    result["str>giver_user_id"] = this.giverId;

    return result;
  }

  /**
   * Serialize this entry to JSON for network.
   * @returns {object}
   */
  toJSON() {
    return {
      "active_until": this.endTime,
      "buff_id": this.id,
      "cooldown_until": this.cooldownUntil,
      "giver_user_id": this.giverId
    };
  }
}

/** Player buffs. */
class ServerPlayerBuffs extends INbtify {
  static deserialize(nbt) {
    var result = new ServerPlayerBuffs();

    if (!Array.isArray(nbt) || nbt[0] !== "comp")
      return result;

    for (var i = 1; i < nbt.length; i++) {
      var entry = ServerPlayerBuffEntry.deserialize(nbt[i]);
      result.buffs.set(entry.id, entry);
    }

    return result;
  }

  constructor() {
    super();
    /** All buffs. */
    this.buffs = new Map();
  }

  /**
   * Add a buff.
   * @param {number} id - Buff id.
   * @param {string} giver - Giver's uuid.
   * @returns {ServerPlayerBuffEntry|undefined}
   */
  addBuff(id, giver) {
    if (this.buffs.has(id))
      return void 0;
    if (!SkyBuffDefs.singleton().isValid(id))
      return void 0;

    var entry = new ServerPlayerBuffEntry()
      , buff = SkyBuffDefs.singleton().getBuff(id);

    entry.id = id;
    entry.startTime = getTimeSecond();
    entry.endTime = entry.startTime + getSecondFromMinute(buff.duration);
    entry.cooldownUntil = entry.startTime + getSecondFromMinute(buff.cooldown);
    entry.giverId = giver.id;

    this.buffs.set(id, entry);

    return entry;
  }

  /**
   * Remove an existing buff.
   * @param {number} id 
   * @returns {ServerPlayerBuffEntry|undefined}
   */
  removeBuff(id) {
    if (!this.buffs.has(id))
      return void 0;
    if (!SkyBuffDefs.singleton().isValid(id))
      return void 0;

    var entry = this.buffs.get(id);

    this.buffs.delete(id);

    return entry;
  }

  serialize() {
    var result = [];
    for (var v of this.buffs.values()) {
      result.push(v.serialize());
    }
    result.unshift("comp");
    return result;
  }

  toJSON() {
    var result = [];

    for (var v of this.buffs.values())
      result.push(v.toJSON());

    return result;
  }
}

module.exports = {
  ServerPlayerBuffEntry,
  ServerPlayerBuffs
};
