

const path = require("path");
const http = require("http");
const { PUBLIC_HOST, gamePort } = require("../../../publicHost.js");













let _barn = null, _store = null;
function barn() {
  if (!_barn) _barn = require("../../../runtimeData/player.js").ServerPlayerBarn.singleton();
  return _barn;
}
function store() {
  if (!_store) _store = require("../../../runtimeData/db.js").SkyServerStore.singleton();
  return _store;
}

const nowSec = () => Math.floor(Date.now() / 1000);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);


function getDoc(ns, user) {
  const raw = store().getString(`svc:${ns}:${user}`);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

function putDoc(ns, user, doc) {
  try { store().set(`svc:${ns}:${user}`, JSON.stringify(doc)); } catch (e) {}
}


function allUserDocs(ns) {
  const out = {};
  try {
    const ks = store().keys(`svc:${ns}:`) || [];
    for (const k of ks) {
      const u = k.slice(("svc:" + ns + ":").length);
      if (!u) continue;
      const raw = store().getString(k);
      if (!raw) continue;
      try { out[u] = JSON.parse(raw); } catch (e) {}
    }
  } catch (e) {}
  return out;
}


function playerName(id) {
  const b = barn();
  const online = b.players && b.players[id];
  if (online && online.name) return online.name;
  const ap = (b.allPlayers && b.allPlayers[id]) || {};
  return ap.name || (id ? String(id).slice(0, 8) : "unknown");
}


function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  try { return JSON.parse(body); } catch (e) { return {}; }
}


function getPlayer(user) {
  const b = barn();
  let p = b.players ? b.players[user] : null;
  if (p) return p;
  try { p = b.loadOfflinePlayer ? b.loadOfflinePlayer(user) : null; } catch (e) {}
  return p || null;
}

// ============================================================


//  ctx = { user, session, player }
// ============================================================
const H = {};







H["/service/infraction/api/v1/get_infractions_status_decorated"] = (b, ctx) => {
  const doc = getDoc("infr", ctx.user);
  const list = Array.isArray(doc.infractions) ? doc.infractions : [];
  const now = nowSec();
  const active = list.filter(x => (x.active_until || 0) > now);
  return {
    infractions: list.map(x => ({
      infraction_id: x.infraction_id || x.id || "",
      id: x.infraction_id || x.id || "",
      reference_id: x.reference_id || x.infraction_id || x.id || "",
      reason: x.reason || "",
      message: x.reason || "",
      type: x.type || "system_ban_type_cheating",
      active_until: x.active_until || x.until || 0,
      until: x.active_until || x.until || 0,
      expires_at: x.active_until || x.until || 0,
      created_at: x.created_at || 0,
      created: x.created_at || 0,
      appealable: !!x.appealable,
      active: (x.active_until || 0) > now,
      info: {
        reason: x.reason || "",
        type: x.type || "system_ban_type_cheating",
        reference_id: x.reference_id || x.infraction_id || x.id || ""
      }
    })),
    total: list.length,
    count: list.length,
    banned: active.length > 0,
    is_banned: active.length > 0,
    active_count: active.length,
    last_updated: now,
    baninfo: active.length > 0 ? {
      reason: active[0].reason || "",
      type: active[0].type || "system_ban_type_cheating",
      active_until: active[0].active_until || 0
    } : null
  };
};

H["/service/infraction/api/v1/get_infractions_status_many"] = (b, ctx) => {
  const ids = Array.isArray(b.user_ids) ? b.user_ids : [ctx.user];
  const results = {};
  const now = nowSec();
  for (const id of ids) {
    const doc = getDoc("infr", id);
    const list = Array.isArray(doc.infractions) ? doc.infractions : [];
    results[id] = list.map(x => ({
      infraction_id: x.infraction_id || x.id || "",
      reason: x.reason || "",
      type: x.type || "system_ban_type_cheating",
      active_until: x.active_until || x.until || 0,
      active: (x.active_until || 0) > now
    }));
  }
  return { infractions: results[ctx.user] || [], total: (results[ctx.user] || []).length, results };
};



H["/service/inventory/api/v1/unlocks/delete_many"] = (b, ctx) => {
  const names = Array.isArray(b.names) ? b.names : (Array.isArray(b.unlocks) ? b.unlocks : []);
  const deleted = [], notFound = [];
  const p = ctx.player;
  if (p && p.serviceUnlocks) {
    for (const n of names) {
      const e = p.serviceUnlocks.removeUnlock(String(n));
      if (e) deleted.push(n); else notFound.push(n);
    }
    if (deleted.length) p.save();
  }
  return { success: true, deleted, not_found: notFound };
};

H["/service/inventory/api/v1/unlocks/remove_dye"] = (b, ctx) => {
  const color = String(b.color || b.dye || "").toLowerCase();
  let removed = 0;
  const p = ctx.player;
  if (p && p.currency && p.currency.dye && color && p.currency.dye[color] > 0) {
    removed = 1;
    p.currency.dye[color] -= 1;
    p.save();
  }
  return { success: true, dye: removed ? { color, remaining: p.currency.dye[color] } : null, remaining: removed ? p.currency.dye[color] : 0 };
};



function listMessages(ctx, includeRead) {
  const doc = getDoc("msg", ctx.user);
  let list = Array.isArray(doc.messages) ? doc.messages.slice() : [];
  if (!includeRead) list = list.filter(m => !m.seen);
  list.sort((a, b2) => (b2.time || 0) - (a.time || 0));
  return list;
}

H["/service/message/api/v1/get"] = (b, ctx) => {
  const list = listMessages(ctx, true);
  const unread = list.filter(m => !m.seen).length;
  return { messages: list, total: list.length, unread, has_more: false, next_cursor: "" };
};
H["/service/message/api/v1/mark_received"] = (b, ctx) => {
  const ids = Array.isArray(b.ids) ? b.ids : [];
  const doc = getDoc("msg", ctx.user);
  const ms = Array.isArray(doc.messages) ? doc.messages : [];
  const marked = [];
  for (const m of ms) if (ids.includes(m.id)) { m.received = true; marked.push(m.id); }
  doc.messages = ms; putDoc("msg", ctx.user, doc);
  return { success: true, marked, failed: ids.filter(x => !marked.includes(x)) };
};
H["/service/message/api/v1/mark_seen"] = (b, ctx) => {
  const ids = Array.isArray(b.ids) ? b.ids : [];
  const doc = getDoc("msg", ctx.user);
  const ms = Array.isArray(doc.messages) ? doc.messages : [];
  const marked = [];
  for (const m of ms) if (ids.includes(m.id)) { m.seen = true; marked.push(m.id); }
  doc.messages = ms; putDoc("msg", ctx.user, doc);
  return { success: true, marked, failed: ids.filter(x => !marked.includes(x)) };
};
H["/service/message/api/v1/redeem"] = (b, ctx) => {
  const id = String(b.message_id || b.id || "");
  const doc = getDoc("msg", ctx.user);
  const ms = Array.isArray(doc.messages) ? doc.messages : [];
  const m = ms.find(x => x.id === id);
  if (!m) return { success: false, message: null, rewards: [], already_redeemed: false };
  if (m.redeemed) return { success: true, message: m, rewards: m.rewards || [], already_redeemed: true };
  m.redeemed = true; m.redeemed_at = nowSec();
  doc.messages = ms; putDoc("msg", ctx.user, doc);
  return { success: true, message: m, rewards: m.rewards || [], already_redeemed: false };
};
H["/service/message/api/v2/get_all"] = (b, ctx) => {
  const list = listMessages(ctx, true);
  const unread = list.filter(m => !m.seen).length;
  const times = list.map(m => m.time || 0);
  return {
    messages: list, total: list.length, unread,
    oldest: times.length ? Math.min(...times) : 0,
    newest: times.length ? Math.max(...times) : 0,
    has_more: false
  };
};



H["/service/quest/api/v1/create"] = (b, ctx) => {
  const qid = String(b.quest_id || b.id || b.quest_def_id || uid());
  const doc = getDoc("quest", ctx.user);
  doc.quests = doc.quests || {};
  if (doc.quests[qid]) return { success: true, quest: doc.quests[qid], quest_id: qid, state: doc.quests[qid].state };
  doc.quests[qid] = {
    id: qid, template_id: b.template_id || b.quest_def_id || "",
    state: "available", progress: 0, claimed: false,
    started_at: nowSec(), end_time: 0, data: b.data || {}
  };
  putDoc("quest", ctx.user, doc);
  return { success: true, quest: doc.quests[qid], quest_id: qid, state: "available" };
};
H["/service/quest/api/v1/get_player_quests_by_id"] = (b, ctx) => {
  const ids = Array.isArray(b.ids) ? b.ids : [];
  const doc = getDoc("quest", ctx.user);
  const all = doc.quests || {};
  const quests = ids.map(i => all[i]).filter(Boolean);
  return { quests, total: quests.length, not_found: ids.filter(i => !all[i]) };
};
H["/service/quest/api/v1/update_quest"] = (b, ctx) => {
  const qid = String(b.quest_id || b.id || "");
  const doc = getDoc("quest", ctx.user);
  doc.quests = doc.quests || {};
  const q = doc.quests[qid];
  if (!q) return { success: false, quest: null, progress: 0, claimed: false };
  if (typeof b.progress === "number") q.progress = b.progress;
  if (b.state) q.state = b.state;
  if (b.claimed !== undefined) q.claimed = !!b.claimed;
  q.updated_at = nowSec();
  putDoc("quest", ctx.user, doc);
  return { success: true, quest: q, progress: q.progress, claimed: q.claimed };
};



H["/service/recording/api/v1/create"] = (b, ctx) => {
  const rid = uid();
  const doc = getDoc("rec", ctx.user);
  doc.recordings = doc.recordings || {};
  doc.recordings[rid] = {
    id: rid, version: 1, segments: [], created_at: nowSec(),
    map: b.map || "", duration: 0, upload_url: ""
  };
  putDoc("rec", ctx.user, doc);
  return { success: true, recording_id: rid, recording: doc.recordings[rid], upload_url: "" };
};
H["/service/recording/api/v1/get"] = (b, ctx) => {
  const rid = String(b.recording_id || b.id || "");
  const doc = getDoc("rec", ctx.user);
  const rec = (doc.recordings || {})[rid] || null;
  return { recording: rec, segments: rec ? rec.segments : [], total_segments: rec ? rec.segments.length : 0, found: !!rec };
};
H["/service/recording/api/v2/create"] = (b, ctx) => {
  const rid = uid();
  const doc = getDoc("rec", ctx.user);
  doc.recordings = doc.recordings || {};
  doc.recordings[rid] = { id: rid, version: 2, segments: [], created_at: nowSec(), map: b.map || "" };
  putDoc("rec", ctx.user, doc);
  return { success: true, recording_id: rid, recording: doc.recordings[rid], upload_url: "", version: 2 };
};
H["/service/recording/api/v2/get"] = (b, ctx) => {
  const rid = String(b.recording_id || b.id || "");
  const doc = getDoc("rec", ctx.user);
  const rec = (doc.recordings || {})[rid] || null;
  return { recording: rec, segments: rec ? rec.segments : [], total_segments: rec ? rec.segments.length : 0, found: !!rec, version: 2 };
};
H["/service/recording/api/v2/update"] = (b, ctx) => {
  const rid = String(b.recording_id || b.id || "");
  const doc = getDoc("rec", ctx.user);
  const rec = (doc.recordings || {})[rid];
  if (!rec) return { success: false, recording: null, version: 2 };
  if (Array.isArray(b.segments)) rec.segments = b.segments;
  if (typeof b.duration === "number") rec.duration = b.duration;
  rec.updated_at = nowSec();
  putDoc("rec", ctx.user, doc);
  return { success: true, recording: rec, version: 2 };
};



H["/service/relationship/api/v1/add_follow"] = (b, ctx) => {
  const target = String(b.target_user_id || b.user_id || b.to || "");
  if (!target) return { success: false, follow: null, follower_count: 0 };
  const doc = getDoc("rel", ctx.user);
  doc.following = doc.following || {};
  doc.following[target] = { since: nowSec() };
  

  const td = getDoc("rel", target);
  td.followers = td.followers || {};
  td.followers[ctx.user] = { since: nowSec() };
  putDoc("rel", ctx.user, doc); putDoc("rel", target, td);
  return { success: true, follow: { target, since: doc.following[target].since }, follower_count: Object.keys(td.followers).length };
};
H["/service/relationship/api/v1/batch_set_friend_soft_delete"] = (b, ctx) => {
  const ids = Array.isArray(b.ids) ? b.ids : (Array.isArray(b.friend_ids) ? b.friend_ids : []);
  const soft = !!b.soft_delete;
  const doc = getDoc("rel", ctx.user);
  doc.softDeleted = doc.softDeleted || {};
  const updated = [];
  for (const id of ids) {
    if (soft) doc.softDeleted[id] = { at: nowSec() };
    else delete doc.softDeleted[id];
    updated.push(id);
  }
  putDoc("rel", ctx.user, doc);
  return { success: true, updated, failed: [] };
};
H["/service/relationship/api/v1/check_follow"] = (b, ctx) => {
  const target = String(b.target_user_id || b.user_id || "");
  const mine = getDoc("rel", ctx.user);
  const theirs = getDoc("rel", target || "__none__");
  const following = !!(mine.following && mine.following[target]);
  const follower = !!(theirs.following && theirs.following[ctx.user]);
  return { following, follower, mutual: following && follower };
};
H["/service/relationship/api/v1/delete_follow"] = (b, ctx) => {
  const target = String(b.target_user_id || b.user_id || "");
  const doc = getDoc("rel", ctx.user);
  if (doc.following) delete doc.following[target];
  putDoc("rel", ctx.user, doc);
  const td = getDoc("rel", target);
  if (td.followers) delete td.followers[ctx.user];
  putDoc("rel", target, td);
  return { success: true, follow: null };
};
H["/service/relationship/api/v1/free_gifts/claim"] = (b, ctx) => {
  const gid = String(b.gift_id || b.id || "");
  const doc = getDoc("gift", ctx.user);
  const list = Array.isArray(doc.gifts) ? doc.gifts : [];
  const g = list.find(x => x.id === gid);
  if (!g) return { success: false, gift: null, rewards: [], already_claimed: false };
  if (g.claimed) return { success: true, gift: g, rewards: g.rewards || [], already_claimed: true };
  g.claimed = true; g.claimed_at = nowSec();
  doc.gifts = list; putDoc("gift", ctx.user, doc);
  return { success: true, gift: g, rewards: g.rewards || [], already_claimed: false };
};
H["/service/relationship/api/v1/free_gifts/send"] = (b, ctx) => {
  const to = String(b.to || b.target_user_id || "");
  if (!to) return { success: false, gift_id: "", sent_to: "", remaining_today: 0 };
  const gid = uid();
  const doc = getDoc("gift", to);
  doc.gifts = doc.gifts || [];
  doc.gifts.push({ id: gid, from: ctx.user, to, time: nowSec(), claimed: false, rewards: b.rewards || [] });
  putDoc("gift", to, doc);
  return { success: true, gift_id: gid, sent_to: to, remaining_today: 0 };
};
H["/service/relationship/api/v1/get_all_followed_creators"] = (b, ctx) => {
  const doc = getDoc("rel", ctx.user);
  const creators = Object.keys(doc.following || {});
  return {
    creators: creators.map(id => ({
      id,
      name: playerName(id),
      followed_at: (doc.following[id] || {}).since || 0
    })),
    total: creators.length, has_more: false
  };
};
H["/service/relationship/api/v1/get_follow"] = (b, ctx) => {
  const target = String(b.target_user_id || b.user_id || "");
  const mine = getDoc("rel", ctx.user);
  const theirs = getDoc("rel", target || "__none__");
  const following = !!(mine.following && mine.following[target]);
  const follower = !!(theirs.following && theirs.following[ctx.user]);
  return { follow: following ? { target, since: (mine.following[target] || {}).since || 0 } : null, following, follower };
};
H["/service/relationship/api/v1/get_followed_creators_count"] = (b, ctx) => {
  const doc = getDoc("rel", ctx.user);
  return { count: Object.keys(doc.following || {}).length, limit: 100 };
};
H["/service/relationship/api/v1/get_friend_statue"] = (b, ctx) => {
  const friendId = String(b.friend_id || b.user_id || "");
  const doc = getDoc("rel", ctx.user);
  const statues = doc.statues || {};
  const s = statues[friendId] || null;
  return { statue: s, found: !!s, state: s ? s.state : "missing" };
};
H["/service/relationship/api/v1/get_soft_deleted_friend_by_id"] = (b, ctx) => {
  const id = String(b.friend_id || b.user_id || "");
  const doc = getDoc("rel", ctx.user);
  const sd = (doc.softDeleted || {})[id];
  return { friend: sd ? { id, deleted_at: sd.at || 0 } : null, found: !!sd, deleted_at: sd ? sd.at : 0 };
};
H["/service/relationship/api/v1/set_follow_name"] = (b, ctx) => {
  const target = String(b.target_user_id || b.user_id || "");
  const name = String(b.name || "");
  const doc = getDoc("rel", ctx.user);
  doc.followNames = doc.followNames || {};
  doc.followNames[target] = name;
  putDoc("rel", ctx.user, doc);
  return { success: true, name };
};
H["/service/relationship/api/v1/set_friend_soft_delete"] = (b, ctx) => {
  const id = String(b.friend_id || b.user_id || "");
  const soft = b.soft_delete !== false;
  const doc = getDoc("rel", ctx.user);
  doc.softDeleted = doc.softDeleted || {};
  if (soft) doc.softDeleted[id] = { at: nowSec() }; else delete doc.softDeleted[id];
  putDoc("rel", ctx.user, doc);
  return { success: true, friend_id: id, soft_deleted: soft };
};
H["/service/relationship/api/v1/update_friend_constellation_pages"] = (b, ctx) => {
  const doc = getDoc("rel", ctx.user);
  doc.constellation = doc.constellation || [];
  if (Array.isArray(b.pages)) doc.constellation = b.pages;
  putDoc("rel", ctx.user, doc);
  return { success: true, pages: doc.constellation, total_pages: doc.constellation.length };
};



H["/service/reservation/api/v1/cast_member/remove_self"] = (b, ctx) => {
  const doc = getDoc("resv", ctx.user);
  doc.member = false;
  putDoc("resv", ctx.user, doc);
  return { success: true, removed: true };
};
H["/service/reservation/api/v1/event_queuing/player_acknowledged"] = (b, ctx) => {
  return { success: true, acknowledged: true, queue_id: String(b.queue_id || "") };
};
H["/service/reservation/api/v1/event_queuing/player_enqueue"] = (b, ctx) => {
  const qid = uid();
  const doc = getDoc("resv", ctx.user);
  doc.queue = { queue_id: qid, position: 0, enqueued_at: nowSec(), event: b.event || "" };
  putDoc("resv", ctx.user, doc);
  return { success: true, queue_id: qid, position: 0, estimated_wait_seconds: 0, enqueued_at: nowSec() };
};
H["/service/reservation/api/v1/reserve"] = async (b, ctx) => {
  const rid = uid();
  const doc = getDoc("resv", ctx.user);
  doc.reservation = { id: rid, server: PUBLIC_HOST, port: gamePort, expires_at: nowSec() + 300, position: 0, at: nowSec() };
  putDoc("resv", ctx.user, doc);
  return { success: true, reservation_id: rid, server: PUBLIC_HOST, port: gamePort, expires_at: nowSec() + 300, position: 0 };
};



H["/service/social-feed/api/v1/attempt"] = (b, ctx) => {
  const doc = getDoc("feed", ctx.user);
  doc.daily_used = doc.daily_used || 0;
  const limit = 99;
  const left = Math.max(0, limit - doc.daily_used);
  return { success: left > 0, feed: null, attempts_left: left, daily_limit: limit };
};
H["/service/social-feed/api/v1/create"] = (b, ctx) => {
  const fid = uid();
  const doc = getDoc("feed", ctx.user);
  doc.feeds = doc.feeds || [];
  

  const feed = Object.assign({
    id: fid, author: ctx.user,
    likes: 0, reactions: [], comments: 0,
    created_at: nowSec(), updated_at: nowSec()
  }, b, { id: fid, author: ctx.user });
  doc.feeds.unshift(feed);
  doc.daily_used = (doc.daily_used || 0) + 1;
  putDoc("feed", ctx.user, doc);
  return { success: true, feed_id: fid, feed, created_at: nowSec() };
};
H["/service/social-feed/api/v1/delete"] = (b, ctx) => {
  const fid = String(b.feed_id || b.id || "");
  const doc = getDoc("feed", ctx.user);
  doc.feeds = (doc.feeds || []).filter(f => f.id !== fid);
  putDoc("feed", ctx.user, doc);
  return { success: true, feed_id: fid };
};
H["/service/social-feed/api/v1/edit"] = (b, ctx) => {
  const fid = String(b.feed_id || b.id || "");
  const doc = getDoc("feed", ctx.user);
  const f = (doc.feeds || []).find(x => x.id === fid);
  if (!f) return { success: false, feed: null, edited_at: nowSec() };
  if (b.text !== undefined) f.text = b.text;
  f.updated_at = nowSec();
  putDoc("feed", ctx.user, doc);
  return { success: true, feed: f, edited_at: nowSec() };
};
H["/service/social-feed/api/v1/get_accumulated_likes_count"] = (b, ctx) => {
  const doc = getDoc("feed", ctx.user);
  const count = (doc.feeds || []).reduce((s, f) => s + (f.likes || 0), 0);
  return { count, feed_id: String(b.feed_id || "") };
};
H["/service/social-feed/api/v1/get_by_ids"] = (b, ctx) => {
  const ids = Array.isArray(b.ids) ? b.ids : [];
  

  const all = allUserDocs("feed");
  const found = [];
  for (const [author, doc] of Object.entries(all)) {
    for (const f of (doc.feeds || [])) {
      if (ids.includes(f.id) && !found.some(x => x.id === f.id)) {
        found.push(Object.assign({}, f, { author_name: playerName(f.author || author) }));
      }
    }
  }
  return { feeds: found, total: found.length, not_found: ids.filter(i => !found.some(f => f.id === i)) };
};
H["/service/social-feed/api/v1/get_reactions"] = (b, ctx) => {
  const fid = String(b.feed_id || b.id || "");
  const doc = getDoc("feed", ctx.user);
  const f = (doc.feeds || []).find(x => x.id === fid);
  return { reactions: f ? (f.reactions || []) : [], total: f ? (f.reactions || []).length : 0, my_reaction: null };
};
H["/service/social-feed/api/v1/get_user_feeds"] = (b, ctx) => {
  const target = String(b.user_id || b.author_id || ctx.user);
  const doc = getDoc("feed", target);
  const list = (doc.feeds || []).map(f => Object.assign({}, f, { author_name: playerName(f.author || target) }));
  return { feeds: list, total: list.length, has_more: false, next_cursor: "" };
};
H["/service/social-feed/api/v1/has_super_like_broadcaster"] = (b, ctx) => {
  return { has_super_like: false, broadcaster: null };
};
H["/service/social-feed/api/v1/hide"] = (b, ctx) => {
  const fid = String(b.feed_id || b.id || "");
  const doc = getDoc("feed", ctx.user);
  doc.hidden = doc.hidden || [];
  if (!doc.hidden.includes(fid)) doc.hidden.push(fid);
  putDoc("feed", ctx.user, doc);
  return { success: true, feed_id: fid };
};
H["/service/social-feed/api/v1/like"] = (b, ctx) => {
  const fid = String(b.feed_id || b.id || "");
  

  const all = allUserDocs("feed");
  let likes = 0, found = false;
  for (const [author, doc] of Object.entries(all)) {
    const f = (doc.feeds || []).find(x => x.id === fid);
    if (f) {
      f.likes = Math.max(0, (f.likes || 0) + (b.unlike ? -1 : 1));
      likes = f.likes; putDoc("feed", author, doc); found = true; break;
    }
  }
  return { success: found, feed_id: fid, likes, liked: !b.unlike };
};
H["/service/social-feed/api/v1/report"] = (b, ctx) => {
  const rid = uid();
  const doc = getDoc("feed", ctx.user);
  doc.reports = doc.reports || [];
  doc.reports.push({ id: rid, feed_id: b.feed_id || b.id || "", reason: b.reason || "", at: nowSec() });
  putDoc("feed", ctx.user, doc);
  return { success: true, report_id: rid, feed_id: String(b.feed_id || "") };
};
H["/service/social-feed/api/v1/succeed"] = (b, ctx) => {
  const fid = String(b.feed_id || b.id || "");
  const doc = getDoc("feed", ctx.user);
  const f = (doc.feeds || []).find(x => x.id === fid);
  if (f) { f.succeeded = true; f.succeeded_at = nowSec(); putDoc("feed", ctx.user, doc); }
  return { success: true, feed: f || null, rewards: [] };
};
H["/service/social-feed/api/v1/super_like"] = (b, ctx) => {
  const doc = getDoc("feed", ctx.user);
  doc.super_likes_left = Math.max(0, (doc.super_likes_left || 0) - 1);
  putDoc("feed", ctx.user, doc);
  return { success: true, remaining: doc.super_likes_left, feed_id: String(b.feed_id || "") };
};
H["/service/social-feed/api/v1/upgrade_message_boat"] = (b, ctx) => {
  const doc = getDoc("feed", ctx.user);
  doc.boat = { upgraded: true, upgraded_at: nowSec() };
  putDoc("feed", ctx.user, doc);
  return { success: true, boat: doc.boat, upgraded: true };
};
H["/service/social-feed/api/v2/comments"] = (b, ctx) => {
  const fid = String(b.feed_id || b.id || "");
  

  const all = allUserDocs("feed");
  let found = null, owner = "";
  for (const [author, doc] of Object.entries(all)) {
    const f = (doc.feeds || []).find(x => x.id === fid);
    if (f) { found = f; owner = author; break; }
  }
  

  if (b.text || b.comment || b.message) {
    if (!found) return { success: false, comments: [], total: 0 };
    found.comments_list = found.comments_list || [];
    const c = {
      id: uid(), author: ctx.user,
      name: playerName(ctx.user),
      text: String(b.text || b.comment || b.message || ""),
      created_at: nowSec()
    };
    found.comments_list.push(c);
    found.comments = (found.comments_list || []).length;
    if (owner) putDoc("feed", owner, all[owner]);
    return { success: true, comment: c, comments: found.comments_list, total: found.comments_list.length };
  }
  

  return { comments: found ? (found.comments_list || []) : [], total: found ? (found.comments_list || []).length : 0, has_more: false, next_cursor: "" };
};
H["/service/social-feed/api/v2/delete_penpal"] = (b, ctx) => {
  const doc = getDoc("penpal", ctx.user);
  doc.penpal = null; doc.matched_with = null;
  putDoc("penpal", ctx.user, doc);
  return { success: true, penpal_id: "" };
};
H["/service/social-feed/api/v2/enable_children"] = (b, ctx) => {
  const doc = getDoc("feed", ctx.user);
  doc.children_enabled = !!b.enabled;
  putDoc("feed", ctx.user, doc);
  return { success: true, enabled: doc.children_enabled };
};
H["/service/social-feed/api/v2/enable_comments"] = (b, ctx) => {
  const doc = getDoc("feed", ctx.user);
  doc.comments_enabled = b.enabled !== false;
  putDoc("feed", ctx.user, doc);
  return { success: true, enabled: doc.comments_enabled };
};
H["/service/social-feed/api/v2/get_child_feeds"] = (b, ctx) => {
  return { feeds: [], total: 0, has_more: false };
};
H["/service/social-feed/api/v2/get_curated_feeds"] = (b, ctx) => {
  

  const all = allUserDocs("feed");
  const merged = [];
  for (const [author, doc] of Object.entries(all)) {
    for (const f of (doc.feeds || [])) {
      merged.push(Object.assign({}, f, { author_name: playerName(f.author || author) }));
    }
  }
  merged.sort((x, y) => (y.created_at || 0) - (x.created_at || 0));
  return { feeds: merged, total: merged.length, has_more: false, next_cursor: "" };
};
H["/service/social-feed/api/v2/get_daily_free"] = (b, ctx) => {
  const doc = getDoc("feed", ctx.user);
  const used = doc.daily_used || 0;
  const limit = 99;
  const reset = (Math.floor(nowSec() / 86400) + 1) * 86400;
  return { available: used < limit, remaining: Math.max(0, limit - used), reset_at: reset, used_today: used };
};
H["/service/social-feed/api/v2/get_penpal_by_id"] = (b, ctx) => {
  const doc = getDoc("penpal", ctx.user);
  return { penpal: doc.penpal || null, found: !!doc.penpal };
};
H["/service/social-feed/api/v2/get_penpal_by_sender_receiver"] = (b, ctx) => {
  const doc = getDoc("penpal", ctx.user);
  return { penpal: doc.penpal || null, found: !!doc.penpal };
};
H["/service/social-feed/api/v2/get_penpals"] = (b, ctx) => {
  const doc = getDoc("penpal", ctx.user);
  const list = doc.penpal ? [doc.penpal] : [];
  return { penpals: list, total: list.length, has_more: false };
};
H["/service/social-feed/api/v2/get_penpal_status"] = (b, ctx) => {
  const doc = getDoc("penpal", ctx.user);
  return { has_penpal: !!doc.penpal, penpal: doc.penpal || null, cooldown_until: doc.cooldown_until || 0 };
};
H["/service/social-feed/api/v2/read_penpal"] = (b, ctx) => {
  const doc = getDoc("penpal", ctx.user);
  if (doc.penpal) doc.penpal.read = true;
  putDoc("penpal", ctx.user, doc);
  return { success: true, penpal: doc.penpal || null, read: true };
};
H["/service/social-feed/api/v2/report_penpal"] = (b, ctx) => {
  const rid = uid();
  const doc = getDoc("penpal", ctx.user);
  doc.reports = doc.reports || [];
  doc.reports.push({ id: rid, at: nowSec(), reason: b.reason || "" });
  putDoc("penpal", ctx.user, doc);
  return { success: true, report_id: rid, penpal_id: doc.penpal ? doc.penpal.id : "" };
};



H["/service/stage/api/v1/friends_in_apartments"] = (b, ctx) => {
  const online = Object.values(barn().players || {});
  const inApt = online.filter(p => {
    const d = getDoc("stage", p.id);
    return !!(d.apartment && d.apartment.id);
  });
  return { apartments: inApt.map(p => {
    const d = getDoc("stage", p.id);
    return { id: d.apartment.id, owner: p.id, name: playerName(p.id) };
  }), total: inApt.length, friends: inApt.map(p => p.id) };
};
H["/service/stage/api/v1/get"] = (b, ctx) => {
  const doc = getDoc("stage", ctx.user);
  const a = doc.apartment || null;
  return { apartment: a, occupants: a ? (a.occupants || []) : [], total_occupants: a ? (a.occupants || []).length : 0, found: !!a };
};
H["/service/stage/api/v1/leave_apartment"] = (b, ctx) => {
  const doc = getDoc("stage", ctx.user);
  doc.apartment = null;
  putDoc("stage", ctx.user, doc);
  return { success: true, apartment_id: "" };
};
H["/service/stage/api/v1/set"] = (b, ctx) => {
  const doc = getDoc("stage", ctx.user);
  const aid = String(b.apartment_id || b.id || uid());
  doc.apartment = { id: aid, owner: ctx.user, occupants: [ctx.user], status: b.status || "open", set_at: nowSec() };
  putDoc("stage", ctx.user, doc);
  return { success: true, apartment: doc.apartment, apartment_id: aid };
};
H["/service/stage/api/v1/update_apartment_status"] = (b, ctx) => {
  const doc = getDoc("stage", ctx.user);
  if (doc.apartment) {
    doc.apartment.status = b.status || doc.apartment.status;
    doc.apartment.occupancy = Array.isArray(doc.apartment.occupants) ? doc.apartment.occupants.length : 0;
    putDoc("stage", ctx.user, doc);
  }
  return { success: true, status: doc.apartment ? doc.apartment.status : null, occupancy: doc.apartment ? doc.apartment.occupancy : 0 };
};



H["/service/status/api/v1/ack_unlock"] = (b, ctx) => {
  const name = String(b.name || b.unlock_name || "");
  const p = ctx.player;
  if (p && p.serviceUnlocks && name) p.serviceUnlocks.ackUnlock(name);
  if (p && name) p.save();
  return { success: true, unlock_id: name };
};
H["/service/status/api/v1/add_unlocks_batch"] = (b, ctx) => {
  const items = Array.isArray(b.unlocks) ? b.unlocks : (Array.isArray(b.names) ? b.names.map(n => ({ name: n })) : []);
  const added = [], already = [], failed = [];
  const p = ctx.player;
  if (p && p.serviceUnlocks) {
    for (const it of items) {
      const name = typeof it === "string" ? it : (it.name || it.unlock_name || "");
      if (!name) { failed.push(it); continue; }
      if (p.serviceUnlocks.hasUnlock(name)) { already.push(name); continue; }
      const entry = require("../../../runtimeData/player/serverPlayerUnlocks.js").ServerPlayerUnlockEntry.createLevelUnlock(name, !!it.ack);
      p.serviceUnlocks.addUnlock(entry);
      added.push(name);
    }
    if (added.length) p.save();
  }
  return { success: true, added, already_owned: already, failed };
};
H["/service/status/api/v1/claim_achievement"] = (b, ctx) => {
  const aid = String(b.achievement_id || b.id || "");
  const doc = getDoc("ach", ctx.user);
  doc.achievements = doc.achievements || {};
  const a = doc.achievements[aid];
  if (!a) return { success: false, achievement: null, rewards: [], already_claimed: false };
  if (a.claimed) return { success: true, achievement: a, rewards: a.rewards || [], already_claimed: true };
  a.claimed = true; a.claimed_at = nowSec();
  putDoc("ach", ctx.user, doc);
  return { success: true, achievement: a, rewards: a.rewards || [], already_claimed: false };
};
H["/service/status/api/v1/delete_unlock"] = (b, ctx) => {
  const name = String(b.name || b.unlock_name || "");
  const p = ctx.player;
  if (p && p.serviceUnlocks && name) p.serviceUnlocks.removeUnlock(name);
  if (p && name) p.save();
  return { success: true, unlock_id: name };
};
H["/service/status/api/v1/delete_unlocks_batch"] = (b, ctx) => {
  const names = Array.isArray(b.names) ? b.names : (Array.isArray(b.unlocks) ? b.unlocks : []);
  const deleted = [], notFound = [];
  const p = ctx.player;
  if (p && p.serviceUnlocks) {
    for (const n of names) {
      const e = p.serviceUnlocks.removeUnlock(String(n));
      if (e) deleted.push(n); else notFound.push(n);
    }
    if (deleted.length) p.save();
  }
  return { success: true, deleted, not_found: notFound };
};
H["/service/status/api/v1/event/player_results"] = (b, ctx) => {
  const doc = getDoc("event", ctx.user);
  const results = Array.isArray(doc.playerResults) ? doc.playerResults : [];
  return { results, total: results.length, rank: doc.rank || 0, score: doc.score || 0 };
};
H["/service/status/api/v1/event/results"] = (b, ctx) => {
  const doc = getDoc("event", ctx.user);
  return { results: doc.results || [], total: (doc.results || []).length, team: doc.team || null, ranking: doc.ranking || [] };
};
H["/service/status/api/v1/event/select_team"] = (b, ctx) => {
  const tid = String(b.team_id || b.id || "");
  const doc = getDoc("event", ctx.user);
  doc.team = { id: tid, selected_at: nowSec() };
  putDoc("event", ctx.user, doc);
  return { success: true, team: doc.team, team_id: tid };
};
H["/service/status/api/v1/event/team"] = (b, ctx) => {
  const doc = getDoc("event", ctx.user);
  const team = doc.team || null;
  return { team, members: team ? (team.members || []) : [], total_members: team ? (team.members || []).length : 0 };
};
H["/service/status/api/v1/event/team_results"] = (b, ctx) => {
  const doc = getDoc("event", ctx.user);
  return { results: doc.teamResults || [], total: (doc.teamResults || []).length, team_rank: doc.teamRank || 0, ranking: doc.ranking || [] };
};
H["/service/status/api/v1/get_achievement_defs"] = (b, ctx) => {
  

  return { achievements: [], defs: [], total: 0 };
};
H["/service/status/api/v1/get_achievements"] = (b, ctx) => {
  const doc = getDoc("ach", ctx.user);
  const list = Object.values(doc.achievements || {});
  return { achievements: list, total: list.length, claimed: list.filter(a => a.claimed).map(a => a.id) };
};
H["/service/status/api/v1/get_achievement_stats_tracking"] = (b, ctx) => {
  const doc = getDoc("ach", ctx.user);
  return { stats: doc.stats || {}, achievements: Object.values(doc.achievements || {}), total: Object.keys(doc.achievements || {}).length };
};
H["/service/status/api/v1/get_player_profile"] = (b, ctx) => {
  const target = String(b.user_id || b.id || ctx.user);
  const doc = getDoc("prof", target);
  const p = getPlayer(target);
  return {
    profile: doc.profile || null,
    player: p ? {
      id: p.id,
      name: playerName(target),
      outfit: p.outfit ? p.outfit.toJSON() : null
    } : null,
    found: !!doc.profile || !!p
  };
};
H["/service/status/api/v1/set_player_profile"] = (b, ctx) => {
  const doc = getDoc("prof", ctx.user);
  doc.profile = Object.assign({}, doc.profile || {}, b.profile || b);
  delete doc.profile.user; delete doc.profile.session;
  doc.updated_at = nowSec();
  putDoc("prof", ctx.user, doc);
  return { success: true, profile: doc.profile };
};



H["/service/trust/api/v1/create_group_activity"] = (b, ctx) => {
  const aid = uid();
  const doc = getDoc("trust", ctx.user);
  doc.activities = doc.activities || [];
  const act = { id: aid, group: b.group || "", activity: b.activity || "", at: nowSec(), data: b.data || {} };
  doc.activities.push(act);
  putDoc("trust", ctx.user, doc);
  return { success: true, activity: act, activity_id: aid };
};
H["/service/trust/api/v1/get_capped"] = (b, ctx) => {
  const doc = getDoc("trust", ctx.user);
  const cap = doc.cap || 100;
  const used = doc.used || 0;
  return { capped: used >= cap, remaining: Math.max(0, cap - used), cap, period: "weekly" };
};
H["/service/trust/api/v1/get_ticket_rewards"] = (b, ctx) => {
  const doc = getDoc("trust", ctx.user);
  const list = Array.isArray(doc.tickets) ? doc.tickets : [];
  return { rewards: list, total: list.length, unclaimed: list.filter(t => !t.claimed).length };
};
H["/service/trust/api/v1/tier_up"] = (b, ctx) => {
  const doc = getDoc("trust", ctx.user);
  doc.tier = (doc.tier || 0) + 1;
  doc.tier_up_at = nowSec();
  putDoc("trust", ctx.user, doc);
  return { success: true, tier: doc.tier, rewards: [], prestige: doc.tier };
};



H["/service/voting/api/v1/add_vote"] = (b, ctx) => {
  const poll = String(b.poll_id || b.event || b.id || "default");
  const team = String(b.team_id || b.team || "");
  const doc = getDoc("vote", ctx.user);
  doc.polls = doc.polls || {};
  doc.polls[poll] = { team, at: nowSec() };
  doc.remaining = Math.max(0, (doc.remaining === undefined ? 1 : doc.remaining) - 1);
  putDoc("vote", ctx.user, doc);
  return { success: true, votes: doc.remaining, team_id: team };
};
H["/service/voting/api/v1/get_local_vote"] = (b, ctx) => {
  const poll = String(b.poll_id || b.event || "default");
  const doc = getDoc("vote", ctx.user);
  const v = (doc.polls || {})[poll] || null;
  return { vote: v, has_voted: !!v, team_id: v ? v.team : "" };
};
H["/service/voting/api/v1/get_remaining_votes"] = (b, ctx) => {
  const doc = getDoc("vote", ctx.user);
  const total = 1;
  return { remaining: doc.remaining === undefined ? total : doc.remaining, total, used: total - (doc.remaining === undefined ? total : doc.remaining) };
};
H["/service/voting/api/v1/get_team"] = (b, ctx) => {
  const poll = String(b.poll_id || b.event || "default");
  const team = String(b.team_id || b.team || "");
  return { team: team ? { id: team, members: [] } : null, members: [], total_members: 0 };
};
H["/service/voting/api/v1/get_team_sizes"] = (b, ctx) => {
  return { teams: {}, total: 0, sizes: {} };
};
H["/service/voting/api/v1/get_vote"] = (b, ctx) => {
  const poll = String(b.poll_id || b.event || "default");
  const doc = getDoc("vote", ctx.user);
  const v = (doc.polls || {})[poll] || null;
  return { vote: v, has_voted: !!v, team_id: v ? v.team : "" };
};
H["/service/voting/api/v1/get_yesterdays_vote"] = (b, ctx) => {
  return { vote: null, has_voted: false, team_id: "", yesterday: nowSec() - 86400 };
};
H["/service/voting/api/v1/set_team"] = (b, ctx) => {
  const team = String(b.team_id || b.team || "");
  const doc = getDoc("vote", ctx.user);
  doc.team = { id: team, set_at: nowSec() };
  putDoc("vote", ctx.user, doc);
  return { success: true, team: doc.team, team_id: team };
};

// ============================================================


// ============================================================
module.exports = function handleServiceReal(reqPath, rawBody, res) {
  const fn = H[reqPath];
  if (!fn) return false;

  const body = parseBody(rawBody);
  const user = body.user || body.user_id || body.player_id || "";
  const session = body.session || "";

  try {
    const player = getPlayer(user);
    const result = fn(body, { user, session, player });
    

    Promise.resolve(result).then(out => {
      if (session && out && typeof out === "object" && !out.session) out.session = session;
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(out));
    }).catch(e => {
      console.error("[serviceReal] " + reqPath + " async error: " + e.message);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: false, error: e.message }));
    });
  } catch (e) {
    console.error("[serviceReal] " + reqPath + " error: " + e.message);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
  return true;
};



module.exports._count = Object.keys(H).length;
