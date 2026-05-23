# sekolahpro-web

Web frontend monorepo for SekolahPro (pnpm + Turborepo workspace).

## Quickstart

Requirements: Node >= 20, pnpm 9.

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
- `packages/*` — shared libraries (ui, api client, config, etc.)
- `tools/*`    — internal tooling

(Apps and packages are added in subsequent foundation tasks — this repo currently contains only the workspace skeleton.)

## Spec

Design spec lives in the Frappe app repo:
`frappe/apps/sekolahpro/docs/superpowers/specs/2026-05-23-monorepo-foundation-design.md`

Implementation plan:
`frappe/apps/sekolahpro/docs/superpowers/plans/2026-05-23-monorepo-foundation.md`
