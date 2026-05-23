# landing-dev — local stack for testing the Vite landing site end-to-end

Boots three processes:

| Process | Port | Purpose |
|---|---|---|
| `serve.py` | 4173 | Serves `apps/landing/dist/` as static + auto-resolves `.html` + proxies `/api/*` to Frappe |
| `rebuild_webhook.py` | 9999 | Debounced rebuild on `POST /rebuild` (called by Frappe `on_update` doc_events) |
| `cloudflared tunnel` | — | Public HTTPS URL → 4173 (no signup, no interstitial) |

## Quick start

```bash
bash tools/landing-dev/start.sh
# logs:  tools/landing-dev/.logs/{serve,webhook,cloudflared}.log
# stop:  bash tools/landing-dev/stop.sh
```

The script prints the public Cloudflare URL after ~6s.

## Auto-rebuild flow

1. Editor opens Frappe Desk → edits `Homepage Content` / `Site Content` / `Fitur Content` / `Partner Content` / `Kontak Content` / `Berita Page` / `News Article`.
2. Save fires `on_update` → `sekolahpro.services.landing_rebuild.trigger`.
3. Trigger POSTs `http://host.docker.internal:9999/rebuild`.
4. Webhook debounces 10s, then runs `pnpm --filter @sekolahpro/app-landing build`.
5. New `dist/` HTML is live on next request — no server restart needed.

## Frappe config knobs

| Site config key | Default | Purpose |
|---|---|---|
| `landing_rebuild_webhook` | `http://host.docker.internal:9999/rebuild` | Where Frappe POSTs |

Set via `bench --site sekolahpro.localhost set-config landing_rebuild_webhook 'http://other-host:9999/rebuild'`.

## Env vars for the webhook script

| Var | Default | Purpose |
|---|---|---|
| `REBUILD_PORT` | 9999 | Webhook listen port |
| `REBUILD_DEBOUNCE` | 10 | Seconds to wait after last POST before rebuilding |

## Production note

This stack is for **local development only**. Production deployment uses Caddy + the `deploy.sh` script (`tools/deploy/`) which builds in CI and rsyncs to the VPS. The auto-rebuild webhook is not used in prod — content changes there would trigger a CI build via a Webhook DocType pointing at a GitHub Actions `workflow_dispatch` endpoint instead.
