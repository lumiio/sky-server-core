
const { ISingleton } = require("../utils/helperClasses");
const { LOGI } = require("../utils/logger.js");

class SkyVars extends ISingleton {
  constructor() {
    super();
    this.vars = {};
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || typeof obj.vars !== "object")
      return void 0;

    this.vars = Object.assign({}, obj.vars);

    LOGI(`SkyVars: initialized ${Object.keys(this.vars).length} vars.`);

    return this;
  }

  toJSON() {
    return Object.assign({}, this.vars);
  }
}

module.exports = {
  SkyVars
};
