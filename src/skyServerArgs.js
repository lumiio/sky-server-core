

const pl = require("path");
const { ISingleton } = require("./utils/helperClasses.js");  

const { LOGI } = require("./utils/logger.js");                



class SkyServerArgs extends ISingleton {
  constructor() {
    super();

    

    this.tcpPort = 9000;      

    this.logRequests = true;  

    this.requestDisables = [];


    

    this.noDB = false;          

    this.alwaysNewUser = false; 

  }

  
  fromArgs(obj) {
    

    this.logRequests = !obj["--no-log-requests"];

    

    this.tcpPort = obj["--port"] || 9000;

    

    

    for (var arg of obj._) {
      if (/^--D/.test(arg)) {
        var path = pl.posix.normalize(arg.slice(3));  

        this.requestDisables.push(path);
      }
    }

    

    if (this.requestDisables.length)
      LOGI("SkyServerArgs: disabled requests: \n  - " + this.requestDisables.join("\n  - "));

    

    this.noDB = !!obj["--DEBUG-no-db"];
    this.alwaysNewUser = !!obj["--DEBUG-always-new-user"];
  }

  
  isRequestDisabled(path) {
    return this.requestDisables.indexOf(path) !== -1;
  }
}

module.exports = {
  SkyServerArgs
};
