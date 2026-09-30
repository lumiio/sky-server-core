

const NBT = require("parsenbt-js");
const { ISingleton } = require("../utils/helperClasses.js");
const { LevelDB } = require("emldb");
const { toArrayBuffer } = require("../utils/buffers.js");
const { SkyServerArgs } = require("../skyServerArgs.js");
const fs = require("fs");
const path = require("path");

class SkyServerStore extends ISingleton {
  static async initLDB() {
    await LevelDB.initialize();
  }

  constructor() {
    super();
    this.db = null;
    this.dbPath = "";
  }

  open(dbPath) {
    this.dbPath = dbPath;
    try {
      this.db = new LevelDB(dbPath, { createIfMissing: true });
      if (!this.db.open())
        throw new Error("open returned false");
      console.log("[DB] LevelDB opened: " + dbPath);
    } catch (e) {
      console.error("[DB] open failed: " + e.message + ", trying repair...");
      

      try {
        LevelDB.repair(dbPath);
        console.log("[DB] repair done, reopening...");
        this.db = new LevelDB(dbPath, { createIfMissing: true });
        if (!this.db.open())
          throw new Error("after repair open returned false");
        console.log("[DB] LevelDB repaired and opened successfully");
      } catch (e2) {
        console.error("[DB] repair failed: " + e2.message + ", rebuilding...");
        try {
          if (fs.existsSync(dbPath)) {
            fs.rmSync(dbPath, { recursive: true, force: true });
          }
          fs.mkdirSync(dbPath, { recursive: true });
          this.db = new LevelDB(dbPath, { createIfMissing: true });
          if (!this.db.open())
            throw new Error("rebuild open returned false");
          console.log("[DB] LevelDB rebuilt");
        } catch (e3) {
          console.error("[DB] rebuild also failed: " + e3.message + ", memory-only mode");
          this.db = null;
        }
      }
    }
  }

  get(key) {
    if (SkyServerArgs.singleton().noDB || !this.db)
      return void 0;
    try {
      return this.db.get(key);
    } catch (e) {
      return void 0;
    }
  }

  getString(key) {
    var value = this.get(key);
    if (!value)
      return void 0;

    return new TextDecoder().decode(value);
  }

  getNBT(key) {
    var value = this.get(key);
    if (!value)
      return void 0;

    return NBT.Reader(
      toArrayBuffer(value),
      { littleEndian: true, asProxy: false, asBigInt: true, asTypedArray: true });
  }

  set(key, value) {
    if (SkyServerArgs.singleton().noDB || !this.db)
      return true;
    try {
      return this.db.put(key, value);
    } catch (e) {
      console.error("[DB] put failed: " + e.message);
      return false;
    }
  }

  setNBT(key, value) {
    if (typeof value !== "object")
      return false;

    return this.set(key, new Uint8Array(NBT.Writer(
      value,
      { littleEndian: true, noCheck: true })));
  }

  delete(key) {
    if (SkyServerArgs.singleton().noDB || !this.db)
      return true;
    try {
      return this.db.delete(key);
    } catch(e) {
      return false;
    }
  }

  keys(prefix) {
    if (SkyServerArgs.singleton().noDB || !this.db)
      return [];
    var result = [];
    try {
      var it = this.db.iterator();
      while (it.valid()) {
        var k = it.key();
        var ks = typeof k === "string" ? k : new TextDecoder().decode(k);
        if (!prefix || ks.indexOf(prefix) === 0) result.push(ks);
        it.next();
      }
      it.end();
    } catch(e) {}
    return result;
  }

  close() {
    if (this.db) this.db.close();
  }
}

module.exports = {
  SkyServerStore
};
