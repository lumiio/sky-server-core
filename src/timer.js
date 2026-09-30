
const { LOGI } = require("./utils/logger.js");
const { ServerPlayerBarn } = require("./runtimeData/player.js");

var serverBootTime = 0;

function playerBarnFlushTimer() {
  LOGI(serverBootTime + " minutes since server boot.");
  serverBootTime += 5;

  ServerPlayerBarn.singleton().saveLoginMethods();
  ServerPlayerBarn.singleton().savePlayers();
}

module.exports = {
  playerBarnFlushTimer
};
