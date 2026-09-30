
const tformat = require("@htmonkeyg/tformat")
  , printf = tformat.printF;

function printLogo() {
  printf("╔═════════════════════════════════════════════════════════════╗");
  printf("║ §1████████╗██╗  ██╗ █████╗ ████████╗§9███████╗██╗  ██╗██╗   ██╗§r ║");
  printf("║ §1╚══██╔══╝██║  ██║██╔══██╗╚══██╔══╝§9██╔════╝██║ ██╔╝╚██╗ ██╔╝§r ║");
  printf("║ §1   ██║   ███████║███████║   ██║   §9███████╗█████╔╝  ╚████╔╝ §r ║");
  printf("║ §1   ██║   ██╔══██║██╔══██║   ██║   §9╚════██║██╔═██╗   ╚██╔╝  §r ║");
  printf("║ §1   ██║   ██║  ██║██║  ██║   ██║   §9███████║██║  ██╗   ██║   §r ║");
  printf("║ §1   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   §9╚══════╝╚═╝  ╚═╝   ╚═╝   §r ║");
  printf("╚═════════════════════════════════════════════════════════════╝");
}

function LOGI(...args) {
  printf("§2[INFO] §r" + args.join("") + "§r");
}

function LOGW(...args) {
  printf("§e[WARN] " + args.join("") + "§r");
}

function LOGE(...args) {
  printf("§c[ERR ] " + args.join("") + "§r");
}

function printRequestStatus(req, res) {
  var reqUrl = new URL(req.url, "http://localhost")
    , result = ""
    , color = "§3";

  if (res.statusCode >= 200 && res.statusCode < 300)
    color = "§a";

  result += `§r${req.method} ${color}${res.statusCode} §r${reqUrl.pathname}`
  result += ` - ${req.socket.remoteAddress}:${req.socket.remotePort}`;

  LOGI(result);
}

module.exports = {
  LOGI,
  LOGW,
  LOGE,
  printLogo,
  printRequestStatus
};
