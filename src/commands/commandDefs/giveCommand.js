
const { literal, argument, string, integer } = require("@jsprismarine/brigadier");
const { ServerPlayerBarn } = require("../../runtimeData/player.js");

class GiveCommand {
  static register(dispatcher) {
    dispatcher.register(literal("give").requires(() => {
      return true;
    }).then(argument("target", string()).then(argument("item", string()).executes((R) => {
      return GiveCommand.giveItem(R.getSource(), R.getArgument("target"), R.getArgument("item"), 1);
    }).then(argument("count", integer()).executes((R) => {
      return GiveCommand.giveItem(R.getSource(), R.getArgument("target"), R.getArgument("item"), R.getArgument("count"));
    })))));
  }

  static giveItem(source, target, item, count) {
    var player = ServerPlayerBarn.singleton().getPlayer(target)
      , stack;

    if (!player)
      return source.addFail("unknown player: " + target);

    if (count > 32767)
      return source.addFail("too many items given: " + target + " > 32767");

    stack = player.giveItem(item, count);
    if (!stack)
      return source.addFail("unknown item: " + item);

    source.addSuccess(`gave ${count} * ${item} to ${target}.`);
  }
}

module.exports = GiveCommand;
