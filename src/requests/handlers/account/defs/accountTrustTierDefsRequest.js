
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountTrustTierDefsResponse extends NetServerSimpleResponse {
  template() {
    return { "get_trust_tier_defs": [] };
  }
}

class AccountTrustTierDefsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/trust/get_trust_tier_defs";
  }

  static get response() {
    return AccountTrustTierDefsResponse;
  }
}

module.exports = AccountTrustTierDefsRequest;
