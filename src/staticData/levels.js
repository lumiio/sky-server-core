
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");
const FNV1A = require("fnv1a");
const { LOGI } = require("../utils/logger.js");

class SkyLevelEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkyLevelEntry();

    if (typeof obj !== "object")
      return result;

    if (obj.name === "")
      return result;

    result.name = obj.name;
    result.id = FNV1A(obj.name);
    result.bundle = obj.bundle || "";
    result.realm = obj.realm || "";

    return result;
  }

  constructor() {
    super();

    this.name = "";
    this.bundle = "";
    this.realm = "";
    this.id = 0;
  }
}

class SkyLevelDefs extends ISingleton {
  constructor() {
    super();

    this.levels = new Map();
    this.names = new Map();
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || !Array.isArray(obj.level_defs))
      return;

    this.levels.clear();
    this.names.clear();

    var defs = obj.level_defs;

    for (var item of defs) {
      var entry = SkyLevelEntry.deserialize(item);

      this.levels.set(entry.id, entry);
      this.names.set(entry.name, entry);
    }

    LOGI(`SkyLevelDefs: initialized ${this.levels.size} entries from ${defs.length} entries.`);

    return this;
  }

  isValid(id) {
    return this.levels.has(id);
  }

  getLevel(id) {
    return this.levels.get(id);
  }

  getLevelWithName(name) {
    return this.names.get(name);
  }

  entries() {
    return Array.from(this.levels.values());
  }
}

module.exports = {
  SkyLevelEntry,
  SkyLevelDefs
}
