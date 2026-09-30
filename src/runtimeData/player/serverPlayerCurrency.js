
const NBT = require("parsenbt-js");
const { INbtify } = require("../../utils/helperClasses.js");

/** Player's currency data. */
class ServerPlayerCurrency extends INbtify {
  static deserialize(obj) {
    var result = new ServerPlayerCurrency();

    if (typeof obj !== "object")
      return result;

    result.dyeWax.red = obj["i32>color_red_wax"] || 0;
    result.dyeWax.yellow = obj["i32>color_yellow_wax"] || 0;
    result.dyeWax.green = obj["i32>color_green_wax"] || 0;
    result.dyeWax.blue = obj["i32>color_blue_wax"] || 0;
    result.dyeWax.cyan = obj["i32>color_cyan_wax"] || 0;
    result.dyeWax.magenta = obj["i32>color_magenta_wax"] || 0;
    result.dyeWax.black = obj["i32>color_black_wax"] || 0;
    result.dyeWax.white = obj["i32>color_white_wax"] || 0;

    result.dye.red = obj["i32>color_red"] || 0;
    result.dye.yellow = obj["i32>color_yellow"] || 0;
    result.dye.green = obj["i32>color_green"] || 0;
    result.dye.blue = obj["i32>color_blue"] || 0;
    result.dye.cyan = obj["i32>color_cyan"] || 0;
    result.dye.magenta = obj["i32>color_magenta"] || 0;
    result.dye.black = obj["i32>color_black"] || 0;
    result.dye.white = obj["i32>color_white"] || 0;

    result.candles = obj["i32>candles"] || 0;
    result.heart = obj["i32>heart"] || 0;
    result.seasonCandle = obj["i32>season_candle"] || 0;
    result.prestige = obj["i32>prestige"] || 0;
    result.vip = obj["i32>vip"] || 0;
    result.prestigeVip = obj["i32>prestige_vip"] || 0;

    result.wax = obj["i32>wax"] || 0;
    result.seasonWax = obj["i32>season_vip"] || 0;
    result.prestigeWax = obj["i32>prestige_wax"] || 0;

    return result;
  }

  constructor() {
    super();

    /** Dye wax. */
    this.dyeWax = {
      red: 0,
      yellow: 0,
      green: 0,
      blue: 0,
      cyan: 0,
      magenta: 0,
      black: 0,
      white: 0
    };

    /** Dyes. */
    this.dye = {
      red: 0,
      yellow: 0,
      green: 0,
      blue: 0,
      cyan: 0,
      magenta: 0,
      black: 0,
      white: 0
    };

    /** Candles. */
    this.candles = 0;
    /** Hearts. */
    this.heart = 0;
    /** Season candles. */
    this.seasonCandle = 0;
    /** Ascended candles. */
    this.prestige = 0;
    /** Season pass. */
    this.vip = 0;
    this.prestigeVip = 0;

    this.wax = 0;
    this.seasonWax = 0;
    this.prestigeWax = 0;
  }

  serialize() {
    var result = NBT.create(false);

    result["i32>color_red"] = this.dye.red;
    result["i32>color_yellow"] = this.dye.yellow;
    result["i32>color_green"] = this.dye.green;
    result["i32>color_blue"] = this.dye.blue;
    result["i32>color_cyan"] = this.dye.cyan;
    result["i32>color_magenta"] = this.dye.magenta;
    result["i32>color_black"] = this.dye.black;
    result["i32>color_white"] = this.dye.white;

    result["i32>color_red_wax"] = this.dyeWax.red;
    result["i32>color_yellow_wax"] = this.dyeWax.yellow;
    result["i32>color_green_wax"] = this.dyeWax.green;
    result["i32>color_blue_wax"] = this.dyeWax.blue;
    result["i32>color_cyan_wax"] = this.dyeWax.cyan;
    result["i32>color_magenta_wax"] = this.dyeWax.magenta;
    result["i32>color_black_wax"] = this.dyeWax.black;
    result["i32>color_white_wax"] = this.dyeWax.white;

    result["i32>candles"] = this.candles;
    result["i32>heart"] = this.heart;
    result["i32>season_candle"] = this.seasonCandle;
    result["i32>prestige"] = this.prestige;
    result["i32>vip"] = this.vip;
    result["i32>prestige_vip"] = this.prestigeVip;

    result["i32>wax"] = this.wax;
    result["i32>season_vip"] = this.seasonWax;
    result["i32>prestige_wax"] = this.prestigeWax;

    return result;
  }

  toJSON() {
    return {
      color_red: this.dye.red,
      color_yellow: this.dye.yellow,
      color_green: this.dye.green,
      color_blue: this.dye.blue,
      color_cyan: this.dye.cyan,
      color_magenta: this.dye.magenta,
      color_black: this.dye.black,
      color_white: this.dye.white,

      color_red_wax: this.dyeWax.red,
      color_yellow_wax: this.dyeWax.yellow,
      color_green_wax: this.dyeWax.green,
      color_blue_wax: this.dyeWax.blue,
      color_cyan_wax: this.dyeWax.cyan,
      color_magenta_wax: this.dyeWax.magenta,
      color_black_wax: this.dyeWax.black,
      color_white_wax: this.dyeWax.white,

      candles: this.candles,
      heart: this.heart,
      season_candle: this.seasonCandle,
      prestige: this.prestige,
      vip: this.vip,
      prestige_vip: this.prestigeVip,

      wax: this.wax,
      season_vip: this.seasonWax,
      prestige_wax: this.prestigeWax
    }
  }
}

module.exports = {
  ServerPlayerCurrency
};
