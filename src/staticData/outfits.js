
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");
const FNV1A = require("fnv1a");
const { LOGI } = require("../utils/logger.js");

class SkyOutfitEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkyOutfitEntry();

    if (typeof obj !== "object")
      return result;

    if (obj.name === "")
      return result;

    result.name = obj.name;
    result.id = FNV1A(obj.name);
    result.slot = obj.type || "";

    return result;
  }

  constructor() {
    super();

    // Outfit data is client authoritive, so the server only cares about the
    // name and id.
    this.name = "";
    this.id = 0;

    // Outfit slot.
    this.slot = "";
  }
}

class SkyOutfitDefs extends ISingleton {
  constructor() {
    super();

    this.outfits = new Map();
    this.names = new Map();
  }

  initWithJson(defs) {
    if (typeof defs !== "object" || !Array.isArray(defs))
      return;

    this.outfits.clear();
    this.names.clear();

    for (var item of defs) {
      var entry = SkyOutfitEntry.deserialize(item);

      if (entry.id != FNV1A(entry.name))
        // Invalid entry.
        continue;

      this.outfits.set(entry.id, entry);
      this.names.set(entry.name, entry);
    }

    LOGI(`SkyOutfitDefs: initialized ${this.outfits.size} entries from ${defs.length} entries.`);

    return this;
  }

  isValid(id) {
    return this.outfits.has(id);
  }

  getOutfit(id) {
    return this.outfits.get(id);
  }

  getOutfitWithName(name) {
    return this.names.get(name);
  }

  entries() {
    return Array.from(this.outfits.values());
  }
}

module.exports = {
  SkyOutfitEntry,
  SkyOutfitDefs
};
