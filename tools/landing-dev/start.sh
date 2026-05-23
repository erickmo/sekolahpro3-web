#!/usr/bin/env bash
# Boot the local landing-site dev stack:
#   1. Static server on :4173 (serves apps/landing/dist + /api proxy to Frappe :8080)
#   2. Rebuild webhook on :9999 (debounced pnpm build on POST /rebuild)
#   3. Cloudflare quick tunnel -> public URL
#
# Usage: bash tools/landing-dev/start.sh
# Stop:  bash tools/landing-dev/stop.sh

set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
DIST="${REPO}/apps/landing/dist"
LOG_DIR="${REPO}/tools/landing-dev/.logs"
mkdir -p "${LOG_DIR}"

UPSTREAM="${API_UPSTREAM:-http://localhost:8080}"
STATIC_PORT="${STATIC_PORT:-4173}"
WEBHOOK_PORT="${WEBHOOK_PORT:-9999}"

if [ ! -d "${DIST}" ]; then
  echo "dist not built — running pnpm build first"
  (cd "${REPO}" && pnpm --filter @sekolahpro/app-landing build)
fi

bash "${REPO}/tools/landing-dev/stop.sh" || true
sleep 1

echo "[1/3] static server  :${STATIC_PORT} -> ${DIST}  (/api -> ${UPSTREAM})"
nohup python3 "${REPO}/tools/landing-dev/serve.py" "${DIST}" "${STATIC_PORT}" "${UPSTREAM}" \
  > "${LOG_DIR}/serve.log" 2>&1 &
echo "  pid $! → ${LOG_DIR}/serve.log"

echo "[2/3] rebuild webhook :${WEBHOOK_PORT}  (debounce 10s)"
REBUILD_PORT="${WEBHOOK_PORT}" nohup python3 "${REPO}/tools/landing-dev/rebuild_webhook.py" "${REPO}" \
  > "${LOG_DIR}/webhook.log" 2>&1 &
echo "  pid $! → ${LOG_DIR}/webhook.log"

echo "[3/3] cloudflared quick tunnel -> :${STATIC_PORT}"
nohup cloudflared tunnel --url "http://localhost:${STATIC_PORT}" --no-autoupdate \
  > "${LOG_DIR}/cloudflared.log" 2>&1 &
echo "  pid $! → ${LOG_DIR}/cloudflared.log"

sleep 6
echo
echo "Public URL:"
grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "${LOG_DIR}/cloudflared.log" | head -1 || echo "  (not ready yet, tail ${LOG_DIR}/cloudflared.log)"
