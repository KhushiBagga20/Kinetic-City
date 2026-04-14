#!/bin/bash
# ── Kinetic City — Start all services (Cross-Platform) ───────────────────
set -e

# Detect OS
OS_NAME="$(uname -s)"
case "$OS_NAME" in
    Linux*|Darwin*)
        IS_WINDOWS=false
        PYTHON_CMD="python3"
        ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
        IS_WINDOWS=true
        PYTHON_CMD="python"
        ;;
    *)
        IS_WINDOWS=false
        PYTHON_CMD="python3"
        ;;
esac

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo "  ╔═══════════════════════════════╗"
echo "  ║   KINETIC — Starting up...    ║"
echo "  ╚═══════════════════════════════╝"
echo ""

kill_ports() {
  if [ "$IS_WINDOWS" = true ]; then
    # Kill ports on Windows Git Bash
    for port in 8000 5173; do
        PID_TO_KILL=$(netstat -ano | awk "{if (\$2 ~ /:$port/) print \$5}" | tail -n 1)
        if [ -n "$PID_TO_KILL" ] && [ "$PID_TO_KILL" != "0" ]; then
            taskkill //PID "$PID_TO_KILL" //F >/dev/null 2>&1 || true
        fi
    done
  else
    # Kill ports on Mac/Linux
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
  fi
}

echo "→ Clearing ports 8000 and 5173..."
kill_ports
sleep 0.5

# ── Start Backend ─────────────────────────────────────────────────────────────
echo "→ Starting backend on http://localhost:8000 ..."
cd "$BACKEND"
$PYTHON_CMD -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!
echo "  ✓ Backend PID: $BACKEND_PID"

sleep 2

# ── Start Frontend ────────────────────────────────────────────────────────────
echo ""
echo "→ Starting frontend on http://localhost:5173 ..."
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!
echo "  ✓ Frontend PID: $FRONTEND_PID"

echo ""
echo "  ╔════════════════════════════════════════╗"
echo "  ║  Backend  →  http://localhost:8000     ║"
echo "  ║  Frontend →  http://localhost:5173     ║"
echo "  ║                                        ║"
echo "  ║  Press Ctrl+C to stop everything       ║"
echo "  ╚════════════════════════════════════════╝"
echo ""

cleanup() {
  echo ""
  echo "→ Shutting down..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  kill_ports
  echo "  ✓ All processes stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

wait
