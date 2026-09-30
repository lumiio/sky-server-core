
const { NetServerRequest } = require("../netServerRequest.js");
const OAuthAccounts = require("../../../oauthAccounts.js");
const { LOGI, LOGW } = require("../../../utils/logger.js");

const CONTACT_EMAIL = "liioui_ovo@163.com";

function parseBody(body) {
  const out = {};
  if (!body || body === "{}") return out;
  if (body.trim().startsWith("{")) {
    try { return JSON.parse(body); } catch (e) { return out; }
  }
  try {
    for (const [k, v] of new URLSearchParams(body)) out[k] = v;
  } catch (e) {}
  return out;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderPage(notice, form) {
  form = form || {};
  const isReg = form.action === "register";
  const needInvite = OAuthAccounts.CFG.requireInvite === true;

  const noticeHtml = notice
    ? '<div class="notice">' + esc(notice) + "</div>"
    : "";

  const inviteField = needInvite
    ? '<div class="input-box"><input type="text" name="invite" placeholder="Invite Code" value="' + esc(form.invite || "") + '"><span class="check-ok" data-min="1"></span></div>'
    : "";

  const regExtra = isReg
    ? '<div class="input-box"><input type="text" name="alias" placeholder="Nickname (optional)" value="' + esc(form.alias || "") + '" maxlength="24"><span class="check-ok" data-min="1"></span></div>'
      + inviteField
    : "";

  const subRow = isReg
    ? '<a class="switch-link" href="?tab=login">Back to login</a>'
    : '<a class="switch-link" href="?tab=register">Register</a>';

  const btnText = isReg ? "Register" : "Login";
  const userPlaceholder = isReg ? "Set username" : "Enter username";
  const pwdPlaceholder = isReg ? "Set password (at least 6 chars)" : "Enter password";
  const pwdAutocomplete = isReg ? "new-password" : "current-password";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Add Account</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:linear-gradient(180deg,#cfe6ff 0%,#e8f3ff 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;color:#111}

.card{width:100%;max-width:480px;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(80,140,200,.12)}
h1{font-size:26px;font-weight:500;color:#111;margin:0 0 40px;line-height:32px;text-align:left}

.notice{background:#fff1f0;color:#cf1322;border-radius:8px;padding:8px 12px;margin-bottom:20px;font-size:12px;text-align:center}

form{width:100%}
.input-box{background:rgba(13,16,49,.04);border:1px solid transparent;border-radius:12px;height:48px;padding:0 16px;margin-bottom:24px;display:flex;align-items:center;transition:border-color .2s}
.input-box:focus-within{border-color:#09f;background:#fff}
.input-box input{flex:1;border:0;outline:0;font-size:14px;color:#111;background:transparent;text-align:left;min-width:0;height:100%;line-height:20px}
.input-box input::placeholder{color:rgba(60,60,67,.4)}
.eye{flex-shrink:0;margin-left:4px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:#c0c1c5;cursor:pointer;background:none;border:0;opacity:.4}

/* green check for valid input */
.check-ok{display:none;flex-shrink:0;margin-left:8px;width:16px;height:16px;border-radius:50%;background:#07c160;align-items:center;justify-content:center}
.check-ok.show{display:flex}
.check-ok::after{content:"";width:5px;height:8px;border:solid #fff;border-width:0 1.5px 1.5px 0;transform:rotate(45deg);margin-top:-1px}

/* password rule hints below the field */
.hidden{display:none!important}
.pwd-hints{margin:-16px 0 24px;display:none}
.pwd-hints.show{display:block;animation:hintIn .15s ease}
@keyframes hintIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.pwd-hint{display:flex;align-items:center;font-size:13px;line-height:20px;margin-top:4px;color:rgba(60,60,67,.5)}
.pwd-hint.done{color:#07c160}
.pwd-hint .dot{width:14px;height:14px;flex-shrink:0;margin-right:6px;position:relative}
.pwd-hint .dot::before{content:"";position:absolute;left:5px;top:5px;width:4px;height:4px;border-radius:50%;background:rgba(60,60,67,.3)}
.pwd-hint.done .dot::before{content:"";position:absolute;left:2px;top:0;width:5px;height:9px;border:solid #07c160;border-width:0 1.5px 1.5px 0;transform:rotate(45deg);background:transparent}

/* register / back-to-login link */
.switch-link{display:block;margin:12px 2px 0;font-size:14px;color:#09f;text-decoration:none}

/* red hint above the button when unchecked */
.form-tip{display:none;font-size:12px;color:#f74c30;text-align:center;margin-bottom:8px}
.form-tip.show{display:block}

.btn{width:100%;height:48px;border:0;border-radius:12px;font-size:16px;font-weight:500;color:rgba(255,255,255,.7);background:#cde7ff;cursor:pointer;transition:opacity .2s;margin-top:0}
.btn.ready{background:#82c4ff;color:#fff}
.btn.ready:active{opacity:.85}

.agree{display:flex;align-items:center;justify-content:flex-start;margin-top:20px;font-size:12px;color:rgba(60,60,67,.56);cursor:pointer}
.checkbox{width:16px;height:16px;border:1px solid rgba(0,0,0,.2);border-radius:50%;margin-right:4px;flex-shrink:0;display:inline-block;position:relative;transition:all .2s;box-sizing:border-box}
.checkbox.on{background:#09f;border-color:#09f}
.checkbox.on::after{content:"";position:absolute;left:4px;top:2px;width:4px;height:7px;border:solid #fff;border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}
.agree a{color:#111;text-decoration:none;font-weight:500}

/* dialog with frosted-glass mask */
.mask{position:fixed;inset:0;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;z-index:99;padding:40px}
.mask.show{display:flex;animation:QFadeIn .3s ease}
.modal{background:#fff;border-radius:12px;width:100%;max-width:280px;overflow:hidden;animation:QFadeZoomIn .35s ease}
@keyframes QFadeIn{from{opacity:0}to{opacity:1}}
@keyframes QFadeZoomIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.modal h2{font-size:16px;font-weight:600;color:#111;text-align:center;padding:22px 20px 10px}
.modal .body{padding:0 20px 18px;font-size:13px;color:#666;line-height:1.7;text-align:center}
.modal .body p{margin-bottom:4px}
.modal .body p.mail{color:#3370ff;margin-top:6px;font-size:14px}
.modal .okbtn{display:block;width:100%;padding:12px;border:0;border-top:.5px solid #e5e5e8;background:transparent;color:#3370ff;font-size:16px;cursor:pointer}
.modal .okbtn:active{background:#f5f5f7}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.card{animation:fadeIn .5s ease}
</style>
</head>
<body>

<div class="card">
  <h1>${isReg ? "Welcome! Register" : "Add Account"}</h1>
  ${noticeHtml}
  <form id="authForm" method="post" action="/account/auth/oauth_signin" onsubmit="return onSubmit(event)">
    <input type="hidden" name="action" value="${isReg ? "register" : "login"}">
    <input type="hidden" name="device_name" id="devName">
    <div class="input-box"><input type="text" name="username" placeholder="${userPlaceholder}" value="${esc(form.username || "")}" required autocomplete="username" data-min="2"><span class="check-ok"></span></div>
    ${regExtra}
    <div class="input-box">
      <input type="password" name="password" id="pwdInput" placeholder="${pwdPlaceholder}" required autocomplete="${pwdAutocomplete}" data-min="6">
      <button type="button" class="eye" onclick="togglePwd()" aria-label="Show/Hide password">
        <svg id="eyeIcon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      </button>
      <span class="check-ok"></span>
    </div>
    <div class="pwd-hints${isReg ? "" : " hidden"}" id="pwdHints">
      <div class="pwd-hint" id="hintLen"><span class="dot"></span>At least 6 characters</div>
      <div class="pwd-hint" id="hintLenMax"><span class="dot"></span>No more than 64 characters</div>
    </div>
    <div class="form-tip" id="formTip">Please check "I have read and agreed"</div>
    <button class="btn" type="submit">${btnText}</button>
    ${subRow}
    <div class="agree" onclick="toggleCb()">
      <span class="checkbox" id="agreeCb"></span>
      <span>I have read and agree to the<a onclick="event.stopPropagation();openAgreement()">Terms of Service</a> and the <a onclick="event.stopPropagation();openDisclaimer()">Privacy Policy</a></span>
    </div>
  </form>
</div>

<!-- dialog -->
<div class="mask" id="mask" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <h2 id="mTitle"></h2>
    <div class="body" id="mBody"></div>
    <button class="okbtn" onclick="closeModal()">OK</button>
  </div>
</div>

<script>
var CONTACT = ${JSON.stringify(CONTACT_EMAIL)};

function toggleCb(){
  document.getElementById('agreeCb').classList.toggle('on');
  document.getElementById('formTip').classList.remove('show');
}
function togglePwd(){
  var i = document.getElementById('pwdInput');
  var show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  document.getElementById('eyeIcon').style.opacity = show ? '1' : '.4';
}
function onSubmit(e){
  if(!document.getElementById('agreeCb').classList.contains('on')){
    e.preventDefault();
    document.getElementById('formTip').classList.add('show');
    return false;
  }
  return true;
}

function openModal(title, html){
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mBody').innerHTML = html;
  document.getElementById('mask').classList.add('show');
}
function closeModal(){document.getElementById('mask').classList.remove('show');}

function openAgreement(){
  openModal('User Agreement',
    '<p>1. This account is for this server only. Do not reuse the same password elsewhere.</p>' +
    '<p>2. Follow the server rules. No cheating, no ruining others\' experience.</p>' +
    '<p>3. Keep your account private. You are responsible for losses caused by sharing it.</p>');
}

function openDisclaimer(){
  openModal('Disclaimer',
    '<p>1. This is an unofficial community server. It is not affiliated with Thatgamecompany, NetEase, or the official Sky team.</p>' +
    '<p>2. We do not guarantee that game data will never be lost. No compensation for progress changes caused by maintenance or shutdowns.</p>' +
    '<p>3. This service is free and for learning purposes only. Please support the official game.</p>' +
    '<p>4. By continuing to register / log in, you confirm that you have read and agreed to these terms.</p>');
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

(function(){
  var form = document.getElementById('authForm');
  var btn = form.querySelector('.btn');
  var allInputs = form.querySelectorAll('input[type=text],input[type=password]');
  function refreshField(inp){
    var min = parseInt(inp.dataset.min || '1');
    var ok = inp.value.trim().length >= min;
    var box = inp.closest('.input-box');
    var tick = box.querySelector('.check-ok');
    if (tick) tick.classList.toggle('show', ok);
  }
  function refreshPwdHints(){
    var hints = document.getElementById('pwdHints');
    if (!hints || hints.classList.contains('hidden')) return;
    var len = document.getElementById('pwdInput').value.length;
    document.getElementById('hintLen').classList.toggle('done', len >= 6);
    document.getElementById('hintLenMax').classList.toggle('done', len >= 1 && len <= 64);
  }
  var pwd = document.getElementById('pwdInput');
  var hintsBox = document.getElementById('pwdHints');
  if (pwd && hintsBox && !hintsBox.classList.contains('hidden')) {
    pwd.addEventListener('focus', function(){ hintsBox.classList.add('show'); refreshPwdHints(); });
    pwd.addEventListener('blur', function(){ hintsBox.classList.remove('show'); });
  }
  function refresh(){
    var ok = true;
    allInputs.forEach(function(i){
      refreshField(i);
      if (i.name === 'username' || i.name === 'password') {
        if (!i.value.trim()) ok = false;
      }
    });
    refreshPwdHints();
    btn.classList.toggle('ready', ok);
  }
  allInputs.forEach(function(i){ i.addEventListener('input', refresh); });
  refresh();
})();
</script>
</body>
</html>`;
}

class AccountOAuthSigninRequest extends NetServerRequest {
  static get PATH() { return "/account/auth/oauth_signin"; }
  static get response() { return null; }

  static handler(req, res, headers, method, query) {
    const isPost = (method || "GET").toUpperCase() === "POST";
    const form = parseBody(req);
    const q = {};
    if (query) new URLSearchParams(query.startsWith("?") ? query.slice(1) : query).forEach((v, k) => q[k] = v);
    if (!isPost && q.tab === "register") form.action = "register";

    function redirectLocation(token) {
      const fwdProto = (headers["x-forwarded-proto"] || "").toString().split(",")[0].trim();
      const host = (headers["host"] || "").toString();
      const scheme = fwdProto || "https";
      return scheme + "://" + host + "/account/auth/oauth_redirect?token=" + token;
    }

    if (isPost && (form.action === "login" || form.action === "register")) {
      const username = String(form.username || "").trim();
      const password = String(form.password || "");
      const alias = String(form.alias || "").trim();

      if (form.action === "register") {
        const r = OAuthAccounts.register(username, password, alias, form.invite);
        if (!r.ok) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(renderPage(r.reason, { action: "register", username, alias, invite: form.invite }));
          return;
        }
        const token = OAuthAccounts.issueToken(r.account, form.device_name);
        res.writeHead(302, { Location: redirectLocation(token) });
        res.end();
        return;
      }

      const r = OAuthAccounts.login(username, password);
      if (!r.ok) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(renderPage(r.reason, { action: "login", username }));
        return;
      }
      const token = OAuthAccounts.issueToken(r.account, form.device_name);
      res.writeHead(302, { Location: redirectLocation(token) });
      res.end();
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderPage(null, form));
  }
}

module.exports = AccountOAuthSigninRequest;