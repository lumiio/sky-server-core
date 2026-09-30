# Sky Server

A community server implementation for *Sky: Children of the Light*.

> ⚠️ **Disclaimer**: This project is for learning and research purposes only. It is not affiliated with thatgamecompany (TGC). Do not use it for commercial purposes.

---

## Features

- **Account system**: Register / Login / OAuth / persistent player data (LevelDB)
- **Friends**: invite-code friends, friend list, block / mute / favorite / notes
- **Mail**: in-game messages, gift messages, global mail
- **Quests**: daily quests, world quests, seasonal quests
- **Room matching**: random rooms, friend rooms, last room, serendipity / star join
- **UDP room sync (optional)**: ENet real-time sync of player position, actions, and chat, using the upstream [that-sky-xysky-udp-team](https://github.com/that-sky-project/that-sky-xysky-udp-team)
- **CLI management**: manage the server directly from the terminal (online players / broadcast / maintenance / ban & kick / stop)
- **Resource cache proxy**: fetch and cache game resources from the official CDN on demand

---

## Architecture

The HTTP service is built into this project; the UDP room service is an **optional** component deployed separately from the upstream project:

| Process | Port | Purpose | Source |
|---|---|---|---|
| HTTP service (`main.js`) | `9000` | Account / business APIs (`/account/*`, `/service/*`) | Built into this project |
| UDP room service | `19132` | In-room player sync, actions, chat (ENet) | Optional, [that-sky-xysky-udp-team](https://github.com/that-sky-project/that-sky-xysky-udp-team) |
| UDP admin API | `127.0.0.1:19133` | Room / player queries (local only, not exposed) | Ships with the UDP service |

```
Client ──HTTP──▶ :9000   (login, friends, mail, quests, join room → gets room address)
Client ──UDP───▶ :19132  (real-time room sync, requires the optional UDP service)
Admin ──terminal──▶ console commands (status / players / broadcast / …)
```

---

## Quick Start (HTTP service)

### Requirements

- Node.js **20+** (`start.sh` auto-installs it if missing)
- Linux / macOS (Linux server recommended)

### One-command start

```bash
./start.sh
```

The script handles: dependency install → environment check → start the HTTP service → auto-restart on crash.

```bash
# Check status
./start.sh status

# Stop
./start.sh stop
```

### Manual start (optional)

```bash
npm install
node main.js &          # HTTP :9000
```

---

## UDP Room Service Integration (optional but recommended for multiplayer)

The HTTP service only handles accounts and the join-room API. **To let players see each other and sync in real time, you must also run a UDP room service.** This project does not bundle UDP code — you deploy the upstream [that-sky-xysky-udp-team](https://github.com/that-sky-project/that-sky-xysky-udp-team) and tell the HTTP service where it lives.

### How it works

1. The client logs in and calls the join-room API over HTTP (`:9000`).
2. The HTTP service replies with the room address it gets from `SKY_GAME_URI` (or `src/publicHost.js`).
3. The client connects to that address over UDP (ENet) and syncs position / actions / chat with other players in the room.

So the UDP address you advertise must be reachable from the client — use your **public IP**, not a hostname (client ENet does not resolve hostnames).

### Step 1 — Deploy the HTTP service

Follow [Quick Start](#quick-start-http-service) above and make sure it runs on `:9000`.

### Step 2 — Clone and install the UDP service

```bash
git clone https://github.com/that-sky-project/that-sky-xysky-udp-team.git
cd that-sky-xysky-udp-team
npm install
```

### Step 3 — Configure the UDP service

Edit `config.yml` in the UDP project. Key fields:

```yaml
# config.yml (example — adjust to your server)
server:
  ip: 0.0.0.0            # listen on all interfaces

room:
  port: 19132            # client-facing UDP port
  public_uri: "YOUR_SERVER_IP:19132"   # ⚠️ MUST be your server's PUBLIC IP, not a hostname
```

Replace `YOUR_SERVER_IP` with your server's public IPv4 (e.g. `206.187.214.11`). The `public_uri` is what clients will actually dial.

### Step 4 — Start the UDP service

```bash
node src/main.js
```

Keep it running (use `nohup`, `systemd`, or a supervisor). It listens on UDP `:19132` and also exposes a local admin API on `127.0.0.1:19133` (not exposed publicly).

### Step 5 — Point the HTTP service to your UDP node

Tell this project where the UDP service is. Either set an environment variable when starting:

```bash
SKY_GAME_URI=YOUR_SERVER_IP:19132 ./start.sh
```

or edit `src/publicHost.js` directly and restart:

```js
// src/publicHost.js
gameUri = "YOUR_SERVER_IP:19132";
```

Every join-room API reads this single value, so one change covers all endpoints.

### Configuration mapping

| HTTP side (this project) | UDP side (upstream project) | Purpose |
|---|---|---|
| `SKY_GAME_URI` / `src/publicHost.js` `gameUri` | `room.public_uri` | Address handed to clients — must match! |
| `HTTP_PORT` (`9000`) | — | HTTP API port |
| — | `room.port` (`19132`) | UDP port clients connect to |

Keep the address in `gameUri` and `room.public_uri` **identical** — they are the same value served from both sides.

### Verify it works

```bash
# 1. UDP port is listening
ss -uln | grep 19132        # or: netstat -uln | grep 19132

# 2. UDP port is reachable from outside (run on your local machine / another VPS)
nc -u YOUR_SERVER_IP 19132

# 3. In game: log in with two accounts → join a room → they should see each other
```

If the firewall is on, open the UDP port:

```bash
ufw allow 19132/udp
```

> ⚠️ Most cloud providers (AWS / Azure / Alibaba Cloud / Tencent Cloud / etc.) also require the UDP port to be opened in the **security group / firewall console**, not just in the OS.

---

## Configuration

### Environment variables (HTTP service)

| Variable | Default | Description |
|---|---|---|
| `HTTP_PORT` | `9000` | HTTP service port |
| `SKY_GAME_URI` | `YOUR_SERVER_IP:19132` | UDP address issued by the join-room API (`src/publicHost.js`); **replace with your server's public IP** (client ENet does not resolve hostnames) |
| `SKY_PUBLIC_HOST` | `YOUR_DOMAIN` | Domain shown to clients at the HTTP layer; **set as needed** |
| `SKY_RESOURCE_UPSTREAM` | Official CDN | Upstream address for the resource cache proxy |

### Key files

| File | Purpose |
|---|---|
| `src/publicHost.js` | Central place for the public IP / port; every join-room API reads from here |
| `start.sh` | One-command start / stop / status / backup |

---

## CLI Management

Once the server is running, type commands directly in the terminal (like a Minecraft server console):

| Command | Purpose |
|---|---|
| `status` | Server status (online players / uptime / registered accounts / bans) |
| `players` | Online player list |
| `broadcast <message>` | Global broadcast (written to the notice, visible in-game) |
| `motd get` / `motd set <title> <content>` | View / set the server notice |
| `maintenance on [message]` / `maintenance off` | Turn maintenance mode on / off |
| `register on` / `off` / `status` | Open / close registration |
| `gift <candles> <hearts> <seasonal-candles> <winged-light>` | Configure gifts for new accounts |
| `ban <player> [days] [reason]` | Ban a player (permanent by default, temporary with days) |
| `unban <player>` | Unban a player |
| `banned` | List banned players |
| `kick <player>` | Kick a player offline |
| `stop` | Stop the server |

> The legacy console commands `login`, `give`, `outfit`, `unlock` still work.
> Admin commands work only in the local terminal; no web admin interface is exposed, keeping the public attack surface small.

---

## API Overview

Main API groups (full list in `src/requests/handlers/`):

| Group | Prefix | Description |
|---|---|---|
| Account | `/account/auth/*` | Register, login, session |
| Rooms | `/account/find_previous_or_empty`, `/account/join_*`, `/account/serendipity/*` | Room matching, returns the room address |
| Friends | `/account/friend*`, `/service/relationship/*` | Friends, invite codes |
| Mail | `/account/mail*`, `/account/send_message` | In-game messages |
| Quests | `/account/quest/*`, `/account/get_daily_quests` | Daily / world / seasonal quests |
| Shop | `/account/get_shop*`, `/account/get_spirit_shops` | Shop and items |

---

## Directory Structure

```
sky-server/
├── main.js                 # HTTP entry (:9000)
├── start.sh                # One-command management script (start/stop/status/backup)
├── package.json
├── src/
│   ├── publicHost.js       # Central public IP / port config
│   ├── requests/
│   │   ├── skyNetworkTcp.js            # HTTP server
│   │   ├── netServerRequestHandlers.js # Route dispatch (by domain)
│   │   └── handlers/
│   │       ├── account/     # accountMain / Friend / Room / Misc / Extras
│   │       ├── service/     # serviceMain (internal service APIs)
│   │       └── missingEndpoints.js
│   ├── runtimeData/         # LevelDB, players, mail, bans
│   ├── staticData/          # Shop / outfit / quest static definitions
│   ├── commands/            # Console commands (login / give / status / broadcast / …)
│   └── utils/               # Shared helpers (friends / mail / quests / room lookup)
├── data/                    # Static game data
├── resource_cache/          # Resource cache (generated at runtime)
└── LICENSE
```

> The UDP room service is not part of this repository; deploy the upstream [that-sky-xysky-udp-team](https://github.com/that-sky-project/that-sky-xysky-udp-team) as needed.

---

## FAQ

### Two clients can't see each other / can't join the same room

Walk through this checklist in order:

1. **Is the UDP service actually running?** Check `ss -uln | grep 19132` on the server. If nothing listens, start it (see [UDP Integration](#udp-room-service-integration-optional-but-recommended-for-multiplayer)).
2. **Is the address a public IP, not a hostname?** The client ENet does not resolve hostnames. Both `src/publicHost.js` `gameUri` and the UDP `room.public_uri` must contain your server's public IPv4 and the same port.
3. **Is the UDP port open?** Open `19132/udp` in the OS firewall **and** in your cloud provider's security group / firewall console.
4. **Is UDP reachable from the client's network?** Verify from outside the server: `nc -u <IP> 19132`. If your client runs on a network that blocks UDP, no room sync will happen.
5. **Do both clients see the same room?** They must join through the same HTTP server (same `gameUri` returned). Check the join-room response — it should contain the UDP address with your public IP.

### Changing server / port

- HTTP: update `gameUri` in `src/publicHost.js` (address issued by the join-room API)
- UDP (if deployed): update `room.port` and `public_uri` in the UDP service config accordingly
- Keep both sides identical and restart both services

---

## License

[GPL-3.0](LICENSE)

> The optional UDP room service (that-sky-xysky-udp-team) is released under the upstream **AGPL-3.0** license and is independent of this project.
