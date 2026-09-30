
const NBT = require("parsenbt-js");
const { INbtify } = require("../../utils/helperClasses.js");
const { SkyOutfitDefs, SkyOutfitEntry } = require("../../staticData/outfits.js");

/** The player's outfit parts. */
class ServerPlayerElement extends INbtify {
  static deserialize(nbt) {
    var result = new ServerPlayerElement();

    if (typeof nbt !== "object")
      return result;

    result.id = nbt["i32>id"] || 0;
    result.mask = nbt["i32>mask"] || 0;
    result.pat = nbt["i32>pat"] || 0;
    result.tex = nbt["i32>tex"] || 0;

    return result;
  }

  static fromJSON(obj) {
    var result = new ServerPlayerElement();

    if (typeof obj !== "object")
      return result;

    result.id = obj.id || 0;
    result.mask = obj.mask || 0;
    result.pat = obj.pat || 0;
    result.tex = obj.tex || 0;

    return result;
  }

  /**
   * Create outfit with identifier.
   * @param {number|string} identifier 
   * @returns 
   */
  static create(identifier) {
    var result = new ServerPlayerElement()
      , entry;

    if (typeof identifier === "string")
      entry = SkyOutfitDefs.singleton().getOutfitWithName(identifier);
    else if (typeof identifier === "number")
      entry = SkyOutfitDefs.singleton().getOutfit(identifier);
    else
      return void 0;

    if (!entry)
      return void 0;

    result.id = entry.id;

    return result;
  }

  /**
   * Copy an outfit entry.
   * @param {ServerPlayerElement} entry 
   * @param {boolean} validate 
   * @returns {ServerPlayerElement}
   */
  static copy(entry, validate) {
    var result = new ServerPlayerElement();

    if (typeof entry !== "object")
      return result;

    if (validate && !result.isValid.call(entry))
      return result;

    result.id = entry.id;
    result.mask = entry.mask;
    result.pat = entry.pat;
    result.tex = entry.tex;

    return result;
  }

  constructor() {
    super();

    this.id = 0;
    this.mask = 0;
    this.pat = 0;
    this.tex = 0;
  }

  /**
   * Check the outfit.
   * @param {boolean} skyKid - Only allows CharSkyKid outfits.
   * @param {"body"|"feet"|"hat"|"hair"|"horn"|"mask"|"neck"|"prop"|"wing"} [slot] - Outfit slot.
   * @returns 
   */
  isValid(skyKid, slot) {
    if (this.id == 0)
      return true;

    var base = this.getOutfitBase();
    if (!base)
      return false;

    if (skyKid && base.name.indexOf("CharSkyKid") === -1)
      return false;

    if (!slot)
      return true;

    return base.slot == slot;
  }

  /**
   * Get outfit definitions.
   * @returns {SkyOutfitEntry}
   */
  getOutfitBase() {
    return SkyOutfitDefs.singleton().getOutfit(this.id);
  }

  serialize() {
    var result = NBT.create(false);

    result["i32>id"] = this.id;
    result["i32>mask"] = this.mask;
    result["i32>pat"] = this.pat;
    result["i32>tex"] = this.tex;

    return result;
  }

  toJSON() {
    return {
      id: this.id,
      mask: this.mask,
      pat: this.pat,
      tex: this.tex
    };
  }
}

/** The player's outfit. */
class ServerPlayerOutfit extends INbtify {
  static SLOTS = ["body", "feet", "mask", "neck", "arms", "hair", "hat", "horn", "wing", "prop"];

  static deserialize(nbt) {
    var result = new ServerPlayerOutfit();

    if (typeof nbt !== "object")
      return result;

    result.scale = nbt["f32>scale"] || 0;
    result.height = nbt["f32>height"] || 0.5;
    result.wingCount = nbt["i32>wing_count"] || 0;

    result.attitude = nbt["str>attitude"] || 0;

    result.seed = nbt["i32>seed"] || 0;
    result.voice = nbt["i32>voice"] || 0;

    result.body = ServerPlayerElement.deserialize(nbt["comp>body"]);
    result.feet = ServerPlayerElement.deserialize(nbt["comp>feet"]);

    result.mask = ServerPlayerElement.deserialize(nbt["comp>mask"]);
    result.neck = ServerPlayerElement.deserialize(nbt["comp>neck"]);
    result.arms = ServerPlayerElement.deserialize(nbt["comp>arms"]);

    result.hair = ServerPlayerElement.deserialize(nbt["comp>hair"]);
    result.hat = ServerPlayerElement.deserialize(nbt["comp>hat"]);
    result.horn = ServerPlayerElement.deserialize(nbt["comp>horn"]);

    result.wing = ServerPlayerElement.deserialize(nbt["comp>wing"]);

    result.prop = ServerPlayerElement.deserialize(nbt["comp>prop"]);

    return result;
  }

  static fromJSON(obj) {
    var result = new ServerPlayerOutfit();

    if (typeof obj !== "object")
      return result;

    result.scale = obj.scale || 0;
    result.height = obj.height || 0.5;

    result.attitude = obj.attitude || "0";

    result.seed = obj.seed || 0;
    result.voice = obj.voice || 0;

    result.body = ServerPlayerElement.fromJSON(obj.body);
    result.feet = ServerPlayerElement.fromJSON(obj.feet);

    result.mask = ServerPlayerElement.fromJSON(obj.mask);
    result.neck = ServerPlayerElement.fromJSON(obj.neck);
    result.arms = ServerPlayerElement.fromJSON(obj.arms);

    result.hair = ServerPlayerElement.fromJSON(obj.hair);
    result.hat = ServerPlayerElement.fromJSON(obj.hat);
    result.horn = ServerPlayerElement.fromJSON(obj.horn);

    result.wing = ServerPlayerElement.fromJSON(obj.wing);

    result.prop = ServerPlayerElement.fromJSON(obj.prop);

    return result;
  }

  constructor() {
    super();

    // Height and body scale.
    this.scale = 0;
    this.height = 0.5;
    this.wingCount = 0;

    // Stance.
    this.attitude = "0";

    // Shout voice.
    this.seed = 0;
    this.voice = 0;

    // Outfit elements.
    this.body = new ServerPlayerElement();
    this.feet = new ServerPlayerElement();

    this.mask = new ServerPlayerElement();
    this.neck = new ServerPlayerElement();
    this.arms = new ServerPlayerElement();

    this.hair = new ServerPlayerElement();
    this.hat = new ServerPlayerElement();
    this.horn = new ServerPlayerElement();

    this.wing = new ServerPlayerElement();

    this.prop = new ServerPlayerElement();
  }

  /**
   * Copy outfits from another object.
   * @param {ServerPlayerOutfit} outfit 
   * @param {boolean} validate 
   */
  copyOutfit(outfit, validate) {
    this.attitude = outfit.attitude;
    this.scale = outfit.scale;
    this.height = outfit.height;
    this.seed = outfit.seed;
    this.voice = outfit.voice;

    for (var s of ServerPlayerOutfit.SLOTS) {
      var e = ServerPlayerElement.copy(outfit[s], validate);
      this[s] = e.isValid(true, s) ? e : new ServerPlayerElement();
    }
  }

  /**
   * Set the player's outfit.
   * @param {"body"|"feet"|"hat"|"hair"|"horn"|"mask"|"neck"|"prop"|"wing"} slot 
   * @param {string} identifier 
   * @returns {ServerPlayerElement|undefined}
   */
  setOutfit(slot, identifier) {
    var entry;

    if (ServerPlayerOutfit.SLOTS.indexOf(slot) === -1)
      return void 0;

    entry = ServerPlayerElement.create(identifier);
    if (!entry || !entry.isValid(true, slot))
      return void 0;

    this[slot] = entry;

    return entry;
  }

  setHeight(height) {
    this.height = height;
  }

  setScale(scale) {
    this.scale = scale;
  }

  serialize() {
    var result = NBT.create(false);

    result["f32>scale"] = this.scale;
    result["f32>height"] = this.height;
    result["i32>wing_count"] = this.wingCount || 0;

    result["str>attitude"] = this.attitude;

    result["i32>seed"] = this.seed;
    result["i32>voice"] = this.voice;

    result["comp>body"] = this.body.serialize();
    result["comp>feet"] = this.feet.serialize();

    result["comp>mask"] = this.mask.serialize();
    result["comp>neck"] = this.neck.serialize();
    result["comp>arms"] = this.arms.serialize();

    result["comp>hair"] = this.hair.serialize();
    result["comp>hat"] = this.hat.serialize();
    result["comp>horn"] = this.horn.serialize();

    result["comp>wing"] = this.wing.serialize();

    result["comp>prop"] = this.prop.serialize();

    return result;
  }

  toJSON() {
    return {
      "scale": this.scale,
      "height": this.height,
      "wingCount": this.wingCount || 0,
      "wing_count": this.wingCount || 0,

      "attitude": this.attitude,

      "seed": this.seed,
      "voice": this.voice,

      "body": this.body.toJSON(),
      "feet": this.feet.toJSON(),

      "mask": this.mask.toJSON(),
      "neck": this.neck.toJSON(),
      "arms": this.arms.toJSON(),

      "hair": this.hair.toJSON(),
      "hat": this.hat.toJSON(),
      "horn": this.horn.toJSON(),

      "wing": this.wing.toJSON(),

      "prop": this.prop.toJSON(),
    };
  }
}

module.exports = {
  ServerPlayerElement,
  ServerPlayerOutfit
};
