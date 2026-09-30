
const { ServerPlayerUnlockEntry } = require("../../../runtimeData/player/serverPlayerUnlocks.js");
const { LOGI } = require("../../../utils/logger.js");
const { NetServerRequest, NetServerResponse } = require("../netServerRequest.js");

class ServiceAddUnlockResponse extends NetServerResponse {
  static createFromPlayer(player, entry) {
    var result = new ServiceAddUnlockResponse(player.session);

    result.unlocks = [entry];

    return result;
  }

  constructor(session) {
    super(session);

    this.unlocks = [];
  }

  serialize() {
    var result = super.serialize();

    return Object.assign(result, {
      "result": "ok",
      "update_status_unlocks": this.unlocks
    });
  }
}

class ServiceAddUnlockRequest extends NetServerRequest {
  static get PATH() {
    return "/service/status/api/v1/add_unlock";
  }

  static get response() {
    return ServiceAddUnlockResponse;
  }

  static deserialize(req) {
    var result = new ServiceAddUnlockRequest(req.user, req.session);

    result.name = req.name || "";
    result.ack = req.ack || false;

    return result;
  }

  constructor(user, session) {
    super(user, session);

    this.name = "";
    this.ack = false;
  }

  static handler(req, res) {
    var request = ServiceAddUnlockRequest.deserialize(JSON.parse(req))
      , player = request.getSource()
      , unlock, response, entry;

    if (!player) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.write(JSON.stringify({ "result": "ok", "update_status_unlocks": [] }));
      return;
    }

    unlock = ServerPlayerUnlockEntry.createLevelUnlock(request.name, request.ack);
    entry = player.serviceUnlocks.addUnlock(unlock);
    response = ServiceAddUnlockResponse.createFromPlayer(player, entry);
    LOGI(`add unlock ${entry.name} for player ${player.id}`);

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.write(JSON.stringify(response.serialize()));
  }
}

module.exports = ServiceAddUnlockRequest;
