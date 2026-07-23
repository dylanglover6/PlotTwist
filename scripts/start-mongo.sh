#!/usr/bin/env bash
# Start a local MongoDB for Plot Twist development.
#
# Looks for `mongod` on your PATH first, then falls back to the standalone
# binary under ~/.local/mongodb (how this machine was set up — no Homebrew).
# Stores data in ~/.local/mongodb/data and logs to ~/.local/mongodb/log.
# Safe to run repeatedly: it no-ops if MongoDB is already listening on 27017.
set -euo pipefail

PORT="${MONGO_PORT:-27017}"
BASE="$HOME/.local/mongodb"
DATA_DIR="$BASE/data"
LOG_FILE="$BASE/log/mongod.log"

# Already up? Nothing to do.
if lsof -iTCP:"$PORT" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
  echo "MongoDB already listening on 127.0.0.1:$PORT — nothing to do."
  exit 0
fi

# Locate mongod: PATH, then the standalone install.
if command -v mongod >/dev/null 2>&1; then
  MONGOD="$(command -v mongod)"
else
  MONGOD="$(ls "$BASE"/mongodb-macos-*/bin/mongod 2>/dev/null | head -1 || true)"
fi

if [ -z "${MONGOD:-}" ] || [ ! -x "$MONGOD" ]; then
  echo "Could not find mongod. Install it or drop the standalone build under $BASE." >&2
  exit 1
fi

mkdir -p "$DATA_DIR" "$(dirname "$LOG_FILE")"

echo "Starting $("$MONGOD" --version | head -1) on 127.0.0.1:$PORT ..."
"$MONGOD" \
  --dbpath "$DATA_DIR" \
  --bind_ip 127.0.0.1 \
  --port "$PORT" \
  --fork \
  --logpath "$LOG_FILE"

echo "MongoDB is up. Log: $LOG_FILE"
