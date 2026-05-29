# sekolahpro-web

Web frontend monorepo for SekolahPro (pnpm + Turborepo workspace).

## Quickstart

Requirements: Node >= 20, pnpm 10.

```bash
pnpm install
pnpm dev        # run all dev tasks
pnpm build      # build everything
pnpm lint
pnpm typecheck
pnpm test
```

## Layout

- `apps/*`     — deployable applications
  - `landing`  — public landing site
  - `merchant` — mobile-first PWA POS (tap-pay kartu siswa). See `apps/merchant/README.md`.
  - `parent`   — parent/wali app
  - `saas`     — SaaS admin/tenant console
  - `school`   — school staff app
  - `student`  — student app
- `packages/*` — shared libraries
  - `api-client`     — RPC/API client
  - `auth`           — auth/session
  - `card`           — student card (NFC/QR) helpers
  - `config`         — shared runtime config
  - `eslint-config`  — shared ESLint config
  - `tenant`         — multi-tenant helpers
  - `tsconfig`       — shared TS configs
  - `ui`             — shared UI components
- `tools/*`    — internal tooling
  - `caddy`       — reverse-proxy config
  - `deploy`      — tag-triggered deploy scripts
  - `e2e`         — Playwright end-to-end smoke tests
  - `landing-dev` — local stack for landing site

Workspace globs (`pnpm-workspace.yaml`): `apps/*`, `packages/*`, `tools/*`.

## Spec

Design spec lives in the Frappe app repo:
`frappe/apps/sekolahpro/docs/superpowers/specs/2026-05-23-monorepo-foundation-design.md`

Implementation plan:
`frappe/apps/sekolahpro/docs/superpowers/plans/2026-05-23-monorepo-foundation.md`
