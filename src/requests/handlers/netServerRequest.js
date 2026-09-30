
const pl = require("path");
const { LOGE } = require("../../utils/logger.js");
const { ServerPlayerBarn, ServerPlayer } = require("../../runtimeData/player.js");
const { IJsonable } = require("../../utils/helperClasses.js");

/** Request. */
class NetServerRequest extends IJsonable {
  /**
   * Get the path of the request.
   */
  static get PATH() {
    return "";
  }

  /**
   * Get the related response constructor.
   */
  static get response() {
    return NetServerResponse;
  }

  /**
   * Register the request handler.
   * @param {Map<string,NetServerRequest>} R - Requests list.
   */
  static register(R) {
    R.set(pl.posix.normalize(this.PATH), this);
  }

  /**
   * Deserialize the object from JSON.
   * @param {object} obj 
   * @returns {NetServerRequest}
   */
  static deserialize(obj) {
    if (typeof obj !== "object")
      return new NetServerRequest();
    return new NetServerRequest(obj.user, obj.session);
  }

  /**
   * Handle the request.
   * @param {string} req - Request body string.
   * @param {object} res - Response. The handler don't need to call end().
   */
  static handler(req, res) {
    void req, res;
    LOGE("unsupported handler called.");
  }

  constructor(user, session) {
    super();
    this.session = session || "";
    this.user = user || "";
  }

  
  getSource() {
    var barn = ServerPlayerBarn.singleton();
    var player = barn.getPlayer(this.user);
    if (player) return player;
    

    try {
      player = barn.loadOfflinePlayer(this.user);
      if (player) {
        

        barn.players[this.user] = player;
      }
    } catch(e) {}
    return player;
  }

  /**
   * Serialize the request to JSON as a client.
   * @returns {object}
   */
  serialize() {
    return {
      user: this.user,
      user_id: this.user,
      session: this.session
    };
  }
}

/** Response. */
class NetServerResponse extends IJsonable {
  /**
   * Handle the response as a client.
   * @param {object} res - Response body string.
   */
  static handler(res) {
    void res;
  }

  constructor(session) {
    super();
    this.session = session || "";
  }

  /**
   * Set the session of the response.
   * @param {string} session 
   */
  setSession(session) {
    this.session = session;
  }

  /**
   * Serialize the responce to JSON as a server.
   * @returns {object}
   */
  serialize() {
    return {
      session: this.session
    };
  }

  /**
   * Serialize the response to JSON, and write the JSON to a response object.
   * @param {object} res - Response object.
   * @param {number} code - HTTP status code.
   */
  write(res, code = 200) {
    var value = JSON.stringify(this.toJSON());

    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.write(value);

    return res;
  }
}

/**
 * Simple requests, for those requests which only read data and don't need
 * to do other operations in the handler.
 */
class NetServerSimpleRequest extends NetServerRequest {
  static handler(req, res) {
    var request = this.deserialize(JSON.parse(req))
      , response = new this.response(request.session);

    return response.write(res);
  }

  static get response() {
    return NetServerSimpleResponse;
  }

  constructor(user, session) {
    super(user, session);
  }
}

/**
 * Simple responses.
 */
class NetServerSimpleResponse extends NetServerResponse {
  constructor(session) {
    super(session);
  }

  /**
   * Creates a template message.
   * @returns {object}
   */
  template() {
    return {};
  }

  serialize() {
    return Object.assign(super.serialize(), this.template());
  }
}

module.exports = {
  NetServerRequest,
  NetServerResponse,
  NetServerSimpleRequest,
  NetServerSimpleResponse
};
