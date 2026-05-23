# Caddy configs

## `Caddyfile.dev`

Local-only Caddyfile for testing the four web surfaces (landing, school app,
student app, SaaS console) against a Frappe backend on `host.docker.internal:8000`.

Use this once each app has been built and its `dist/` directory is mounted at
`/srv/sekolahpro-web/<surface>/`. Caddy serves HTTPS on `:8443` with `local_certs`;
add the relevant `*.sekolahpro.localhost` entries to your `/etc/hosts` (developer
machine step — not handled here).

Not for production.

## `custom-domain.tmpl.caddy`

Template rendered by SaaS onboarding when a tenant attaches their own domain.
The `$CUSTOM_DOMAIN` placeholder is substituted at render time, the resulting
site block is dropped into the production Caddy config, and Caddy is reloaded.

`/api/*` is reverse-proxied to the `frappe-backend` service; `/siswa/*` serves
the student SPA; everything else serves the school SPA.

## Production

The production Caddyfile lives at `/etc/caddy/Caddyfile` on the VPS and is not
checked into this repo. Only the dev file and the custom-domain template belong
here.
