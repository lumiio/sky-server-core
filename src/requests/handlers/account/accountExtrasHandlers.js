
const { SkyServerStore } = require("../../../runtimeData/db.js");
const { ServerPlayerBarn } = require("../../../runtimeData/player.js");
const { SkySpiritShopDefs } = require("../../../staticData/spiritShop.js");
const { gameUri, PUBLIC_HOST, gamePort, gameHost } = require("../../../publicHost.js");


const handleMissingEndpoints = require("../missingEndpoints.js");


const handleAccountFriend = require("./accountFriendHandlers.js");
const handleAccountRoom = require("./accountRoomHandlers.js");
const handleAccountMisc = require("./accountMiscHandlers.js");
const { getFriendData, saveFriendData, addFriendBoth } = require("../../../utils/friendData.js");
const { getMailData, saveMailData } = require("../../../utils/mailData.js");

module.exports = function handleAccountExtras(path, body, res) {
    

    if (handleAccountFriend(path, body, res)) return true;
    if (handleAccountRoom(path, body, res)) return true;
    if (handleAccountMisc(path, body, res)) return true;
    if (handleMissingEndpoints(path, body, res)) return true;
    return false;
};
