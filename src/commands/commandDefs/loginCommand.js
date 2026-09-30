
const { literal, argument, string } = require("@jsprismarine/brigadier");
const { ServerPlayerBarn } = require("../../runtimeData/player.js");
const { SkyServerArgs } = require("../../skyServerArgs.js");

class LoginCommand {
  static register(dispatcher) {
    // login <player:string>
    // login steam <user:string>
    dispatcher.register(
      literal("login").requires(() => { return !SkyServerArgs.singleton().alwaysNewUser; })
        .then(argument("player", string())
          .executes((R) => {
            return LoginCommand.login(R.getSource(), R.getArgument("player"));
          })
        ).then(literal("steam")
          .then(argument("user", string())
            .executes((R) => {
              return LoginCommand.loginSteam(R.getSource(), R.getArgument("user"));
            })
          )
        )
    );
  }

  static login(source, player) {
    var player = ServerPlayerBarn.singleton().login("Local", player, false);

    if (!player)
      return source.addFail("unregistered player: " + target);

    source.addSuccess(`player logged in: ${player.id}.`);
  }

  static loginSteam(source, user) {
    var player = ServerPlayerBarn.singleton().login("Steam", user, false);

    if (!player)
      return source.addFail("unregistered player (steam): " + target);

    source.addSuccess(`player (steam) logged in: ${player.id}.`);
  }
}

module.exports = LoginCommand;
