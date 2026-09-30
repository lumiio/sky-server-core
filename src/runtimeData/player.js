

const crypto = require("crypto")  

  , NBT = require("parsenbt-js")  

  , UUID = require("../utils/uuid.js");  

const { SkyServerStore } = require("./db.js");           

const { ISingleton, INbtify } = require("../utils/helperClasses.js");  

const { ServerPlayerCurrency } = require("./player/serverPlayerCurrency.js");    

const {
  ServerPlayerConsumableEntry,
  ServerPlayerConsumables
} = require("./player/serverPlayerConsumables.js");  

const {
  ServerPlayerBuffEntry,
  ServerPlayerBuffs
} = require("./player/serverPlayerBuffs.js");        // Buff
const {
  ServerPlayerElement,
  ServerPlayerOutfit
} = require("./player/serverPlayerOutfit.js");        

const { SkyBuffDefs } = require("../staticData/buffs.js");          

const { SkyConsumableDefs } = require("../staticData/consumables.js");  

const { MT } = require("../utils/random.js");        

const { ServerPlayerUnlocks, ServerPlayerUnlockEntry } = require("./player/serverPlayerUnlocks.js"); 

const { SkySpiritShopDefs } = require("../staticData/spiritShop.js");  

const { SkyServerArgs } = require("../skyServerArgs.js");  




const PLAYER_3RDPARTY_PREFIX = "player3rdparty"           

  , PLAYER_3RDPARTY_STEAM_PREFIX = "player3rdpartysteam_"  

  , PLAYER_PREFIX = "player_";                            

const BANNED_KEY = "admin_banned"                          

  , MOTD_KEY = "admin_motd";                              



class ServerPlayer extends INbtify {
  // Create a new account.
  static createNewPlayer() {
    var result = new ServerPlayer();

    result.id = crypto.randomUUID();

    

    result.currency.candles = 200;
    result.currency.wax = 20;
    result.currency.heart = 10;
    result.currency.seasonCandle = 20;

    return result;
  }

  // Player's db key.
  static getDbKey(id) {
    return PLAYER_PREFIX + id;
  }

  // Deserialize a player from leveldb.
  static deserialize(nbt) {
    var result = new ServerPlayer()
      , root = nbt["comp>"];

    if (typeof nbt !== "object" || typeof root !== "object")
      return result;

    result.id = root["str>id"] || "";
    result.userData = root["str>user_data"] || "";

    result.rank.isBeginner = !!root["comp>rank"]?.["i8>is_beginner"];
    result.rank.isShepherd = !!root["comp>rank"]?.["i8>is_shepherd"];
    result.rank.social = root["comp>rank"]?.["f32>social"] || 0;

    result.currency = ServerPlayerCurrency.deserialize(root["comp>currency"]);
    result.outfit = ServerPlayerOutfit.deserialize(root["comp>outfit"]);
    result.consumables = ServerPlayerConsumables.deserialize(root["list>consumables"]);
    result.buffs = ServerPlayerBuffs.deserialize(root["list>buffs"]);
    result.accountUnlocks = ServerPlayerUnlocks.deserialize(root["list>account_unlocks"]);
    result.serviceUnlocks = ServerPlayerUnlocks.deserialize(root["list>service_unlocks"]);

    return result;
  }

  constructor() {
    super();

    // Player's id. Consistent between logins.
    this.id = "";
    // Player's session. Changes on every login.
    this.session = "";

    // User data string.
    // TODO: Parse the base64 to JSON.
    this.userData = "";

    this.rank = {
      isBeginner: false,
      isShepherd: false,
      social: 0
    };

    // Player random generator.
    this.random = new MT();

    // Currencies.
    this.currency = new ServerPlayerCurrency();
    // Outfit.
    this.outfit = new ServerPlayerOutfit();
    // Consumables.
    this.consumables = new ServerPlayerConsumables();
    // Buffs
    this.buffs = new ServerPlayerBuffs();

    // Unlocks.
    this.accountUnlocks = new ServerPlayerUnlocks();
    this.serviceUnlocks = new ServerPlayerUnlocks();
  }

  isValid() {
    return UUID.isValid(this.id) && !UUID.isNull(this.id) && !!this.session.length;
  }

  setSession(session) {
    this.session = session;
  }

  /**
   * Set the player's random seed.
   * @param {number} seed 
   */
  setRandomSeed(seed) {
    this.random.setSeed(seed);
  }

  /**
   * Use an item and add buff.
   * @param {number|string} id 
   * @returns {ServerPlayerConsumableEntry}
   */
  consumeItem(identifier) {
    var itemEntry = this.clearItem(identifier, 1);
    if (!itemEntry)
      return;

    var buffId = itemEntry.getItemBase().buffId;
    if (!buffId) {
      if (itemEntry.getItemBase().name == "resize_potion")
        // Reroll the player's height.
        this.rerollHeight();
      return;
    }

    this.buffs.addBuff(buffId, this);

    return true;
  }

  /**
   * Give items to the player.
   * @param {number|string} [identifier] - Consumable id or name.
   * @param {number} [count] - Count. 
   * @returns {ServerPlayerConsumableEntry|undefined}
   */
  giveItem(identifier, count = 1) {
    if (typeof identifier === "number") {
      var stack = this.consumables.giveConsumable(identifier, count);
      if (stack) this.save();
      return stack;
    }

    if (typeof identifier === "string") {
      var item = SkyConsumableDefs.singleton().getItemWithName(identifier);
      if (!item)
        return void 0;
      var s = this.consumables.giveConsumable(item.id, count);
      if (s) this.save();
      return s;
    }

    return void 0;
  }

  /**
   * Clear the player's inventory.
   * @param {number|string} [identifier] - Consumable id or name.
   * @param {number} [count] - Count. 
   * @returns {ServerPlayerConsumableEntry|undefined}
   */
  clearItem(identifier, count) {
    if (typeof identifier === "number")
      return this.consumables.clearConsumable(identifier, count);

    if (typeof identifier === "string") {
      var item = SkyConsumableDefs.singleton().getItemWithName(identifier);
      if (!item)
        return void 0;
      return this.consumables.clearConsumable(item.id, count);
    }

    return void 0;
  }

  /**
   * Give a buff to the player.
   * @param {number|string} identifier 
   * @param {ServerPlayer} [giver] 
   * @returns {ServerPlayerBuffEntry|undefined}
   */
  giveBuff(identifier, giver) {
    if (typeof identifier === "number")
      return this.buffs.addBuff(identifier, giver || this);

    var buffBase = SkyBuffDefs.singleton().getBuffWithName(identifier);
    if (buffBase)
      return this.buffs.addBuff(buffBase.id, giver || this);

    return void 0;
  }

  /**
   * Remove an existing buff.
   * @param {number|string} [identifier] - Buff id or name.
   * @returns {ServerPlayerBuffEntry|undefined}
   */
  removeBuff(identifier) {
    if (typeof identifier === "number")
      return this.buffs.removeBuff(identifier);

    if (typeof identifier === "string") {
      var buff = SkyBuffDefs.singleton().getBuffWithName(identifier);
      if (!buff)
        return void 0;
      return this.buffs.removeBuff(buff.id);
    }

    return void 0;
  }

  /**
   * Add an unlock.
   * @param {number|string} identifier 
   * @param {boolean} [validate] 
   * @returns {ServerPlayerUnlockEntry|undefined}
   */
  addSpiritUnlock(identifier, validate = true) {
    var entry = ServerPlayerUnlockEntry.createSpiritUnlock(identifier);
    if (!entry)
      return void 0;

    if (validate && !this.accountUnlocks.canUnlockSpirit(entry))
      return void 0;

    var result = this.accountUnlocks.addUnlock(entry);
    if (result) this.save();
    return result;
  }

  /**
   * Purchase spirit shop item.
   * @param {string} identifier 
   * @returns {{unlock:ServerPlayerUnlockEntry}|undefined}
   */
  purchaseItem(identifier) {
    var base = SkySpiritShopDefs.singleton().getItemWithName(identifier);
    if (!base)
      return void 0;

    var cost = base.cost;

    var entry = this.addSpiritUnlock(identifier);

    return {
      unlock: entry
    };
  }

  /**
   * Set the player's outfit.
   * @param {ServerPlayerOutfit} outfit 
   */
  setAllOutfit(outfit) {
    this.outfit.copyOutfit(outfit);
  }

  /**
   * Set the player's outfit.
   * @param {"body"|"feet"|"hat"|"hair"|"horn"|"mask"|"neck"|"prop"|"wing"} slot 
   * @param {string} identifier 
   * @returns {ServerPlayerElement|undefined}
   */
  setOutfit(slot, identifier) {
    return this.outfit.setOutfit(slot, identifier);
  }

  /**
   * Set player height.
   * @param {number} height
   */
  setHeight(height) {
    this.outfit.height = height;
    this.save();
  }

  /**
   * Set player height.
   * @param {number} scale
   */
  setScale(scale) {
    this.outfit.scale = scale;
    this.save();
  }

  /**
   * Set the player's user data.
   * @param {string} userData - Base64 encoded JSON string.
   * @returns {string}
   */
  setUserData(userData) {
    this.userData = userData;
    return userData;
  }

  /**
   * Reroll the player's height.
   * @returns {number}
   */
  rerollHeight() {
    var oldHeight = this.outfit.height
      , newHeight = oldHeight;

    while (oldHeight == newHeight)
      // Generate a random number between -2, to 2 under triangle distribution.
      newHeight = (this.random.nextFloat() + this.random.nextFloat()) * 2 - 2;

    this.outfit.height = newHeight;

    return newHeight;
  }

  serialize() {
    var result = NBT.create(false);

    result["str>id"] = this.id;
    result["str>user_data"] = this.userData;
    result["i64>last_seen"] = this.lastSeen || Date.now();

    {
      var rank = NBT.create(false);
      result["comp>rank"] = rank;

      rank["i8>is_beginner"] = this.rank.isBeginner;
      rank["i8>is_shepherd"] = this.rank.isShepherd;
      rank["f32>social"] = this.rank.social;
    }

    result["comp>currency"] = this.currency.serialize();
    result["comp>outfit"] = this.outfit.serialize();
    result["list>consumables"] = this.consumables.serialize();
    result["list>buffs"] = this.buffs.serialize();
    result["list>account_unlocks"] = this.accountUnlocks.serialize();
    result["list>service_unlocks"] = this.serviceUnlocks.serialize();

    return result;
  }

  
  save() {
    if (!this.id || UUID.isNull(this.id)) return;
    var data = this.serialize();
    SkyServerStore.singleton().setNBT(ServerPlayer.getDbKey(this.id), data);
  }

  toString() {
    return "#" + this.id;
  }
}


class ServerPlayerBarn extends ISingleton {
  constructor() {
    super();

    this.random = new MT();          

    this.playerStatus = {};           

    this.players = {};                

    this.sessions = {};               

    this.relatedLoginMethods = {};    

    this.banned = {};                 

    this.motdTitle = "";              

    this.motdText = "That Sky Server";

    this.whitelist = {};              

    this.whitelistEnabled = false;    

    this.broadcastMsg = "";           

    this.messages = {};               

    this.allPlayers = {};             

    this.skipTutorial = true;         

    this.allUsers = {};               

    this.skipTutorial = true;         


    

    setInterval(() => {
      try {
        for (var id in this.players) {
          this.players[id].save();
        }
      } catch(e) {}
    }, 30000);
  }

  
  loadAdminData() {
    try {
      var bannedRaw = SkyServerStore.singleton().getString(BANNED_KEY);
      if (bannedRaw)
        this.banned = JSON.parse(bannedRaw);

      var motdRaw = SkyServerStore.singleton().getString(MOTD_KEY);
      if (motdRaw) {
        var motd = JSON.parse(motdRaw);
        this.motdTitle = motd.title || "";
        this.motdText = motd.text || "That Sky Server";
      }

      var giftRaw = SkyServerStore.singleton().getString("admin_gift");
      if (giftRaw) {
        var gift = JSON.parse(giftRaw);
        this.giftCandles = gift.candles || 100;
        this.giftHearts = gift.hearts || 20;
        this.giftSeason = gift.season || 10;
        this.giftWings = gift.wings || 10;
      }

      var regRaw = SkyServerStore.singleton().getString("admin_register");
      if (regRaw) {
        var reg = JSON.parse(regRaw);
        this.allowRegister = reg.allowRegister !== false;
      }

      var banRaw = SkyServerStore.singleton().getString("admin_default_ban_new");
      this.defaultBanNewPlayers = banRaw === "1";  


      var wlRaw = SkyServerStore.singleton().getString("admin_whitelist");
      if (wlRaw) {
        var wl = JSON.parse(wlRaw);
        this.whitelist = wl.list || {};
        this.whitelistEnabled = !!wl.enabled;
      }

      var msgRaw = SkyServerStore.singleton().getString("admin_messages");
      if (msgRaw) this.messages = JSON.parse(msgRaw);

      var apRaw = SkyServerStore.singleton().getString("all_players");
      if (apRaw) this.allPlayers = JSON.parse(apRaw);
    } catch (e) {
      

    }
  }

  
  saveMessages() {
    SkyServerStore.singleton().set("admin_messages", JSON.stringify(this.messages));
  }

  
  sendMessage(playerId, title, body) {
    

    var msg = {
      

      id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      

      title: title || "",
      

      body: body || "",
      

      time: Math.floor(Date.now() / 1000),
      

      read: false
    };

    

    if (playerId) {
      

      

      if (!this.messages[playerId]) this.messages[playerId] = [];
      

      this.messages[playerId].push(msg);
    } else {
      

      

      


      

      var ids = new Set();

      

      Object.keys(this.players).forEach(id => ids.add(id));

      

      Object.keys(this.messages).forEach(id => ids.add(id));

      

      Object.keys(this.banned).forEach(id => ids.add(id));

      

      

      

      Object.keys(this.allUsers).forEach(id => ids.add(id));

      

      ids.forEach(id => {
        

        if (!this.messages[id]) this.messages[id] = [];
        

        this.messages[id].push(msg);
      });
    }

    

    this.saveMessages();

    

    return msg;
  }

  
  getMessages(playerId) {
    return this.messages[playerId] || [];
  }

  
  markMessageRead(playerId, msgId) {
    var list = this.messages[playerId];
    if (!list) return;
    var msg = list.find(m => m.id === msgId);
    if (msg) { msg.read = true; this.saveMessages(); }
  }

  
  saveWhitelist() {
    SkyServerStore.singleton().set("admin_whitelist", JSON.stringify({
      list: this.whitelist,
      enabled: this.whitelistEnabled
    }));
  }

  
  isWhitelisted(playerId) {
    if (!this.whitelistEnabled)
      return true;  

    return !!this.whitelist[playerId];
  }

  
  addWhitelist(playerId) {
    this.whitelist[playerId] = true;
    this.saveWhitelist();
  }

  
  removeWhitelist(playerId) {
    if (this.whitelist[playerId]) {
      delete this.whitelist[playerId];
      this.saveWhitelist();
    }
  }

  
  toggleWhitelist() {
    this.whitelistEnabled = !this.whitelistEnabled;
    this.saveWhitelist();
    return this.whitelistEnabled;
  }

  
  saveBanned() {
    SkyServerStore.singleton().set(BANNED_KEY, JSON.stringify(this.banned));
  }

  
  saveMotd() {
    SkyServerStore.singleton().set(MOTD_KEY, JSON.stringify({
      title: this.motdTitle,
      text: this.motdText
    }));
  }

  
  saveAllPlayers() {
    SkyServerStore.singleton().set("all_players", JSON.stringify(this.allPlayers));
  }

  
  isBanned(playerId) {
    const info = this.banned[playerId];
    if (!info) return false;

    

    if (info.expire_time && Date.now() > info.expire_time) {
      delete this.banned[playerId];
      this.saveBanned();
      return false;
    }
    return true;
  }

  
  getBanInfo(playerId) {
    const info = this.banned[playerId];
    if (!info) return null;

    

    if (info.expire_time && Date.now() > info.expire_time) {
      delete this.banned[playerId];
      this.saveBanned();
      return null;
    }
    return info;
  }

  
  ban(playerId, reason, duration = 0) {
    const now = Date.now();
    this.banned[playerId] = {
      reason: reason || "violation",
      time: now,
      duration: duration,  

      expire_time: duration > 0 ? now + duration * 1000 : 0  

    };
    this.saveBanned();

    

    if (this.players[playerId])
      delete this.players[playerId];

    

  }

  
  unban(playerId) {
    if (this.banned[playerId]) {
      delete this.banned[playerId];
      this.saveBanned();
    }
  }

  
  getPlayer(id, session) {
    

    if (id && !UUID.isValid(id)) id = this.stableLocalId(id);
    var player = this.players[id];

    if (!player)
      return void 0;

    if (session && player.session !== session)
      return void 0;

    

    player.lastSeen = Date.now();
    

    try { require("./db.js").SkyServerStore.singleton().set("lastseen_" + player.id, String(Date.now())); } catch(e) {}
    return player;
  }

  

  getBySession(session) {
    if (!session) return null;
    for (var id in this.players) {
      if (this.players[id].session === session) return this.players[id];
    }
    return null;
  }

  

  loadOfflinePlayer(id) {
    if (id && !UUID.isValid(id)) id = this.stableLocalId(id);
    if (this.players[id]) return this.players[id];
    var playerData = SkyServerStore.singleton().getNBT(ServerPlayer.getDbKey(id));
    if (!playerData) return null;
    var player = ServerPlayer.deserialize(playerData);
    player.id = id;
    return player;
  }

  

  saveOfflinePlayer(player) {
    SkyServerStore.singleton().set(ServerPlayer.getDbKey(player.id), player.serialize());
  }

  // Serialize the given player and unload the player from memory.
  unloadPlayer(id) {
    var player = this.players[id];

    if (!player)
      return false;

    SkyServerStore.singleton().set(
      PLAYER_PREFIX + id,
      player.serialize()
    );

    // Remove the entry.
    delete this.players[id];

    return true;
  }

  /**
   * Login with given type and user identifier.
   * @param {"Local"|"Steam"} type 
   * @param {string} userId 
   * @param {boolean} createIfMissing
   * @returns {ServerPlayer|undefined}
   */
  login(type, userId, createIfMissing = true) {
    var player;

    if (!SkyServerArgs.singleton().alwaysNewUser) {
      if (type === "Local")
        player = this.loginBasic(userId, createIfMissing);
      else if (type === "Steam")
        player = this.loginSteam(userId, createIfMissing);
    } else
      player = ServerPlayer.createNewPlayer();

    

    if (!player)
      player = ServerPlayer.createNewPlayer();

    

    var isNewPlayer = !this.allPlayers[player.id];

    

    if (isNewPlayer && this.allowRegister === false) {
      throw new Error("New player registration is currently closed");
    }

    this.allPlayers[player.id] = {
      id: player.id,
      lastLogin: Date.now(),
      online: true,
      registerTime: this.allPlayers[player.id] ? this.allPlayers[player.id].registerTime : Date.now(),
      device: this.allPlayers[player.id] ? this.allPlayers[player.id].device : (type + ':' + userId),
      name: this.allPlayers[player.id] ? this.allPlayers[player.id].name : (userId.substring(0, 8) || 'Player')
    };
    this.saveAllPlayers();

    

    if (isNewPlayer) {
      player.currency.candles += (this.giftCandles || 100);
      player.currency.heart += (this.giftHearts || 20);
      player.currency.seasonCandle += (this.giftSeason || 10);
      player.save();

      

      if (this.defaultBanNewPlayers) {
        this.ban(player.id, "New accounts are banned by default; waiting for admin review", 0);
        LOGW("new player banned by default: " + player.id);
      }
    }

    

    if (!this.isWhitelisted(player.id) && !this.isBanned(player.id)) {
      throw new Error("Server is not open to the public. Contact the admin to be whitelisted");
    }

    // Set current session of the player.
    player.setSession(crypto.randomBytes(16).toString("hex"));

    // Mark the player.
    if (this.players[player.id] != player)
      this.players[player.id] = player;

    

    if (!this.allUsers[player.id]) {
      this.allUsers[player.id] = { id: player.id, registerTime: Date.now(), lastLogin: Date.now(), device: player.deviceModel || player.device || '' };
      this.saveAllPlayers();
    } else {
      this.allUsers[player.id].lastLogin = Date.now();
      if (player.deviceModel) this.allUsers[player.id].device = player.deviceModel;
    }

    // Set the player's random seed.
    player.setRandomSeed(this.random.nextInt());

    return player;
  }

  
  stableLocalId(userId) {
    var crypto = require("crypto");
    var hash = crypto.createHash("sha1").update("local:" + (userId || "default")).digest();
    var b = Buffer.alloc(16);
    hash.copy(b, 0, 0, 16);
    b[6] = (b[6] & 0x0f) | 0x50;  // version 5
    b[8] = (b[8] & 0x3f) | 0x80;  // variant
    var hex = b.toString("hex");
    return hex.substring(0,8) + "-" + hex.substring(8,12) + "-" + hex.substring(12,16) + "-" + hex.substring(16,20) + "-" + hex.substring(20,32);
  }

  /**
   * Direct login with player uuid.
   * @param {string} id
   * @param {boolean} createIfMissing
   * @returns {ServerPlayer|undefined}
   */
  loginBasic(id, createIfMissing = true) {
    var playerData, player;

    

    

    if (!UUID.isValid(id)) {
      if (!createIfMissing)
        return void 0;
      id = this.stableLocalId(id);
    }

    if (UUID.isNull(id))
      // Directly create a new player.
      return createIfMissing
        ? ServerPlayer.createNewPlayer()
        : void 0;

    // The player has logged in during this server instance.
    if (this.players[id])
      return this.players[id];

    // Try to get saved player data.
    playerData = SkyServerStore.singleton().getNBT(ServerPlayer.getDbKey(id));
    if (playerData) {
      // Load player data.
      player = ServerPlayer.deserialize(playerData);
      // Validate the player id.
      player.id = id;
    } else {
      

      

      if (!createIfMissing)
        return void 0;
      player = ServerPlayer.createNewPlayer();
      player.id = id;
    }

    return player;
  }

  /**
   * Login with steam.
   * @param {string} id 
   * @param {boolean} createIfMissing
   * @returns {ServerPlayer|undefined}
   */
  loginSteam(id, createIfMissing = true) {
    var steamDbKey = PLAYER_3RDPARTY_STEAM_PREFIX + id
      , playerId, player;

    // Try to get the recorded thirdparty player data.
    playerId = this.get3rdPartyLogin("steam", id);
    if (!playerId)
      // Try to get the saved player id.
      playerId = SkyServerStore.singleton().getString(steamDbKey);

    if (!playerId) {
      // Create a new player.
      player = createIfMissing
        ? ServerPlayer.createNewPlayer()
        : void 0;
    } else {
      // Use recorded player.
      player = this.loginBasic(playerId, createIfMissing);
    }

    // Record third party login.
    if (player)
      this.add3rdPartyLogin("steam", id, player);

    return player;
  }

  add3rdPartyLogin(type, id, player) {
    // steam_01234567
    this.relatedLoginMethods[type + "_" + id] = player.id;
  }

  get3rdPartyLogin(type, id) {
    return this.relatedLoginMethods[type + "_" + id];
  }

  // Save all data.
  saveLoginMethods() {
    for (var m in this.relatedLoginMethods) {
      // player3rdpatrtsteam_01234567, "00000000-0000-0000-0000-000000000000"
      SkyServerStore.singleton().set(
        PLAYER_3RDPARTY_PREFIX + m,
        this.relatedLoginMethods[m]
      );
    }
  }

  // Save all players.
  savePlayers() {
    for (var m in this.players) {
      if (!this.players[m].isValid())
        continue;
      // "player_00000000-0000-0000-0000-000000000000"
      SkyServerStore.singleton().setNBT(
        PLAYER_PREFIX + m,
        this.players[m].serialize()
      );
    }
  }
}

module.exports = {
  ServerPlayer,
  ServerPlayerBarn
};