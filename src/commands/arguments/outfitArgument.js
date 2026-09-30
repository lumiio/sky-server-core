
const { DynamicCommandExceptionType, LiteralMessage } = require("@jsprismarine/brigadier");
const { ICommandArgument } = require("./commandArgument.js");
const { SkyOutfitDefs } = require("../../staticData/outfits.js");

class OutfitArgument extends ICommandArgument {
  static ERROR_INVALID = new DynamicCommandExceptionType(
    name => new LiteralMessage("invalid outfit name: " + name)
  );

  static copy(obj) {
    var result = new OutfitArgument();

    result.outfitName = obj.outfitName;
    result.outfit = obj.outfit;

    return result;
  }

  constructor() {
    super();

    this.outfitName = "";
    this.outfit = void 0;
  }

  parse(reader) {
    var value = reader.readString()
      , base = SkyOutfitDefs.singleton().getOutfitWithName(value);

    if (!base)
      throw OutfitArgument.ERROR_INVALID.createWithContext(reader, value);

    this.outfit = base;
    this.outfitName = value;

    return this;
  }
}

module.exports = {
  OutfitArgument
};
