
const { SkySpiritShopDefs } = require("../../../../staticData/spiritShop.js");
const { NetServerRequest, NetServerResponse } = require("../../netServerRequest.js");

class AccountGetSpiritShopsResponse extends NetServerResponse {
  static create(player, clientVersion, offset, limit) {
    var result = new AccountGetSpiritShopsResponse(player ? player.session : "");
    var SERVER_VERSION = 1;

    

    var allShops = SkySpiritShopDefs.singleton().toJSON();
    var off = offset || 0;
    result.spiritShops = allShops.slice(off);
    result.maxCount = allShops.length;
    result.version = SERVER_VERSION;
    return result;
  }

  constructor(session) {
    super(session);

    this.spiritShops = [];
    this.maxCount = 0;
    this.version = 0;
  }

  serialize() {
    var result = super.serialize();

    return Object.assign(result, {
      "spirit_shops": this.spiritShops,
      "spirit_shops_total_count": this.maxCount,
      "spirit_shops_version": this.version
    });
  }
}

class AccountGetSpiritShopsRequest extends NetServerRequest {
  static get PATH() {
    return "/account/get_spirit_shops";
  }

  static get response() {
    return AccountGetSpiritShopsResponse;
  }

  static deserialize(req) {
    var result = new AccountGetSpiritShopsRequest(req.user, req.session);

    result.limit = req.l || 0;
    result.offset = req.o || 0;
    result.version = req.v || 0;

    return result;
  }

  constructor(user, session) {
    super(user, session);

    this.limit = 0;
    this.offset = 0;
    this.version = 0;
  }

  static handler(req, res) {
    try {
      var request = AccountGetSpiritShopsRequest.deserialize(JSON.parse(req))
        , player = request.getSource()
        , response = AccountGetSpiritShopsResponse.create(player, request.version, request.offset, request.limit);
      return response.write(res);
    } catch(e) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ spirit_shops: [], spirit_shops_total_count: 0, spirit_shops_version: 1 }));
    }
  }
}

module.exports = AccountGetSpiritShopsRequest;
