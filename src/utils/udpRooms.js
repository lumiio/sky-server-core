// ============================================================


// ============================================================
    function queryUdpRooms() {
      return new Promise((resolve) => {
        try {
          const http = require("http");
          http.get("http://127.0.0.1:19133/move/targets", (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
              try { resolve(JSON.parse(data).targets || []); }
              catch (e) { resolve([]); }
            });
          }).on("error", () => resolve([]));
        } catch (e) { resolve([]); }
      });
    }

module.exports = { queryUdpRooms };
