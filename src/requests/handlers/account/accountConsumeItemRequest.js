
const crypto = require("crypto");
const { NetServerResponse, NetServerRequest } = require("../netServerRequest.js");

class AccountConsumeItemResponse extends NetServerResponse {
  static createFromPlayer(player, items = [], buffs = []) {
    var result = new AccountConsumeItemResponse(player.session);

    if (typeof player !== "object")
      return result;

    result.status = "success";
    result.buffs = buffs;
    result.items = items;
    result.newHeight = player.outfit.height;
    result.sign = crypto.randomBytes(32).toString("hex");

    return result;
  }

  constructor(session) {
    super(session);

    this.status = "failed";
    this.buffs = [];
    this.items = [];
    this.sharedResults = [];
    this.sign = "";
    this.newHeight = 1.0;
  }

  serialize() {
    var result = super.serialize();

    return Object.assign(
      result,
      {
        "consume_item": this.status,
        "get_buffs": this.buffs,
        "get_buffs_sign": this.sign,
        "get_consumables": this.items,
        "shared_results": this.sharedResults,
        "new_height": this.newHeight
      }
    );
  }
}

class AccountConsumeItemRequest extends NetServerRequest {
  static get PATH() {
    return "/account/consumable/consume_item1";
  }

  static get response() {
    return AccountConsumeItemResponse;
  }

  static handler(req, res) {
    var request = AccountConsumeItemRequest.deserialize(JSON.parse(req))
      , player = request.getSource()
      , response;

    player.consumeItem(request.id);

    response = AccountConsumeItemResponse.createFromPlayer(
      player,
      player.consumables.toJSON(),
      player.buffs.toJSON());

    return response.write(res);
  }

  static deserialize(req) {
    if (typeof req !== "object")
      return new AccountConsumeItemRequest();

    var result = new AccountConsumeItemRequest(req.user, req.session);

    result.count = req.consumable_count;
    result.id = req.consumable_id;
    result.receivers = req.receiver_uuid

    return result;
  }

  constructor(user, session) {
    super(user, session);

    this.count = 0;
    this.id = 0;
    this.receivers = [];
  }
}

module.exports = AccountConsumeItemRequest;
