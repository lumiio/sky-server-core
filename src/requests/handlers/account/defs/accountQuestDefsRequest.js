
const { SkyQuestDefs } = require("../../../../staticData/quests.js");
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");
const fs = require("fs");
const path = require("path");





let cachedRawText = null;
function loadRawText() {
  if (cachedRawText) return cachedRawText;
  try {
    const p = path.join(process.cwd(), "data", "defs", "quest_defs.json");
    cachedRawText = fs.readFileSync(p, "utf8");
  } catch (e) {
    cachedRawText = '{"get_quest_defs":[]}';
  }
  return cachedRawText;
}

class AccountQuestDefsResponse extends NetServerSimpleResponse {
  template() {
    return {};
  }
}



AccountQuestDefsResponse.prototype.write = function(res, code = 200) {
  var raw = loadRawText();
  

  var withSession = raw.replace('{', '{"session":"' + (this.session || '') + '",', 1);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.write(withSession);
  return res;
};

class AccountQuestDefsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/quest/get_quest_defs";
  }

  static get response() {
    return AccountQuestDefsResponse;
  }

  

  static handler(req, res) {
    var session = "";
    try {
      var body = JSON.parse(req);
      session = body.session || "";
    } catch (e) {}
    var raw = loadRawText();
    var withSession = raw.replace('{', '{"session":"' + session + '",', 1);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.write(withSession);
    return res;
  }
}

module.exports = AccountQuestDefsRequest;
