
const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
const { NetServerRequest, NetServerResponse } = require("../netServerRequest.js");

class AccountGetMessagesResponse extends NetServerResponse {
  constructor(session) {
    super(session);
    this.messages = [];
  }

  serialize() {
    var result = super.serialize();
    return Object.assign(result, {
      "messages": this.messages
    });
  }
}

class AccountGetMessagesRequest extends NetServerRequest {
  static get PATH() {
    return "/account/messages";
  }

  static get response() {
    return AccountGetMessagesResponse;
  }

  static handler(req, res) {
    var body = {};
    try { body = JSON.parse(req); } catch (e) {}
    var playerId = body.user || body.player_id || body.user_id || "";
    var store = require("../../../runtimeData/db.js").SkyServerStore.singleton();

    var raw = store.getString("mail_" + playerId);
    var mailList = raw ? JSON.parse(raw) : [];

    

    var globalRaw = store.getString("global_mail");
    var globalList = globalRaw ? JSON.parse(globalRaw) : [];

    

    var receivedRaw = store.getString("global_mail_received_" + playerId);
    var receivedIds = receivedRaw ? JSON.parse(receivedRaw) : [];

    

    var newGlobal = globalList.filter(function(gm) {
      return receivedIds.indexOf(gm.id) === -1;
    });
    newGlobal.forEach(function(gm) {
      mailList.push(gm);
      receivedIds.push(gm.id);
    });
    if (newGlobal.length > 0) {
      store.set("mail_" + playerId, JSON.stringify(mailList));
      store.set("global_mail_received_" + playerId, JSON.stringify(receivedIds));
    }

    var msgs = mailList.map(function(m) {
      var mid = m.id || ("mail_" + (m.time || Date.now()));
      var hasGift = !!m.rewards;
      var claimed = m.claimed || false;

      

      var giftData = null;
      if (hasGift) {
        giftData = {
          type: claimed ? "claimed" : "unclaimed",
          rewards: m.rewards,
          claimable: !claimed
        };
      }

      return {
        

        id: mid,
        message_id: mid,
        msg_id: mid,
        uid: mid,

        

        type: m.type || "system",
        message_type: m.type || "system",
        category: m.type || "system",

        

        sender: m.sender || "Sky",
        sender_id: m.sender_id || "system",
        from: m.sender || "Sky",
        sender_name: m.sender || "Sky",

        

        title: m.title || "System Message",
        subject: m.title || "System Message",
        body: m.body || "",
        message: m.body || "",
        text: m.body || "",

        

        timestamp: m.time || Date.now(),
        time: m.time || Date.now(),
        created_at: m.time || Date.now(),
        date: m.time || Date.now(),

        

        read: !!m.read,
        is_read: !!m.read,
        seen: !!m.read,
        unread: !m.read,
        new: !m.read,

        

        has_gift: hasGift,
        has_gift_attachment: hasGift,
        gift: giftData,
        gift_data: giftData,
        rewards: m.rewards || null,
        attachment: hasGift ? { type: "reward", data: m.rewards } : null,
        attachments: hasGift ? [{ type: "reward", data: m.rewards }] : [],
        claimed: claimed,
        is_claimed: claimed,
        claimable: hasGift && !claimed,

        

        icon: m.icon || null,
        image_url: m.image_url || null,
        expiry: m.expiry || null,
        action: m.action || null
      };
    });

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      messages: msgs,
      total: msgs.length,
      count: msgs.length,
      unread_count: msgs.filter(function(m) { return !m.read; }).length,
      unread: msgs.filter(function(m) { return !m.read; }).length,
      last_updated: Math.floor(Date.now() / 1000)
    }));
  }
}

module.exports = AccountGetMessagesRequest;
