#!/usr/bin/env bash
# Stop the landing-site dev stack.
set -e
for pat in "landing-dev/serve.py" "serve_landing.py" "rebuild_webhook.py" "rebuild_landing.py" "cloudflared tunnel"; do
  pids=$(pgrep -f "${pat}" || true)
  if [ -n "${pids}" ]; then
    echo "killing ${pat}: ${pids}"
    kill ${pids} 2>/dev/null || true
  fi
done
