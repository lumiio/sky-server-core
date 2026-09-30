const DEFAULT_PUBLIC_HOST = "YOUR_DOMAIN";

const PUBLIC_HOST = process.env.SKY_PUBLIC_HOST || DEFAULT_PUBLIC_HOST;

const gameUri = process.env.SKY_GAME_URI || "YOUR_SERVER_IP:19132";

const gamePort = Number(String(gameUri).split(":")[1] || 19132);

const gameHost = String(gameUri).split(":")[0] || "YOUR_SERVER_IP";

module.exports = {
  PUBLIC_HOST,
  cdnHost: PUBLIC_HOST,
  gameUri,
  gameHost,
  gamePort,
};
