#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
PID_FILE="$RUN_DIR/rebalance-advisor.pid"
LOG_FILE="$RUN_DIR/rebalance-advisor.log"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4173}"

usage() {
  printf 'Usage: %s {start|stop|restart|status|build}\n' "$0"
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

build_app() {
  cd "$ROOT_DIR"
  pnpm build
}

start_app() {
  mkdir -p "$RUN_DIR"

  local pid
  pid="$(current_pid)"
  if is_running "$pid"; then
    printf 'Rebalance Advisor is already running: http://%s:%s (pid %s)\n' "$HOST" "$PORT" "$pid"
    return
  fi

  build_app
  cd "$ROOT_DIR"
  nohup pnpm preview -- --host "$HOST" --port "$PORT" --strictPort >"$LOG_FILE" 2>&1 &
  local next_pid="$!"
  printf '%s\n' "$next_pid" >"$PID_FILE"
  printf 'Started Rebalance Advisor: http://%s:%s (pid %s)\n' "$HOST" "$PORT" "$next_pid"
  printf 'Log: %s\n' "$LOG_FILE"
}

stop_app() {
  local pid
  pid="$(current_pid)"
  if ! is_running "$pid"; then
    rm -f "$PID_FILE"
    printf 'Rebalance Advisor is not running.\n'
    return
  fi

  kill "$pid"
  rm -f "$PID_FILE"
  printf 'Stopped Rebalance Advisor (pid %s).\n' "$pid"
}

status_app() {
  local pid
  pid="$(current_pid)"
  if is_running "$pid"; then
    printf 'Rebalance Advisor is running: http://%s:%s (pid %s)\n' "$HOST" "$PORT" "$pid"
    printf 'Log: %s\n' "$LOG_FILE"
    return
  fi

  printf 'Rebalance Advisor is not running.\n'
}

case "${1:-}" in
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
