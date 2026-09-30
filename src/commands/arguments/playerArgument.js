
const { DynamicCommandExceptionType, LiteralMessage } = require("@jsprismarine/brigadier");
const { ICommandArgument } = require("./commandArgument.js");
const { ServerPlayerBarn } = require("../../runtimeData/player.js");

class PlayerArgument extends ICommandArgument {
  static ERROR_INVALID = new DynamicCommandExceptionType(
    name => new LiteralMessage("invalid player: " + name)
  );

  static copy(obj) {
    var result = new PlayerArgument();

    result.player = obj.player;

    return result;
  }

  constructor(needOnline = true) {
    super();

    this.needOnline = needOnline;
    this.player = null;
  }

  parse(reader) {
    var value = reader.readString()
      , player = ServerPlayerBarn.singleton().getPlayer(value);

    if (!player)
      throw PlayerArgument.ERROR_INVALID.createWithContext(reader, value);

    this.player = player;

    return this;
  }
}

module.exports = {
  PlayerArgument
};
