#!/usr/bin/env bash
# Chaukas AI - ek command start (Mac/Linux):  bash start-mac-linux.sh
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
[ -f "$ROOT/frontend/.env" ] || cp "$ROOT/frontend/env.ready" "$ROOT/frontend/.env"
[ -f "$ROOT/backend/.env" ] || { [ -f "$ROOT/backend/env.ready" ] && cp "$ROOT/backend/env.ready" "$ROOT/backend/.env" && true; } || true
[ -f "$ROOT/backend/.env" ] || { cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"; echo "[INFO] backend/.env bana diya - KODEKEY_API_KEY daalo"; }
cd "$ROOT/backend"
[ -d venv ] || python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
pip install -q -r requirements-optional.txt 2>/dev/null || true
cd "$ROOT/frontend"
[ -d node_modules ] || npm install
(cd "$ROOT/backend" && source venv/bin/activate && uvicorn app.main:app --port 8000 --reload) &
BACK=$!
trap "kill $BACK 2>/dev/null" EXIT
sleep 3
npm run dev
