#!/bin/bash
cd "$(dirname "$0")" || exit 1

HTTP_PORT="${HTTP_PORT:-9000}"
RESOURCE_UPSTREAM="${SKY_RESOURCE_UPSTREAM:-https://live.radiance.thatgamecompany.com}"

LOG_DIR="logs"
LOG_HTTP="$LOG_DIR/http.log"
PID_HTTP=".http.pid"
SUPERVISOR_HTTP="/tmp/sky_http_supervisor.sh"
MAX_WAIT=30

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
step()  { echo -e "${BLUE}[*]${NC} $1"; }

ensure_node() {
    if command -v node >/dev/null 2>&1; then
        local major=$(node -v | sed 's/v//' | cut -d. -f1)
        if [ "$major" -ge 18 ] 2>/dev/null; then
            info "Node.js $(node -v) detected"
            return 0
        fi
    fi
    step "Installing Node.js 20..."
    if command -v apt >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
        apt-get install -y nodejs >/dev/null 2>&1
    elif command -v yum >/dev/null 2>&1; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
        yum install -y nodejs >/dev/null 2>&1
    else
        error "Please install Node.js 18+ manually"
        exit 1
    fi
    info "Node.js $(node -v) installed"
}

ensure_dirs() {
    mkdir -p "$LOG_DIR" data resource_cache backups
}

install_deps() {
    step "Installing dependencies..."
    npm install --production --no-audit --no-fund 2>&1 | tail -1
    info "Dependencies installed"
}

open_firewall() {
    if command -v ufw >/dev/null 2>&1; then
        ufw allow ${HTTP_PORT}/tcp >/dev/null 2>&1 || true
    fi
    info "Firewall opened for $HTTP_PORT/tcp"
}

kill_all() {
    step "Cleaning up old processes..."
    local _hp
    _hp=$(cat "$PID_HTTP" 2>/dev/null)
    [ -n "$_hp" ] && { pkill -9 -P "$_hp" 2>/dev/null; kill -9 "$_hp" 2>/dev/null; }
    fuser -k ${HTTP_PORT}/tcp 2>/dev/null
    pgrep -f "^node main.js" 2>/dev/null | while read -r p; do kill -9 "$p" 2>/dev/null; done
    sleep 2
    info "Old processes cleaned up"
}

rotate_log() {
    local f="$1"
    [ -f "$f.5" ] && rm -f "$f.5"
    for i in 4 3 2 1; do
        [ -f "$f.$i" ] && mv "$f.$i" "$f.$((i+1))"
    done
    [ -f "$f" ] && mv "$f" "$f.1"
}

wait_port() {
    local port="$1" i
    for ((i=0; i<MAX_WAIT; i++)); do
        ss -ltn 2>/dev/null | grep -q ":$port " && return 0
        sleep 1
    done
    return 1
}

start_http() {
    info "Starting HTTP (port $HTTP_PORT)..."
    rotate_log "$LOG_HTTP"
    cat > "$SUPERVISOR_HTTP" << SUP
#!/bin/bash
cd "$(pwd)"
export SKY_RESOURCE_UPSTREAM="$RESOURCE_UPSTREAM"
while true; do
    node --expose-gc --max-old-space-size=2048 main.js -p $HTTP_PORT
    echo "[\$(date)] HTTP exited, restarting in 5 seconds..."
    fuser -k $HTTP_PORT/tcp 2>/dev/null
    sleep 5
done
SUP
    chmod +x "$SUPERVISOR_HTTP"
    nohup "$SUPERVISOR_HTTP" >> "$LOG_HTTP" 2>&1 &
    echo $! > "$PID_HTTP"
    if ! wait_port "$HTTP_PORT"; then
        error "HTTP failed to start:"
        tail -20 "$LOG_HTTP"
        return 1
    fi
    info "HTTP running (PID $(cat $PID_HTTP))"
}

show_status() {
    echo "========================================"
    if [ -f "$PID_HTTP" ] && kill -0 $(cat "$PID_HTTP") 2>/dev/null; then
        info "HTTP: running (port $HTTP_PORT)"
    else
        error "HTTP: not running"
    fi
    echo "========================================"
}

backup() {
    mkdir -p backups
    local name="backup_$(date +%Y%m%d_%H%M%S)"
    tar -czf "backups/$name.tar.gz" data 2>/dev/null
    ls -t backups/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    info "Backup created: backups/$name.tar.gz"
}

case "${1:-start}" in
    start)
        echo "========================================"
        echo "  Sky Server launcher"
        echo "========================================"
        ensure_node
        ensure_dirs
        kill_all
        install_deps
        open_firewall
        start_http || exit 1
        echo ""
        echo "========================================"
        info "Started successfully!"
        echo "  HTTP:    port $HTTP_PORT"
        echo "  Logs:    $0 logs"
        echo "  Restart: $0 restart"
        echo "  Stop:    $0 stop"
        echo "========================================"
        ;;
    stop)
        kill_all
        info "Stopped"
        ;;
    restart)
        kill_all
        sleep 1
        "$0" start
        ;;
    status)
        show_status
        ;;
    logs)
        echo "=== HTTP ===" && tail -30 "$LOG_HTTP" 2>/dev/null
        ;;
    tail)
        tail -f "$LOG_HTTP" 2>/dev/null
        ;;
    backup)
        backup
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|tail|backup}"
        exit 1
        ;;
esac
