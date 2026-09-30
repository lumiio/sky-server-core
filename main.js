



const ps = require("process");



try { ps.stdout._handle && ps.stdout._handle.setBlocking(false); } catch (e) {}
try { ps.stderr._handle && ps.stderr._handle.setBlocking(false); } catch (e) {}





const { initDataFolders, PATHS } = require("./src/runtimeData/folders.js");







const { LOGI, printLogo } = require("./src/utils/logger.js");





const { SkyNetworkTcp } = require("./src/requests/skyNetworkTcp.js");





const { SkyServerStore } = require("./src/runtimeData/db.js");





const { ServerPlayerBarn } = require("./src/runtimeData/player.js");





const { SkyServerConsole } = require("./src/commands/skyServerConsole.js");









const { setupStaticData, setupServerArgs, setupTimers } = require("./src/setup.js");





const { SkyServerArgs } = require("./src/skyServerArgs.js");

// ============================================================


// ============================================================
const MEMORY_LIMIT_MB = 1500;   

const CHECK_INTERVAL_MS = 60000; 


setInterval(() => {
  const usedMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (usedMB > MEMORY_LIMIT_MB) {
    LOGI(`[MEM] heap ${usedMB.toFixed(1)}MB exceeds threshold ${MEMORY_LIMIT_MB}MB, triggering GC...`);
    if (global.gc) {
      global.gc();
      const afterMB = process.memoryUsage().heapUsed / 1024 / 1024;
      LOGI(`[MEM] after GC ${afterMB.toFixed(1)}MB, freed ${(usedMB - afterMB).toFixed(1)}MB`);
    } else {
      LOGI(`[MEM] start with --expose-gc to enable manual GC`);
    }
  }
}, CHECK_INTERVAL_MS);



process.on("uncaughtException", (err) => {
  console.error("[SAFETY] Uncaught exception (server stays up):", err && err.stack ? err.stack : err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[SAFETY] Unhandled promise rejection (server stays up):", reason);
});


async function main() {
  

  printLogo();

  

  console.log("".padStart(80, "-"));
  console.log("  That Sky Server Example");
  console.log("  A simple Sky:CotL server.");
  console.log("  Copyright (c) 2026 HTMonkeyG");
  console.log("  All rights reserved.");
  console.log("".padStart(80, "-"));

  

  console.log("Please change your game to http mode when using this server.\n");

  

  LOGI("Initializing server...");

  

  

  setupServerArgs();

  

  

  await SkyServerStore.initLDB();

  

  

  

  initDataFolders(__dirname);

  

  

  

  setupStaticData();

  

  

  SkyServerStore.singleton().open(PATHS.db);

  

  

  ServerPlayerBarn.singleton().loadAdminData();

  

  

  SkyServerConsole.singleton().start();

  

  LOGI("Starting server...");

  

  

  setupTimers();

  

  var port = SkyServerArgs.singleton().tcpPort;
  SkyNetworkTcp.singleton().init(port);
  SkyNetworkTcp.singleton().run();

  

  

  

  // require("./src/packets/skyNetworkUdp.js");
  

}



main();





ps.on("SIGINT", function () {
  

  LOGI("keyboard interrupt recieved.");
  

  ps.exit(0);
});





ps.on("exit", function () {
  

  LOGI("shutting down server...");
  

  SkyNetworkTcp.singleton().stop();
  

  ServerPlayerBarn.singleton().saveLoginMethods();
  

  ServerPlayerBarn.singleton().savePlayers();
  

  SkyServerStore.singleton().close();
});
