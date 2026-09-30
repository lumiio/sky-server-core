
const { CommandDispatcher } = require("@jsprismarine/brigadier");
const GiveCommand = require("./commandDefs/giveCommand.js");
const LoginCommand = require("./commandDefs/loginCommand.js");
const OutfitCommand = require("./commandDefs/outfitCommand.js");
const UnlockCommand = require("./commandDefs/unlockCommand.js");
const AdminCommand = require("./commandDefs/adminCommand.js");

class CommandSource {
  constructor() {
    this.messages = [];
  }

  addFail(msg) {
    this.messages.push({
      success: false,
      message: msg
    });
  }

  addSuccess(msg) {
    this.messages.push({
      success: true,
      message: msg
    });
  }

  popMessage() {
    return this.messages.pop();
  }

  empty() {
    return !this.messages.length;
  }
}

class Commands {
  constructor() {
    var D;

    this.source = new CommandSource();
    this.dispatcher = D = new CommandDispatcher();

    GiveCommand.register(D);
    LoginCommand.register(D);
    OutfitCommand.register(D);
    UnlockCommand.register(D);
    AdminCommand.register(D);
  }

  performCommand(S) {
    var result = this.dispatcher.parse(S, this.source);
    this.dispatcher.execute(result, this.source);
  }
}

module.exports = {
  CommandSource,
  Commands
};
