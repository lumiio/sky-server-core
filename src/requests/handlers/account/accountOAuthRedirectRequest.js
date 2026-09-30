
const { NetServerRequest } = require("../netServerRequest.js");
const OAuthAccounts = require("../../../oauthAccounts.js");
const { LOGW } = require("../../../utils/logger.js");

class AccountOAuthRedirectRequest extends NetServerRequest {
  static get PATH() {
    return "/account/auth/oauth_redirect";
  }

  static get response() {
    return null;
  }

  static handler(req, res, headers, method, query) {
    

    let token = "";
    try {
      token = new URLSearchParams(query || "").get("token") || "";
    } catch (e) { /* ignore */ }

    const rec = OAuthAccounts.validateToken(token);
    if (!rec) {
      LOGW("[oauth_redirect] invalid or expired token: " + (token ? token.substring(0, 8) + "..." : "(empty)"));
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        error: "invalid_token",
        reason: "Login credentials are invalid or expired. Please log in again"
      }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      id: rec.playerId,
      alias: rec.alias || rec.username,
      token: token
    }));
  }
}

module.exports = AccountOAuthRedirectRequest;
