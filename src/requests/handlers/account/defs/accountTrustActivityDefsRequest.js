
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountTrustActivityDefsResponse extends NetServerSimpleResponse {
  template() {
    return { "get_trust_activity_defs": [] };
  }
}

class AccountTrustActivityDefsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/trust/get_trust_activity_defs";
  }

  static get response() {
    return AccountTrustActivityDefsResponse;
  }
}

module.exports = AccountTrustActivityDefsRequest;
