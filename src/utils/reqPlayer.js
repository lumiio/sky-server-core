// ============================================================


// ============================================================
const { ServerPlayerBarn } = require("../runtimeData/player.js");

    function getReqPlayer(body) {
      try {
        var r = JSON.parse(body);
        var pid = r.user || r.user_id || r.player_id || "";
        if (!pid) return null;
        var p = ServerPlayerBarn.singleton().getPlayer(pid, r.session);
        if (!p) p = ServerPlayerBarn.singleton().loadOfflinePlayer(pid);
        return p;
      } catch(e) { return null; }
    }

module.exports = { getReqPlayer };
