

const fs = require("fs")
  , pl = require("path");

const PATHS = {};

function createFolderSafe(path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code == "EEXIST")
      return;
    throw e;
  }
}

function initDataFolders(base) {
  const DATA_PATH = pl.join(base, "data")
    , DEFS_PATH = pl.join(DATA_PATH, "defs")
    , GAME_PATH = pl.join(base, "game")
    , GAME_DB_PATH = pl.join(GAME_PATH, "db");

  createFolderSafe(GAME_PATH);
  createFolderSafe(GAME_DB_PATH);

  PATHS.data = DATA_PATH;
  PATHS.vars = pl.join(DATA_PATH, "vars.json");
  PATHS.eventSchedules = pl.join(DATA_PATH, "event_schedules.json");
  PATHS.defs = {
    consumable: pl.join(DEFS_PATH, "consumable_defs.json"),
    buff: pl.join(DEFS_PATH, "buff_defs.json"),
    quest: pl.join(DEFS_PATH, "quest_defs.json"),
    outfit: pl.join(DEFS_PATH, "outfit_defs.json"),
    spiritShop: pl.join(DEFS_PATH, "spirit_shop_defs.json"),
    relationship: pl.join(DEFS_PATH, "relationship_defs.json"),
    level: pl.join(DEFS_PATH, "level_defs.json"),
  };
  PATHS.game = GAME_PATH;
  PATHS.db = GAME_DB_PATH;

  Object.freeze(PATHS);
}

module.exports = {
  initDataFolders,
  PATHS
};
