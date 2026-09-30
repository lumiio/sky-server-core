

const rl = require("readline")  

  , ps = require("process");
const { ISingleton } = require("../utils/helperClasses.js");  

const { Commands } = require("./commands.js");                

const { LOGI, LOGE } = require("../utils/logger.js");          



class SkyServerConsole extends ISingleton {
  constructor() {
    super();

    this.commands = new Commands();  

    this.interface = null;          

  }

  
  input(s) {
    try {
      this.commands.performCommand(s);  

    } catch (e) {
      LOGE(e);  

    }

    

    while (!this.commands.source.empty()) {
      var msg = this.commands.source.popMessage()
      if (msg.success)
        LOGI(msg.message);  

      else
        LOGE(msg.message);  

    }
  }

  
  start() {
    if (this.interface)
      return;  


    var ref = this;

    

    this.interface = rl.createInterface({
      input: ps.stdin,
      output: ps.stdout,
      prompt: ""  

    });

    

    this.interface.on("line", line => {
      ref.input(line);  

    }).on("SIGINT", _ => {
      

      ref.stop();
      ps.emit("SIGINT");  

    });
  }

  
  stop() {
    if (!this.interface)
      return;

    this.interface.close();
    this.interface = null;
  }
}

module.exports = {
  SkyServerConsole
};
