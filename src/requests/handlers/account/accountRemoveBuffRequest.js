
const crypto = require("crypto");
const { NetServerResponse, NetServerRequest } = require("../netServerRequest.js");
const { ServerPlayerBuffs } = require("../../../runtimeData/player/serverPlayerBuffs.js");

class AccountRemoveBuffResponse extends NetServerResponse {
  static create(player) {
    var result = new AccountRemoveBuffResponse(player.session);

    if (typeof player !== "object")
      return result;

    result.status = "success";
    result.buffs = player.buffs;
    result.sign = crypto.randomBytes(32).toString("hex");

    return result;
  }

  constructor(session) {
    super(session);

    this.status = "failed";
    this.buffs = new ServerPlayerBuffs();
    this.sign = "";
  }

  serialize() {
    var result = super.serialize();

    return Object.assign(
      result,
      {
        "get_buffs": this.buffs.toJSON(),
        "get_buffs_sign": this.sign,
        "remove_buff": this.status
      }
    );
  }
}

class AccountRemoveBuffRequest extends NetServerRequest {
  static get PATH() {
    return "/account/buff/remove_buff1";
  }

  static get response() {
    return AccountRemoveBuffResponse;
  }

  static handler(req, res) {
    var request = AccountRemoveBuffRequest.deserialize(JSON.parse(req))
      , player = request.getSource()
      , response;

    player.removeBuff(request.id);
    response = AccountRemoveBuffResponse.create(player);

    return response.write(res);
  }

  static deserialize(req) {
    if (typeof req !== "object")
      return new AccountRemoveBuffRequest();

    var result = new AccountRemoveBuffRequest(req.user, req.session);

    result.id = req.buff_id;
    result.giver = req.giver;

    return result;
  }

  constructor(user, session) {
    super(user, session);

    this.id = 0;
    this.giver = "";
  }
}

module.exports = AccountRemoveBuffRequest;
