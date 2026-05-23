#!/usr/bin/env bash
set -euo pipefail

REMOTE="${DEPLOY_REMOTE:?DEPLOY_REMOTE required (e.g. deploy@host)}"
TARGET_DIR="${DEPLOY_TARGET_DIR:-/srv/sekolahpro-web}"

pnpm install --frozen-lockfile
pnpm build

for app in landing school student saas; do
  rsync -az --delete "apps/${app}/dist/" "${REMOTE}:${TARGET_DIR}/${app}/"
done

ssh "${REMOTE}" "caddy reload --config /etc/caddy/Caddyfile"

for host in sekolahpro.id app.sekolahpro.id siswa.sekolahpro.id saas.sekolahpro.id; do
  status=$(curl -s -o /dev/null -w '%{http_code}' "https://${host}/")
  if [ "${status}" != "200" ]; then
    echo "Healthcheck FAILED for ${host}: ${status}" >&2
    exit 1
  fi
done

echo "deploy ok"
