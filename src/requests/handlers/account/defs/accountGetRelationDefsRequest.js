
const { SkyRelationDefs } = require("../../../../staticData/relationship.js");
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountGetRelationDefsResponse extends NetServerSimpleResponse {
  template() {
    

    var rels = SkyRelationDefs.singleton().toJSON();
    return {
      "relationship_defs": rels
    };
  }
}

class AccountGetRelationDefsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/get_relationship_abilities";
  }

  static get response() {
    return AccountGetRelationDefsResponse;
  }

  

  static handler(req, res) {
    var session = "";
    try {
      var body = JSON.parse(req);
      session = body.session || "";
    } catch (e) {}
    var raw = getCachedrelBody();
    var withSession = raw.replace('{', '{"session":"' + session + '",', 1);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.write(withSession);
    return res;
  }
}




let cachedrelBody = null;
function getCachedrelBody() {
  if (cachedrelBody) return cachedrelBody;
  const data = SkyRelationDefs.singleton().toJSON();
  cachedrelBody = JSON.stringify({ "relationship_defs": data });
  return cachedrelBody;
}

module.exports = AccountGetRelationDefsRequest;
