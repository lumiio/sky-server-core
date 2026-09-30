
const { Suggestions, StringReader } = require("@jsprismarine/brigadier");

class ICommandArgument {
  /**
   * Copy an argument.
   * @param {ICommandArgument} obj 
   * @returns {ICommandArgument}
   */
  static copy(obj) {
    var result = new this;
    return result;
  }

  constructor() {

  }

  /**
   * Parse an argument from string.
   * @param {StringReader} reader 
   * @returns {ICommandArgument}
   */
  parse(reader) {
    return this;
  }

  /**
   * List command suggestions.
   * @returns {Promise<Suggestions>}
   */
  listSuggestions() {
    return Suggestions.empty();
  }
}

module.exports = {
  ICommandArgument
};
