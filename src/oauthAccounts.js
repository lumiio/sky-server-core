
const crypto = require("crypto");
const { SkyServerStore } = require("./runtimeData/db.js");
const { LOGI, LOGW } = require("./utils/logger.js");

const CFG = {
  disableLocal: process.env.SKY_DISABLE_LOCAL_LOGIN === "1",
  oauthHost: process.env.SKY_OAUTH_HOST || require("./publicHost.js").PUBLIC_HOST,
  tokenTtlMs: 24 * 3600 * 1000, 

  minPassword: 6,
  maxPassword: 64,
  maxUsername: 32,
  

  allowRegister: true,
  

  requireInvite: false
};



try {
  const raw = SkyServerStore.singleton().getString("oauth_allow_register");
  if (raw !== null && raw !== undefined && raw !== "") {
    CFG.allowRegister = (JSON.parse(raw).allow !== false);
  }
} catch (e) {  }
try {
  const raw = SkyServerStore.singleton().getString("oauth_require_invite");
  if (raw !== null && raw !== undefined && raw !== "") {
    CFG.requireInvite = (JSON.parse(raw).require === true);
  }
} catch (e) {  }


function setAllowRegister(allow) {
  CFG.allowRegister = !!allow;
  SkyServerStore.singleton().set("oauth_allow_register", JSON.stringify({ allow: CFG.allowRegister }));
  LOGI("[oauth] web registration " + (CFG.allowRegister ? "enabled" : "disabled"));
}


function setRequireInvite(require) {
  CFG.requireInvite = !!require;
  SkyServerStore.singleton().set("oauth_require_invite", JSON.stringify({ require: CFG.requireInvite }));
  LOGI("[oauth] invite code requirement " + (CFG.requireInvite ? "enabled" : "disabled"));
}



const tokenStore = new Map();


function derivePlayerId(username) {
  const hash = crypto.createHash("sha1").update("oauth:" + username.toLowerCase()).digest();
  const b = Buffer.alloc(16);
  hash.copy(b, 0, 0, 16);
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const hex = b.toString("hex");
  return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

function getAccount(username) {
  if (!username || typeof username !== "string") return null;
  const raw = SkyServerStore.singleton().getString("oauth_account_" + username.toLowerCase());
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function accountExists(username) {
  return !!getAccount(username);
}

function validateUsername(username) {
  if (typeof username !== "string" || !username) return "Please enter a username";
  if (username.length < 2 || username.length > CFG.maxUsername) return "Username must be 2-32 characters";
  if (!/^[\w\u4e00-\u9fa5\-_.]+$/.test(username))
    return "Username can only contain letters, numbers, underscore, dot, dash, or Chinese characters";
  return null;
}

function validatePassword(password) {
  if (typeof password !== "string" || !password) return "Please enter a password";
  if (password.length < CFG.minPassword || password.length > CFG.maxPassword)
    return "Password must be " + CFG.minPassword + "-" + CFG.maxPassword + " characters";
  return null;
}





function getInviteStore() {
  const raw = SkyServerStore.singleton().getString("oauth_invite_codes");
  try { return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}
function saveInviteStore(s) {
  SkyServerStore.singleton().set("oauth_invite_codes", JSON.stringify(s));
}
function listInviteCodes() {
  return getInviteStore();
}
function createInviteCode(note, maxUses) {
  const s = getInviteStore();
  

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from(crypto.randomBytes(8), b => alphabet[b % alphabet.length]).join("");
  } while (s[code]);
  s[code] = {
    note: String(note || "").slice(0, 40),
    maxUses: Math.max(1, parseInt(maxUses) || 1),
    uses: 0,
    createdAt: Date.now()
  };
  saveInviteStore(s);
  return code;
}
function deleteInviteCode(code) {
  const s = getInviteStore();
  if (s[code]) { delete s[code]; saveInviteStore(s); return true; }
  return false;
}

function useInviteCode(code, username) {
  

  if (!CFG.requireInvite) return { ok: true };
  const s = getInviteStore();
  code = String(code || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Please enter the invite code" };
  const rec = s[code];
  if (!rec) return { ok: false, reason: "Invalid invite code" };
  if (rec.uses >= rec.maxUses) return { ok: false, reason: "Invite code has been used up" };
  rec.uses = (rec.uses || 0) + 1;
  rec.lastUsedBy = username;
  rec.lastUsedAt = Date.now();
  saveInviteStore(s);
  return { ok: true };
}


function register(username, password, alias, inviteCode) {
  if (CFG.allowRegister === false) return { ok: false, reason: "Registration is closed. Contact the admin" };
  

  const inv = useInviteCode(inviteCode, username);
  if (!inv.ok) return inv;
  const uErr = validateUsername(username);
  if (uErr) return { ok: false, reason: uErr };
  const pErr = validatePassword(password);
  if (pErr) return { ok: false, reason: pErr };
  if (accountExists(username)) return { ok: false, reason: "Username already exists. Please log in directly" };

  const salt = crypto.randomBytes(16).toString("hex");
  const account = {
    username: username,
    salt: salt,
    passHash: hashPassword(password, salt),
    alias: (alias && String(alias).trim()) || username,
    playerId: derivePlayerId(username),
    createdAt: Date.now()
  };
  SkyServerStore.singleton().set("oauth_account_" + username.toLowerCase(), JSON.stringify(account));

  

  try {
    const spb = require("./runtimeData/player.js").ServerPlayerBarn.singleton();
    const player = spb.login("Local", account.playerId);
    if (player) {
      player.deviceModel = "oauth-web";
      player.save();
      

      if (spb.allPlayers && spb.allPlayers[account.playerId]) {
        spb.allPlayers[account.playerId].name = account.alias;
        spb.saveAllPlayers();
      }
    }
  } catch (e) {
    return { ok: false, reason: (e && e.message) || "Failed to create player" };
  }

  LOGI("[oauth] new account registered: " + username + " -> " + account.playerId);
  return { ok: true, account: account };
}


function login(username, password) {
  if (typeof username !== "string" || !username || typeof password !== "string" || !password)
    return { ok: false, reason: "Please enter username and password" };
  const account = getAccount(username);
  if (!account) return { ok: false, reason: "Incorrect username or password" };
  const h = hashPassword(password, account.salt);
  if (h !== account.passHash) return { ok: false, reason: "Incorrect username or password" };
  return { ok: true, account: account };
}


function issueToken(account, deviceName) {
  const token = crypto.randomBytes(24).toString("hex");
  tokenStore.set(token, {
    playerId: account.playerId,
    username: account.username,
    alias: account.alias,
    deviceName: (deviceName && String(deviceName).slice(0, 60)) || "",
    exp: Date.now() + CFG.tokenTtlMs
  });
  return token;
}


function validateToken(token, expectPlayerId) {
  if (typeof token !== "string" || !token) return null;
  const rec = tokenStore.get(token);
  if (!rec) return null;
  if (rec.exp < Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  if (expectPlayerId && rec.playerId !== expectPlayerId) return null;
  return rec;
}

module.exports = {
  CFG,
  derivePlayerId,
  getAccount,
  accountExists,
  register,
  login,
  issueToken,
  validateToken,
  setAllowRegister,
  setRequireInvite,
  listInviteCodes,
  createInviteCode,
  deleteInviteCode
};
