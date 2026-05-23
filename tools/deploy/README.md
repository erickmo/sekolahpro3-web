# Deploy

Tag-triggered deploy for the sekolahpro-web monorepo.

## Trigger

Push a git tag matching `web-v*` (e.g. `web-v1.0.0`) to `main`. The
`.github/workflows/deploy.yml` workflow runs `tools/deploy/deploy.sh`
in the `production` environment.

## Required GitHub secrets

- `DEPLOY_SSH_KEY` — private SSH key authorized on the deploy host (used by `webfactory/ssh-agent`).
- `DEPLOY_HOST` — hostname of the deploy target (used to build `deploy@$DEPLOY_HOST` and populate `known_hosts`).

## What the script does

1. `pnpm install --frozen-lockfile` + `pnpm build` (Turbo builds all apps).
2. `rsync -az --delete apps/<app>/dist/` for `landing`, `school`, `student`, `saas` to `/srv/sekolahpro-web/<app>/` on the remote.
3. `ssh ... caddy reload --config /etc/caddy/Caddyfile`.
4. Healthchecks `https://{sekolahpro.id, app.sekolahpro.id, siswa.sekolahpro.id, saas.sekolahpro.id}/` — non-200 fails the deploy.

## Target

- Remote: `deploy@$DEPLOY_HOST`
- Target dir: `/srv/sekolahpro-web` (override with `DEPLOY_TARGET_DIR`)
