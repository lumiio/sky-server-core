
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountTrustGroupDefsResponse extends NetServerSimpleResponse {
  template() {
    return { "get_trust_group_defs": [] };
  }
}

class AccountTrustGroupDefsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/trust/get_trust_group_defs";
  }

  static get response() {
    return AccountTrustGroupDefsResponse;
  }
}

module.exports = AccountTrustGroupDefsRequest;
