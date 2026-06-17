# Akademik Single-Door — Fase 2 (IA-only FE)

- **Date:** 2026-06-17
- **Status:** Implemented (2026-06-17) — tsc 0 / vitest 1453 / eslint 0 errors / build ok
- **Scope size:** L (route migration, > 10 files, touches routing + nav libs)
- **Predecessor:** `docs/superpowers/plans/2026-06-10-akademik-single-door-fase1.md` (Fase 1, merged PR #92)
- **App:** `apps/school` (web)

## 1. Problem

Three route groups still live outside the Akademik single-door workspace even though
they belong to an academic-year (Tahun Ajaran / TA) workflow:

- `/sch/$sekolah/siswa/rombel` — class membership (Anggota Rombel)
- `/sch/$sekolah/siswa/pendaftaran` (+ `new`, `$id`) — student admission applications
- `/sch/$sekolah/absensi/**` — attendance (5 surfaces)

Fase 1 already moved `kelas`/`jadwal`/`ekskul` under `/akademik/$ta/*` and `ppdb` under
`/akademik/ppdb`. This is the planned **Fase 2** continuation (the Fase 1 plan explicitly
deferred "absensi masuk" to Fase 2).

## 2. Goal & Non-Goals

**Goal:** Relocate the three groups into the Akademik shell so the sidebar/IA is a single
door, while keeping deep links alive via permanent redirect stubs. Pure information-architecture
move on the frontend. Match the Fase 1 pattern exactly.

**Non-Goals (explicitly out of scope):**
- Backend `tahun_ajaran` field on `Absensi Harian` / `Absensi Pelajaran` / `Pendaftaran Siswa`
  (this is the deferred Fase 0 BE work). No migration, no fixtures, no controller change.
- True per-year filtering of date-driven attendance surfaces.
- Beranda antrean gating (separate Fase 2 item).
- Any change to `/akademik/ppdb` (done in Fase 1).

## 3. Findings (current state)

| Group | Backend doctype | TA-keyed today? | Own ModuleShell? |
|---|---|---|---|
| `siswa/rombel` | `Anggota Rombel` | No (membership spans years) | No (uses Siswa shell) |
| `siswa/pendaftaran` ×3 | `Pendaftaran Siswa` | No (no `tahun_ajaran` field) | No (uses Siswa shell) |
| `absensi/` ×5 | `Absensi Harian` / `Absensi Pelajaran` / `Absensi Guru` | Partial — only `guru` (`Absensi Guru` has `tahun_ajaran`); harian/pelajaran are date-driven | Yes (own ModuleShell + period provider) |

**Key discovery:** `siswa/rombel.tsx` is a **duplicate** of the already-migrated
`akademik/$ta/kelas/anggota.tsx` — same doctype `Anggota Rombel`, same
`AnggotaRombelFormModal`, both unfiltered-by-TA. So `rombel` is a stub, not a move.

**Absensi design comment (preserved):** only `Absensi Guru` is TA-scoped (back-dating teacher
presence is a risk); daily surfaces (Harian, Pelajaran) have no `tahun_ajaran` and stay
date-driven with a passive TA chip. This behavior is **kept as-is**.

## 4. Decisions (user-approved)

1. **Scope:** IA-only FE. Backend untouched.
2. **Pendaftaran placement:** `/akademik/$ta/pendaftaran` (under TA workspace). `$ta` is
   cosmetic for this doctype (no TA field) — accepted.
3. **Rombel:** redirect-stub `/siswa/rombel` → `/akademik/$ta/kelas/anggota`; drop the Siswa
   "Anggota Rombel" nav item. No new page.
4. **Absensi TA source:** switch from self-managed `usePeriodeSwitcher` (localStorage) to the
   akademik `$ta` route param — single source of truth. `StripTahun` on the Guru page changes
   year by navigating to a different `$ta` (not localStorage).

## 5. Design

### 5.1 Per-group treatment

**A. `siswa/rombel` → stub.**
- Replace `routes/sch.$sekolah.siswa.rombel.tsx` with a redirect stub to the hub:
  `?go=kelas/anggota` (workspace stub forwards through TA resolution to
  `/akademik/$ta/kelas/anggota`).
- Remove the "Anggota Rombel" item from `SISWA_NAV_GROUPS` (`lib/orang/nav.ts`, Data Pokok group).

**B. `siswa/pendaftaran` ×3 → workspace pages under `/akademik/$ta/pendaftaran`.**
- These pages have no ModuleShell of their own → they become **plain workspace pages** rendered
  under the Akademik workspace chrome + pill nav (NOT a chrome-bypass submodule).
- `git mv` the 3 files to `akademik.$ta.pendaftaran.{index,new,$id}.tsx`; update
  `createFileRoute` id and every `useParams({ from })` to include `$ta`.
- Internal `to=`/`params` links updated to carry `$ta`.
- Add a workspace nav entry (new "Penerimaan" group → "Pendaftaran Siswa") in
  `buildWorkspaceNavGroups()` (`lib/akademikNav.ts`).
- Leave permanent stubs at `/siswa/pendaftaran` (index) + `/siswa/pendaftaran/$` (splat for
  `new`/`$id` deep links) → hub `?go=pendaftaran/...`.
- Remove "Pendaftaran" item from `SISWA_NAV_GROUPS` (Penerimaan group keeps "Mutasi Masuk").

**C. `absensi/` ×5 → chrome-bypass submodule under `/akademik/$ta/absensi/*`.**
- Absensi keeps its own ModuleShell + 4-surface sub-nav → register it as a **submodule**
  (chrome bypass, like `kelas`/`jadwal`) so the Akademik workspace chrome is suppressed and only
  Absensi's own shell renders (no shell-in-shell).
- `git mv` 5 files → `akademik.$ta.absensi.{tsx,index,daftar,guru,pelajaran}.tsx`; update route
  ids + `useParams` for `$ta`; update internal links.
- **TA source change:** the layout reads TA from the akademik `$ta` param / `useAkademikContext`
  instead of `usePeriodeSwitcher`. `StripTahun` (Guru page) `onChange` → `navigate` to the same
  route with a new `ta` param (`taPath(newTa)`). `isPastPeriod` for the Guru create-gate comes
  from akademik context. Harian/Pelajaran keep the passive `TahunChip`.
- Remove the sidebar door `mk("/absensi", "Absensi", …)` in `__root.tsx`.
- Add an "Absensi" entry to `buildWorkspaceNavGroups()` (Kehadiran group).
- Leave stubs at `/absensi` (index) + `/absensi/$` (splat) → hub `?go=absensi/...`.

### 5.2 Shared mechanics

**Workspace-root registry split.** Today `WORKSPACE_MODULE_ROOTS = ["kelas","jadwal","ekskul"]`
drives both (a) `?go=` validation and (b) `isSubmodulePath` chrome-bypass. Fase 2 needs them to
diverge (pendaftaran is a valid `?go=` target but must NOT bypass chrome). Introduce:
- `WORKSPACE_GO_ROOTS` — valid `?go=` roots for stubs: `kelas, jadwal, ekskul, absensi, pendaftaran`.
  Used by `parseGoParam` / `workspaceGoHref`.
- `SUBMODULE_SHELL_ROOTS` — roots whose own ModuleShell replaces akademik chrome:
  `kelas, jadwal, ekskul, absensi` (NOT pendaftaran). Used by `isSubmodulePath`.

(Exact refactor of `akademikNav.ts` confirmed against source during plan/impl; the existing
single constant may be kept as one of the two sets to minimize churn.)

**Fixed-target hub stub.** `rombel` needs `?go=kelas/anggota` (a fixed sub-path, not derived from
a splat). Add a small factory to `lib/legacyRedirects.ts`, e.g.
`hubGoStubBeforeLoad(go: string)` that throws `redirect({ to: "/sch/$sekolah/akademik",
search: { go } })`. Reuse the existing `workspaceStubBeforeLoad(root)` for pendaftaran/absensi
splat stubs.

**Stub → hub → workspace flow (unchanged from Fase 1):** stub throws redirect to
`/akademik?go=<path>`; the hub auto-resolves the running TA (`pickAutoRedirectTa`) and forwards via
`workspaceGoHref` to `/akademik/$ta/<path>`. `parseGoParam` must accept the new roots.

### 5.3 Test convention

- Migrated route pages keep the **named-export `Route` + named page component** convention
  (avoids the `Route.component` tsc failure noted in Fase 1).
- New/updated unit tests:
  - stub wiring: each stub redirects to the correct `?go=` / target.
  - `parseGoParam` accepts `absensi`, `pendaftaran`, `kelas/anggota`; still rejects traversal.
  - `isSubmodulePath`: true for `absensi`, **false** for `pendaftaran`.
  - `buildWorkspaceNavGroups` includes the new entries.
  - absensi layout: TA comes from `$ta`; Guru `StripTahun` change navigates `ta`.

## 6. Files touched (estimate)

- **Moves:** 3 (pendaftaran) + 5 (absensi) via `git mv`.
- **Stubs:** `siswa.rombel`, `siswa.pendaftaran.index` + `.$`, `absensi.index` + `.$` (~5 files).
- **Libs:** `lib/orang/nav.ts`, `lib/akademikNav.ts`, `lib/legacyRedirects.ts`,
  `lib/absensiPeriode.ts` (TA source), `routes/__root.tsx` (sidebar).
- **Tests:** stub-wiring, nav, `parseGoParam`, `isSubmodulePath`, absensi-layout.

## 7. Verification (inline, per memory: avoid concurrent full builds)

`pnpm generate` (routeTree) → `pnpm typecheck` (tsc 0) → `pnpm lint` (0) →
`pnpm test` (vitest, no regressions) → `pnpm build` (ok). Run sequentially in the worktree.

## 8. Risks

- **Double TA source on absensi** if the `usePeriodeSwitcher` removal is incomplete → assert the
  layout reads only `$ta`.
- **routeTree.gen** is gitignored and causes phantom tsc errors until regenerated — run
  `pnpm generate` before typecheck (memory: routetree-gen-phantom-typecheck).
- **TA autoname may contain `/`** → keep using `taPath()` / `encodeURIComponent` for `$ta`.
- **Stale local main** → branch is off `origin/main` (worktree fresh) to avoid Fase 1 conflicts.
