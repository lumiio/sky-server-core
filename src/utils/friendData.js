// ============================================================






// ============================================================
const { SkyServerStore } = require("../runtimeData/db.js");

function getFriendData(playerId) {
  const raw = SkyServerStore.singleton().getString("friends_" + playerId);
  return raw ? JSON.parse(raw) : { friends: [], invites: [], blocked: [] };
}

function saveFriendData(playerId, data) {
  SkyServerStore.singleton().set("friends_" + playerId, JSON.stringify(data));
}

function addFriendBoth(uid1, uid2) {
  var d1 = getFriendData(uid1);
  var d2 = getFriendData(uid2);
  if (!d1.friends.find(f => f.id === uid2)) {
    d1.friends.push({ id: uid2, name: uid2.substring(0, 8), added_time: Date.now() });
    saveFriendData(uid1, d1);
  }
  if (!d2.friends.find(f => f.id === uid1)) {
    d2.friends.push({ id: uid1, name: uid1.substring(0, 8), added_time: Date.now() });
    saveFriendData(uid2, d2);
  }
}

module.exports = { getFriendData, saveFriendData, addFriendBoth };
