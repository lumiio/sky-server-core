
const { literal, argument, string, word, greedyString, integer } = require("@jsprismarine/brigadier");
const { ServerPlayerBarn } = require("../../runtimeData/player.js");
const { SkyServerStore } = require("../../runtimeData/db.js");
const { LOGI } = require("../../utils/logger.js");

class AdminCommand {
  static register(dispatcher) {
    

    dispatcher.register(
      literal("status").executes((R) => {
        return AdminCommand.status(R.getSource());
      })
    );

    

    dispatcher.register(
      literal("players").executes((R) => {
        return AdminCommand.players(R.getSource());
      })
    );

    

    dispatcher.register(
      literal("broadcast").then(argument("msg", greedyString()).executes((R) => {
        return AdminCommand.broadcast(R.getSource(), R.getArgument("msg"));
      }))
    );

    

    dispatcher.register(
      literal("maintenance")
        .then(literal("on").then(argument("msg", greedyString()).executes((R) => {
          return AdminCommand.setMaintenance(R.getSource(), true, R.getArgument("msg"));
        })).executes((R) => {
          return AdminCommand.setMaintenance(R.getSource(), true, "");
        }))
        .then(literal("off").executes((R) => {
          return AdminCommand.setMaintenance(R.getSource(), false, "");
        }))
    );

    

    dispatcher.register(
      literal("motd")
        .then(literal("get").executes((R) => {
          return AdminCommand.motdGet(R.getSource());
        }))
        .then(literal("set")
          .then(argument("rest", greedyString()).executes((R) => {
            return AdminCommand.motdSet(R.getSource(), R.getArgument("rest"));
          }))
        )
    );

    

    dispatcher.register(
      literal("register")
        .then(literal("on").executes((R) => {
          return AdminCommand.setRegister(R.getSource(), true);
        }))
        .then(literal("off").executes((R) => {
          return AdminCommand.setRegister(R.getSource(), false);
        }))
        .then(literal("status").executes((R) => {
          return AdminCommand.registerStatus(R.getSource());
        }))
    );

    

    dispatcher.register(
      literal("gift")
        .then(argument("candles", integer())
          .then(argument("hearts", integer())
            .then(argument("season", integer())
              .then(argument("wings", integer()).executes((R) => {
                return AdminCommand.setGift(R.getSource(),
                  R.getArgument("candles"), R.getArgument("hearts"),
                  R.getArgument("season"), R.getArgument("wings"));
              }))
            )
          )
        )
    );

    

    dispatcher.register(
      literal("ban")
        .then(argument("player", word())
          .then(argument("days", integer())
            .then(argument("reason", greedyString()).executes((R) => {
              return AdminCommand.ban(R.getSource(), R.getArgument("player"),
                R.getArgument("days"), R.getArgument("reason"));
            }))
          )
          .executes((R) => {
            return AdminCommand.ban(R.getSource(), R.getArgument("player"), 0, "");
          })
        )
    );

    

    dispatcher.register(
      literal("unban").then(argument("player", word()).executes((R) => {
        return AdminCommand.unban(R.getSource(), R.getArgument("player"));
      }))
    );

    

    dispatcher.register(
      literal("banned").executes((R) => {
        return AdminCommand.banned(R.getSource());
      })
    );

    

    dispatcher.register(
      literal("kick").then(argument("player", word()).executes((R) => {
        return AdminCommand.kick(R.getSource(), R.getArgument("player"));
      }))
    );

    

    dispatcher.register(
      literal("stop").executes((R) => {
        return AdminCommand.stop(R.getSource());
      })
    );
  }

  static status(source) {
    const barn = ServerPlayerBarn.singleton();
    const startTime = process.uptime();
    let onlineCount = 0;
    for (const pid in barn.players) {
      const p = barn.players[pid];
      if (p && p.lastSeen && (Date.now() - p.lastSeen < 30 * 1000)) onlineCount++;
    }
    source.addSuccess(`Server status: running | Online players: ${onlineCount} | Uptime: ${Math.floor(startTime)}s | Accounts: ${Object.keys(barn.allPlayers || {}).length} | Bans: ${Object.keys(barn.banned || {}).length}`);
  }

  static players(source) {
    const barn = ServerPlayerBarn.singleton();
    const list = Object.entries(barn.players || {});
    if (!list.length) {
      source.addSuccess("No players online");
      return;
    }
    source.addSuccess(`Online players (${list.length}):`);
    for (const [id, p] of list) {
      source.addSuccess(`  ${id}  currency: ${p.currency ? p.currency.toString() : 'N/A'}`);
    }
  }

  static broadcast(source, msg) {
    const barn = ServerPlayerBarn.singleton();
    LOGI(`[BROADCAST] ${msg}`);
    barn.motdTitle = "Broadcast";
    barn.motdText = msg || "";
    barn.saveMotd();
    

    if (!global.SkyServerGlobal) global.SkyServerGlobal = {};
    global.SkyServerGlobal.motdTitle = "Broadcast";
    global.SkyServerGlobal.motdText = msg || "";
    source.addSuccess(`Broadcast sent: ${msg}`);
  }

  static setMaintenance(source, enabled, msg) {
    if (!global.SkyServerGlobal) global.SkyServerGlobal = {};
    global.SkyServerGlobal.maintenanceMode = enabled;
    global.SkyServerGlobal.maintenanceMsg = msg || "Server is under maintenance, please try again later...";
    source.addSuccess(enabled ? `Maintenance mode enabled: ${global.SkyServerGlobal.maintenanceMsg}` : "Maintenance mode disabled");
  }

  static motdGet(source) {
    const g = global.SkyServerGlobal || {};
    source.addSuccess(`Current notice: title=${g.motdTitle || "(empty)"} content=${g.motdText || "(empty)"}`);
  }

  static motdSet(source, rest) {
    

    const i = rest.indexOf(" ");
    const title = i > -1 ? rest.slice(0, i) : rest;
    const text = i > -1 ? rest.slice(i + 1) : "";
    if (!global.SkyServerGlobal) global.SkyServerGlobal = {};
    global.SkyServerGlobal.motdTitle = title || "";
    global.SkyServerGlobal.motdText = text || "";
    source.addSuccess(`Notice set: [${title}] ${text}`);
  }

  static setRegister(source, allow) {
    const barn = ServerPlayerBarn.singleton();
    barn.allowRegister = allow;
    SkyServerStore.singleton().set("admin_register", JSON.stringify({ allowRegister: allow }));
    source.addSuccess(`Registration: ${allow ? "open" : "closed"}`);
  }

  static registerStatus(source) {
    const barn = ServerPlayerBarn.singleton();
    source.addSuccess(`Registration: ${barn.allowRegister !== false ? "open" : "closed"}`);
  }

  static setGift(source, candles, hearts, season, wings) {
    const barn = ServerPlayerBarn.singleton();
    barn.giftCandles = candles;
    barn.giftHearts = hearts;
    barn.giftSeason = season;
    barn.giftWings = wings;
    SkyServerStore.singleton().set("admin_gift", JSON.stringify({ candles, hearts, season, wings }));
    source.addSuccess(`New-account gifts configured: candles=${candles} hearts=${hearts} seasonal-candles=${season} winged-light=${wings}`);
  }

  static ban(source, playerId, days, reason) {
    const barn = ServerPlayerBarn.singleton();
    const durationSec = days > 0 ? days * 86400 : 0;
    barn.ban(playerId, reason || "", durationSec);
    LOGI(`[BAN] ${playerId} banned, reason: ${reason || "none"}, duration: ${durationSec > 0 ? durationSec + "s" : "permanent"}`);
    

    if (barn.players[playerId]) {
      delete barn.players[playerId];
    }
    source.addSuccess(`Banned ${playerId}${durationSec > 0 ? ` (${days} days)` : " (permanent)"}${reason ? `, reason: ${reason}` : ""}`);
  }

  static unban(source, playerId) {
    ServerPlayerBarn.singleton().unban(playerId);
    LOGI(`[UNBAN] ${playerId} unbanned`);
    source.addSuccess(`Unbanned ${playerId}`);
  }

  static banned(source) {
    const barn = ServerPlayerBarn.singleton();
    const now = Date.now();
    const list = Object.entries(barn.banned || {});
    if (!list.length) {
      source.addSuccess("No bans on record");
      return;
    }
    source.addSuccess(`Banned players (${list.length}):`);
    for (const [id, info] of list) {
      const remaining = info.expire_time ? Math.max(0, Math.floor((info.expire_time - now) / 1000)) : 0;
      const expired = info.expire_time && now > info.expire_time;
      source.addSuccess(`  ${id}  reason: ${info.reason || "none"}  ${info.expire_time ? (expired ? " (expired)" : `${remaining}s left`) : "permanent"}`);
    }
  }

  static kick(source, playerId) {
    const barn = ServerPlayerBarn.singleton();
    if (!barn.players[playerId]) {
      source.addFail(`Player not online: ${playerId}`);
      return;
    }
    delete barn.players[playerId];
    LOGI(`[KICK] ${playerId} kicked offline`);
    source.addSuccess(`Kicked offline ${playerId}`);
  }

  static stop(source) {
    source.addSuccess("Stopping server...");
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
}

module.exports = AdminCommand;
