
const { literal, argument, string, float } = require("@jsprismarine/brigadier");
const { ServerPlayerBarn } = require("../../runtimeData/player.js");
const { ServerPlayerOutfit } = require("../../runtimeData/player/serverPlayerOutfit.js");
const { OutfitArgument } = require("../arguments/outfitArgument.js");

class OutfitCommand {
  static register(dispatcher) {
    // outfit <target:string> <slot:string> <name:string>
    // outfit <target:string> height <value:float>
    dispatcher.register(
      literal("outfit").requires(() => { return true; })
        .then(argument("target", string())
          .then(argument("slot", string())
            .then(argument("name", new OutfitArgument())
              .executes((R) => {
                return OutfitCommand.setOutfit(
                  R.getSource(),
                  R.getArgument("target"),
                  R.getArgument("slot"),
                  R.getArgument("name", OutfitArgument.copy)
                );
              })
            )
          ).then(literal("height")
            .then(argument("value", float())
              .executes((R) => {
                return OutfitCommand.setHeight(
                  R.getSource(),
                  R.getArgument("target"),
                  R.getArgument("value")
                );
              })
            )
          ))
    );
  }

  static setOutfit(source, target, slot, outfit) {
    var player = ServerPlayerBarn.singleton().getPlayer(target);

    if (!player)
      return source.addFail("unknown player: " + target);

    if (ServerPlayerOutfit.SLOTS.indexOf(slot) == -1)
      return source.addFail("unknown slot: " + slot);

    var name = outfit.outfitName
      , entry = player.setOutfit(slot, name);

    if (!entry)
      return source.addFail("failed to set outfit.");

    source.addSuccess(`set ${slot} of ${target} to ${name}.`);
  }

  static setHeight(source, target, height) {
    var player = ServerPlayerBarn.singleton().getPlayer(target);

    if (!player)
      return source.addFail("unknown player: " + target);

    player.setHeight(height);

    source.addSuccess(`set height of ${target} to ${height}.`);
  }
}

module.exports = OutfitCommand;
