// ============================================================


// ============================================================
const { SkyServerStore } = require("../runtimeData/db.js");

function getMailData(playerId) {
  const raw = SkyServerStore.singleton().getString("mail_" + playerId);
  return raw ? JSON.parse(raw) : [];
}

function saveMailData(playerId, mailList) {
  SkyServerStore.singleton().set("mail_" + playerId, JSON.stringify(mailList));
}

module.exports = { getMailData, saveMailData };
