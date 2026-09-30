
const { SkyConsumableDefs } = require("../../../../staticData/consumables.js");
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountConsumableDefsResponse extends NetServerSimpleResponse {
  constructor(session) {
    super(session);
  }

  template() {
    

    var consumables = SkyConsumableDefs.singleton().toJSON();
    return {
      "get_consumable_defs": consumables
    };
  }
}

class AccountConsumableDefsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/consumable/get_consumable_defs";
  }

  static get response() {
    return AccountConsumableDefsResponse;
  }

  

  static handler(req, res) {
    var session = "";
    try {
      var body = JSON.parse(req);
      session = body.session || "";
    } catch (e) {}
    var raw = getCachedconsumableBody();
    var withSession = raw.replace('{', '{"session":"' + session + '",', 1);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.write(withSession);
    return res;
  }
}




let cachedconsumableBody = null;
function getCachedconsumableBody() {
  if (cachedconsumableBody) return cachedconsumableBody;
  const data = SkyConsumableDefs.singleton().toJSON();
  cachedconsumableBody = JSON.stringify({ "get_consumable_defs": data });
  return cachedconsumableBody;
}

module.exports = AccountConsumableDefsRequest;
