
const { literal, argument, string } = require("@jsprismarine/brigadier");
const { PlayerArgument } = require("../arguments/playerArgument.js");
const { SkySpiritShopDefs } = require("../../staticData/spiritShop.js");
const { ServerPlayerUnlockEntry } = require("../../runtimeData/player/serverPlayerUnlocks.js");
const { SkyOutfitDefs } = require("../../staticData/outfits.js");

class UnlockCommand {
  static register(dispatcher) {
    // unlock <target:string> give any <name:string>
    // unlock <target:string> give spirit *
    // unlock <target:string> give spirit <name:string>
    // unlock <target:string> give outfit *
    // unlock <target:string> give outfit <name:string>
    // unlock <target:string> give collectible *
    // unlock <target:string> give collectible <name:string>
    // unlock <target:string> take <name:string>
    // unlock <target:string> take *
    dispatcher.register(
      literal("unlock").requires(() => { return true; }).then(argument("target", new PlayerArgument())
        .then(literal("give")
          .then(literal("any")
            .then(argument("name", string()).executes((R) => {
              return UnlockCommand.anyUnlock(R.getSource(), R.getArgument("target"), R.getArgument("name"));
            }))
          ).then(literal("spirit")
            .then(argument("name", string()).executes((R) => {
              return UnlockCommand.spiritUnlock(R.getSource(), R.getArgument("target"), R.getArgument("name"));
            })).then(literal("*").executes((R) => {
              return UnlockCommand.spiritUnlock(R.getSource(), R.getArgument("target"));
            }))
          ).then(literal("outfit")
            .then(argument("name", string()).executes((R) => {
              return UnlockCommand.outfitUnlock(R.getSource(), R.getArgument("target"), R.getArgument("name"));
            })).then(literal("*").executes((R) => {
              return UnlockCommand.outfitUnlock(R.getSource(), R.getArgument("target"));
            }))
          )
        ).then(literal("take")
          .then(argument("name", string()).executes((R) => {
            return UnlockCommand.takeUnlock(R.getSource(), R.getArgument("target"), R.getArgument("name"));
          }))
          .then(literal("*").executes((R) => {
            return UnlockCommand.takeUnlock(R.getSource(), R.getArgument("target"));
          }))
        )
      )
    );
  }

  /**
   * Auto add unlock.
   * @param {CommandSource} source 
   * @param {PlayerArgument} target 
   * @param {string} name 
   * @param {boolean} [log] 
   */
  static anyUnlock(source, target, name, log = true) {
    // Try to add to account unlocks.
    var player = target.player
      , base = SkySpiritShopDefs.singleton().getItemWithName(name);
    if (base) {
      player.addSpiritUnlock(base.name, false);
      return log && source.addSuccess(`added ${name} to account unlocks of ${target}.`);
    }

    // Add to service unlocks anyway.
    var entry = ServerPlayerUnlockEntry.createLevelUnlock(name);
    player.serviceUnlocks.addUnlock(entry);
    return log && source.addSuccess(`added ${name} to service unlocks of ${target}.`);
  }

  /**
   * Add spirit unlocks.
   * @param {CommandSource} source 
   * @param {PlayerArgument} target 
   * @param {string} [name] 
   */
  static spiritUnlock(source, target, name) {
    var player = target.player;

    if (typeof name === "undefined") {
      // Unlock all spirit shop items.
      var count = 0;
      return source.addSuccess(`added ${count} items to account unlocks of ${player}.`);
    }

    // Unlock single item.
    var base = SkySpiritShopDefs.singleton().getItemWithName(name);
    if (!base)
      return source.addFail(`invalid spiritshop item: ${name}.`);

    player.addSpiritUnlock(base.name, false);
    source.addSuccess(`added ${name} to account unlocks of ${player}.`);
  }

  /**
   * Add outfit unlocks.
   * @param {CommandSource} source 
   * @param {PlayerArgument} target 
   * @param {string} [name] 
   */
  static outfitUnlock(source, target, name) {
    var player = target.player;

    if (typeof name === "undefined") {
      // Unlock all outfit items.
      var count = 0;
      for (var o of SkyOutfitDefs.singleton().entries()) {
        count++;
        UnlockCommand.anyUnlock(source, target, o.name, false);
      }
      return source.addSuccess(`added ${count} items to ${player}.`);
    }

    // Unlock single item.
    var base = SkyOutfitDefs.singleton().getOutfitWithName(name);
    if (!base)
      return source.addFail(`invalid outfit: ${name}.`);

    UnlockCommand.anyUnlock(source, target, base.name);
  }

  static takeUnlock() {

  }
}

module.exports = UnlockCommand;
