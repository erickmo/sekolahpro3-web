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

## Production

In production, `frappe.conf.landing_rebuild_webhook` is set to the GitHub
repository_dispatch URL of the sekolahpro-web repo:

```
landing_rebuild_webhook = "https://api.github.com/repos/<org>/sekolahpro-web/dispatches"
landing_rebuild_github_token = "<PAT with repo: dispatch scope>"
```

The CMS-rebuild GitHub Actions workflow (`.github/workflows/cms-rebuild.yml`)
catches the `cms-update` event and runs `pnpm build` + rsync to the VPS.

Frappe-side set commands:

```bash
bench --site <site> set-config landing_rebuild_webhook \
  "https://api.github.com/repos/<org>/sekolahpro-web/dispatches"
bench --site <site> set-config landing_rebuild_github_token "<PAT>"
```

The PAT only needs `repo: dispatch` scope.
