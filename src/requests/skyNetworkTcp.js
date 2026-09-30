

const http = require("http")   

  , ws = require("ws")         

  , mqtt = require("mqtt");   

const { ISingleton } = require("../utils/helperClasses.js");      

const { NetServerRequestHandler } = require("./netServerRequestHandlers.js"); 

const { LOGI, printRequestStatus } = require("../utils/logger.js"); 

const { SkyServerArgs } = require("../skyServerArgs.js");           



class SkyNetworkTcp extends ISingleton {
  constructor() {
    super();
    this.port = 9000;                                    

    this.requestHandler = new NetServerRequestHandler(); 

    this.server = null;                                  

    this.websocket = null;                               

    this.options = {};                                   

  }

  
  serverProc(req, res) {
    var reqUrl = new URL(req.url, "http://localhost")  

      , ref = this
      , body = [];  


    

    req.on("data", chunk => body.push(chunk));

    

    req.on("end", () => {
      var buffer = Buffer.concat(body)  

        , rawBody = buffer.toString().trim();  


      

      if (!rawBody)
        rawBody = "{}";

      

      ref.requestHandler.handle(reqUrl.pathname, rawBody, res, req.headers, req.method, reqUrl.search || "");

      

      if (SkyServerArgs.singleton().logRequests)
        printRequestStatus(req, res);
    });
  }

  
  init(port = 9000, options = {}) {
    this.port = port;
    this.options = options;

    

    

    this.server = http.createServer(this.serverProc.bind(this));

    

    

    this.websocket = new ws.Server({
      server: this.server,
      path: "/account/ws"
    });
  }

  
  run() {
    var ref = this;
    this.server.on("error", function(e) {
      if (e.code === "EADDRINUSE") {
        console.error("[!] port " + ref.port + " in use, exiting in 3s for supervisor restart...");
        setTimeout(() => process.exit(1), 3000);
      } else {
        throw e;
      }
    });
    try {
      this.server.listen(this.port, "127.0.0.1", () => {
        LOGI("http server running at: http://127.0.0.1:" + this.port + " (behind nginx)");
      });
    } catch(e) {
      console.error("[!] listen error:", e.message);
      setTimeout(() => process.exit(1), 3000);
    }

    

    this.websocket.on('connection', (client) => { });
  }

  
  stop() {
    if (!this.server)
      throw new Error("try to stop a not running server.");

    this.server.close();              

    this.server.closeAllConnections(); 

    this.server = null;
  }
}

module.exports = {
  SkyNetworkTcp
};