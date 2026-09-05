#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
PID_FILE="$RUN_DIR/rebalance-advisor.pid"
LOG_FILE="$RUN_DIR/rebalance-advisor.log"
HOST_FILE="$RUN_DIR/rebalance-advisor.host"
PORT_FILE="$RUN_DIR/rebalance-advisor.port"
HOST="${HOST:-127.0.0.1}"
PORT_WAS_PROVIDED=false
if [[ -n "${PORT:-}" ]]; then
  PORT_WAS_PROVIDED=true
fi
PORT="${PORT:-4173}"

usage() {
  printf 'Usage: %s {start|stop|restart|status|build} [--host HOST] [--port PORT]\n' "$0"
  printf 'Examples:\n'
  printf '  %s start --port 4180\n' "$0"
  printf '  %s stop --port 4180\n' "$0"
  printf '  PORT=4180 %s start\n' "$0"
}

current_pid() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE"
  fi
}

is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

saved_host() {
  if [[ -f "$HOST_FILE" ]]; then
    cat "$HOST_FILE"
    return
  fi
  printf '%s\n' "$HOST"
}

saved_port() {
  if [[ -f "$PORT_FILE" ]]; then
    cat "$PORT_FILE"
    return
  fi
  printf '%s\n' "$PORT"
}

validate_port() {
  if [[ ! "$PORT" =~ ^[0-9]+$ ]] || ((PORT < 1 || PORT > 65535)); then
    printf 'Invalid port: %s\n' "$PORT" >&2
    exit 2
  fi
}

listening_pid() {
  lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

build_app() {
  cd "$ROOT_DIR"
  pnpm build
}

start_app() {
  mkdir -p "$RUN_DIR"
  validate_port

  local pid
  pid="$(current_pid)"
  if is_running "$pid"; then
    printf 'Rebalance Advisor is already running: http://%s:%s (pid %s)\n' "$(saved_host)" "$(saved_port)" "$pid"
    return
  fi

  build_app
  cd "$ROOT_DIR"
  node -e '
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const [logFile, rootDir, host, port] = process.argv.slice(1);
const output = fs.openSync(logFile, "a");
const child = spawn(process.execPath, [
  `${rootDir}/node_modules/vite/bin/vite.js`,
  "preview",
  "--host",
  host,
  "--port",
  port,
  "--strictPort",
], {
  cwd: rootDir,
  detached: true,
  stdio: ["ignore", output, output],
});
child.unref();
' "$LOG_FILE" "$ROOT_DIR" "$HOST" "$PORT"

  local next_pid=""
  for _ in {1..20}; do
    next_pid="$(listening_pid)"
    if [[ -n "$next_pid" ]]; then
      break
    fi
    sleep 0.25
  done

  if [[ -z "$next_pid" ]]; then
    rm -f "$PID_FILE" "$HOST_FILE" "$PORT_FILE"
    printf 'Failed to start Rebalance Advisor on http://%s:%s\n' "$HOST" "$PORT" >&2
    printf 'Log: %s\n' "$LOG_FILE" >&2
    exit 1
  fi

  printf '%s\n' "$next_pid" >"$PID_FILE"
  printf '%s\n' "$HOST" >"$HOST_FILE"
  printf '%s\n' "$PORT" >"$PORT_FILE"
  printf 'Started Rebalance Advisor: http://%s:%s (pid %s)\n' "$HOST" "$PORT" "$next_pid"
  printf 'Log: %s\n' "$LOG_FILE"
}

stop_app() {
  if [[ "$PORT_WAS_PROVIDED" == "true" ]]; then
    validate_port
  fi

  local pid
  pid="$(current_pid)"
  if ! is_running "$pid"; then
    if [[ "$PORT_WAS_PROVIDED" == "true" ]]; then
      pid="$(listening_pid)"
      if is_running "$pid"; then
        kill "$pid"
        rm -f "$PID_FILE"
        rm -f "$HOST_FILE" "$PORT_FILE"
        printf 'Stopped Rebalance Advisor on port %s (pid %s).\n' "$PORT" "$pid"
        return
      fi
    fi

    rm -f "$PID_FILE"
    rm -f "$HOST_FILE" "$PORT_FILE"
    printf 'Rebalance Advisor is not running.\n'
    return
  fi

  kill "$pid"
  rm -f "$PID_FILE"
  rm -f "$HOST_FILE" "$PORT_FILE"
  printf 'Stopped Rebalance Advisor (pid %s).\n' "$pid"
}

status_app() {
  local pid
  pid="$(current_pid)"
  if is_running "$pid"; then
    printf 'Rebalance Advisor is running: http://%s:%s (pid %s)\n' "$(saved_host)" "$(saved_port)" "$pid"
    printf 'Log: %s\n' "$LOG_FILE"
    return
  fi

  printf 'Rebalance Advisor is not running.\n'
}

COMMAND="${1:-}"
if [[ "$COMMAND" == "--help" || "$COMMAND" == "-h" ]]; then
  usage
  exit 0
fi

if [[ $# -gt 0 ]]; then
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --host)
      if [[ $# -lt 2 ]]; then
        printf 'Missing value for --host\n' >&2
        exit 2
      fi
      HOST="$2"
      shift 2
      ;;
    --port|-p)
      if [[ $# -lt 2 ]]; then
        printf 'Missing value for --port\n' >&2
        exit 2
      fi
      PORT="$2"
      PORT_WAS_PROVIDED=true
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      usage
      exit 2
      ;;
  esac
done

case "$COMMAND" in
  start)
    start_app
    ;;
  stop)
    stop_app
    ;;
  restart)
    stop_app
    start_app
    ;;
  status)
    status_app
    ;;
  build)
    build_app
    ;;
  *)
    usage
    exit 2
    ;;
esac
