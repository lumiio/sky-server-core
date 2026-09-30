
const { SkyBuffDefs } = require("../../../../staticData/buffs.js");
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountBuffDefsResponse extends NetServerSimpleResponse {
  template() {
    

    var buffs = SkyBuffDefs.singleton().toJSON();
    return {
      "get_buff_defs": buffs
    };
  }
}

class AccountBuffDefsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/buff/get_buff_defs";
  }

  static get response() {
    return AccountBuffDefsResponse;
  }

  

  static handler(req, res) {
    var session = "";
    try {
      var body = JSON.parse(req);
      session = body.session || "";
    } catch (e) {}
    var raw = getCachedbuffBody();
    var withSession = raw.replace('{', '{"session":"' + session + '",', 1);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.write(withSession);
    return res;
  }
}




let cachedbuffBody = null;
function getCachedbuffBody() {
  if (cachedbuffBody) return cachedbuffBody;
  const data = SkyBuffDefs.singleton().toJSON();
  cachedbuffBody = JSON.stringify({ "get_buff_defs": data });
  return cachedbuffBody;
}

module.exports = AccountBuffDefsRequest;
