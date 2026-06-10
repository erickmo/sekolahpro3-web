# Akademik Single-Door IA — Design Spec

**Date:** 2026-06-10
**Status:** Approved design, pending implementation plan
**Repos affected:** sekolahpro-web (primary), sekolahpro3 backend (Phase 0)

## Context

The 2026-06-09 Tahun Ajaran merge debate (17-agent, 3 roles) rejected a flat
period-first mega-menu but approved engine consolidation and two narrow backend
fixes. The product owner returned with a refined concept that resolves the
debate's core objection (structure vs daily operations mixed in one taxonomy):

- **Pengaturan (Settings)** — annual setup, done by TU at year rollover:
  classes, rombel, memberships, homeroom assignment, schedule building,
  ekskul programs.
- **Data** — daily/term-time operations, done mostly by Guru: grades,
  attendance, schedule overrides, ekskul registrations, TA-scoped reports.

Decisions taken with the product owner (2026-06-10):

1. Settings/Data split inside the TA workspace: **approved**.
2. Collapse the academic menus into one sidebar door: **approved, phased**
   (not big-bang).
3. Koperasi: **not a school-level module.** It serves multiple schools under
   one organization. Remove the cross-link from the school sidebar; surface a
   Koperasi card on `/pilih` (the only organization-level page today).
   Re-scoping koperasi data/URLs from school to organization is a **separate
   future project**, out of scope here.
4. PPDB: top-level door removed; PPDB lives under Akademik. Public-facing
   PPDB pages (landing/situs) untouched.
5. Laporan: **both** — the Laporan door stays (cross-module deadline cockpit),
   and TA-related reports are also reachable from the TA workspace via
   prefiltered links (two-way).

## Goals

- School sidebar shrinks from 21 doors to 16 (Phase 1), then 15 (Phase 2).
- `/akademik/$ta/*` becomes the single academic workspace, organized into
  Pengaturan and Data groups.
- No broken URLs: every moved route leaves a permanent redirect stub.
- No false period-scoping: pages whose data is not truly TA-filtered must not
  pretend to be, especially under an archived TA.

## Non-Goals

- Koperasi organization re-scoping (data model, `/kop/$organisasi` URLs).
- Building the Beranda "Antrean Saya" triage cockpit (separate tournament
  plan; it gates Phase 2 but is not part of this design).
- Implementing the Jadwal/Kelas/Pesan tournament redesigns. Routes move as-is.
- Backend migration adding real `tahun_ajaran` fields to Daftar Kelas/Rombel
  (Phase 0 item 4 is deferred behind a flag; verify schema during planning).

## Current State (verified 2026-06-10)

- Sidebar defined in `apps/school/src/routes/__root.tsx` (`rawSections`,
  ~line 528): 6 sections, 21 items, filtered by `canSee(to, roles)` over
  `ROLE_MENU_MAP` (~line 305).
- Koperasi entry is a cross-link object (`koperasiCrossLink`, ~line 509)
  pointing to the separate koperasi shell `/kop/$sekolah`. **`/pilih` already
  renders koperasi cards** (`useMySchools().data.koperasi[]`) — no new card
  needed there.
- `/akademik` is already period-first (PR #52): hub listing TA berjalan +
  arsip, auto-redirect, workspace at `/akademik/$ta/<submenu>`, helpers in
  `lib/akademikNav`; the `$ta` layout provides `AkademikContextProvider`
  ({tahunAjaran, semester, isPastPeriod, …}).
- Backend TA fields (verified in doctype JSON, 2026-06-10): **Rombongan
  Belajar HAS `tahun_ajaran` (Link, reqd)** — there is no separate "Daftar
  Kelas" doctype; Jadwal Pelajaran, Ekstrakurikuler, Pendaftaran
  Ekstrakurikuler, Absensi Guru all HAVE `tahun_ajaran`; Pendaftaran PPDB has
  an optional `tahun_ajaran` (target intake year). **Absensi Harian and
  Absensi Pelajaran do NOT** (scoped via `rombel` implicitly).
- `ekskulContext` is not a cloned resolver — it is a separate
  `createPeriodContext("Ekskul")` instance (identity isolation from
  akademik). Consolidation is therefore a frontend wiring task, not backend.
- `isPastPeriod` produces a UI banner only — archived TA data is not
  write-locked in the backend.
- Route counts (files to move in Phase 1): kelas 7, jadwal 13,
  ekstrakurikuler 8, ppdb 11 = 39 route files; absensi 5 stay.

## Phase 0 — Backend prerequisites (sekolahpro backend repo, parallel track)

1. **`tahun_ajaran` on Absensi Harian and Absensi Pelajaran.** Link field +
   backfill patch (derive from `rombel.tahun_ajaran`) + list filters.
   (Absensi Guru already has it.)
2. **Real write-lock for past TA.** Controller-level validation on
   period-scoped doctypes (Absensi*, Asesmen/Nilai, Jadwal Pelajaran,
   Pendaftaran Ekstrakurikuler): reject writes when the document's TA is not
   the active one, bypassable only by an explicit admin flag. Follows the
   Frappe controller-first rule — validation lives in doctype controllers,
   not a service layer.

~~TA resolver consolidation~~ — research showed `ekskulContext` is a separate
context *instance*, not duplicated resolver code; wiring it to the `$ta`
route param is a Phase 1 frontend task (§1.7). ~~TA fields on Kelas/Rombel~~
— dropped: Rombongan Belajar already carries a required `tahun_ajaran`.

Phase 0 gates **Phase 2** only. Phase 1 ships independently.

## Phase 1 — IA restructure (sekolahpro-web)

### 1.1 Sidebar (21 → 16 doors)

Remove from `rawSections`: Kelas, Jadwal, Ekstrakurikuler, PPDB,
Koperasi cross-link. Resulting sections:

```
Utama        Dashboard · Siswa · Guru & Staff
Akademik     Akademik · Absensi
Layanan      Perpustakaan
Operasional  Keuangan & Akuntansi · Pesan · Laporan · Verifikasi Penjemputan
Infra/Master Infrastruktur · Manajemen Aset · Master Data
Lainnya      Situs Web · Audit Log · Pengaturan
```

Absensi stays as a top-level door until Phase 2 (highest-frequency guru
action; do not deepen its path before the Beranda queue exists).

### 1.2 TA workspace navigation (`/akademik/$ta/*`)

Two nav groups added to `lib/akademikNav` (existing submenu entries keep
working):

**Pengaturan** (annual setup)
- Kelas & Rombel — Daftar Kelas, Rombongan Belajar, Anggota Rombongan,
  homeroom (wali) assignment (a Rombel field).
- Susun Jadwal — schedule-building pages from `/jadwal`.
- Program Ekskul — program definition pages from `/ekstrakurikuler`.

**Data** (term-time operations)
- Nilai — existing asesmen/entri nilai pages.
- Pendaftaran Ekskul — registration pages (operational, hence Data, not
  Pengaturan — corrected from the original proposal).
- Override Jadwal — agenda/override pages from `/jadwal`.
- Laporan TA — prefiltered links into Pusat Lapor (`/laporan`), two-way.
- Absensi — **link-out** to `/absensi` in Phase 1; real submenu in Phase 2.

Implementation note (Fase 1): the pill bar ships four groups — Ringkasan,
Pengaturan, Penilaian, Kegiatan (Penilaian + Kegiatan are the Data split).
PPDB, Absensi, and Laporan link from a workspace-dashboard "Tautan modul"
card instead: their routes carry no `$ta`, so they cannot join the pill bar.

### 1.3 Archived-TA guardrail (honesty rule)

Backend fields make honest per-TA rendering possible everywhere (Rombel,
Jadwal Pelajaran, Ekskul all carry `tahun_ajaran`). The rule becomes:

- Every page moved under `$ta` MUST source its TA from
  `useAkademikContext().tahunAjaran` (route param) and filter its queries by
  it — never from a local "current TA" resolver. A page not yet wired this
  way must not ship under `$ta`.
- Archived `$ta` renders real archive data, read-only per the existing
  `isPastPeriod` banner (true backend lock arrives with Phase 0 item 2).

### 1.4 PPDB placement

- Routes move `/ppdb/*` → `/akademik/ppdb/*` — **not** under `$ta`, because
  PPDB targets the *next* TA while the hub auto-redirects to the running TA.
- The TA hub gets a PPDB card ("PPDB <next TA> — N pendaftar") linking to
  `/akademik/ppdb`.
- Public PPDB flows (landing/situs) untouched. Pendaftaran PPDB carries an
  optional `tahun_ajaran` (target intake year) — the hub card shows a real
  count filtered by the upcoming TA.

### 1.5 Koperasi relocation

- Delete `koperasiCrossLink` and its sidebar entry from `__root.tsx`.
- `/pilih` **already renders koperasi cards** (org-grouped + orphan, via
  `useMySchools().data.koperasi[]` → `/kop/$sekolah`) — verified 2026-06-10.
  No new UI needed; koperasi users keep their entry point.
- Koperasi shell `/kop/$sekolah` itself is untouched.

### 1.6 Route migrations + redirect stubs

| Old | New | Stub |
|-----|-----|------|
| `/kelas/*` | `/akademik/$ta/kelas/*` | `/kelas` → resolve active TA, redirect |
| `/jadwal/*` | `/akademik/$ta/jadwal/*` | same pattern |
| `/ekstrakurikuler/*` | `/akademik/$ta/ekskul/*` | same pattern |
| `/ppdb/*` | `/akademik/ppdb/*` | direct redirect |
| `/absensi/*` | unchanged in Phase 1 | — |

Mechanics: `git mv` route files (preserves history, as in PR #52), permanent
redirect stubs at old paths (the old module layout file becomes a
`beforeLoad` redirect that rewrites the subpath), `encodeURIComponent` on
`$ta` (TA names may contain `/`), regenerate `routeTree.gen.ts` before
typecheck. Update in the same pass: `ROLE_MENU_MAP`/`canSee` gating (operator
and bendahara must gain `/akademik`, or they lose their only doors to
kelas/jadwal/ekskul/ppdb), any `Link` with typed params. ⌘K global-search has
no actions for the moved modules (verified) and PageGuide `storageId`s are
path-independent — both need no changes.

### 1.7 Sub-module integration mechanics

- **Chrome bypass:** kelas/jadwal/ekskul keep their own `ModuleShell` +
  internal sub-nav. The `$ta` workspace layout detects sub-module paths
  (pathname regex, same pattern as `showContextBar`) and renders only
  `AkademikContextProvider` + breadcrumb-free `<Outlet/>` for them — no
  nested shells. Workspace `NAV_GROUPS` link *into* each module.
- **TA source swap (per §1.3):** moved pages stop resolving "current TA"
  locally and read `useAkademikContext().tahunAjaran`.
- **Ekskul:** `ekstrakurikuler.tsx` keeps providing `EkskulContextProvider`
  (child components unchanged) but its value is derived from
  `useAkademikContext()` instead of its own stored period state — **TA
  identity only**. The module keeps a local `Semester`-document resolver:
  akademik's `semester` is `"Ganjil"|"Genap"` while ekskul/jadwal filter by
  `Semester` docnames (`SEM-####`); the two value spaces must not be mixed.
  Kelas (no semester axis) passes the workspace value straight through.
- **Cross-TA exemptions:** the kelas approval queue, wali cockpit (kelasku),
  and `$kodeKelas` drilldown deliberately ignore the period (approvals span
  TA rollover) — they move under `$ta` for URL consistency but gain no TA
  filter.

## Phase 2 — Full Data merge

**Gates:** Phase 0 items 1–3 merged AND Beranda "Antrean Saya" live (daily
tasks reachable from the queue, so menu depth no longer hurts guru).

- `/absensi/*` → `/akademik/$ta/absensi/*`, sidebar door removed (16 → 15).
- Laporan two-way links verified against real TA filters.

## Testing

- Vitest: nav-group composition (Pengaturan/Data per role), archived-TA
  guardrail (items hidden/disabled when `$ta` ≠ active), redirect stubs
  (old URL → new URL with resolved TA), `/pilih` koperasi card gating,
  sidebar section filtering after removals.
- Existing page tests move with their routes; PageGuide copy must not embed
  queried labels (bug-032 lesson).
- Full gates per repo standard: tsc 0, eslint 0, vitest green, build ok.

## Risks

| Risk | Mitigation |
|------|------------|
| Guru can't find Absensi after Phase 2 | Phase 2 gated on Beranda queue; door stays meanwhile |
| Archive workspace shows current-year class data | §1.3 guardrail hides convention-scoped settings under archived TA |
| Broken bookmarks/deep links | Permanent redirect stubs, tested |
| `$ta` containing `/` breaks links | `encodeURIComponent` (known recipe) |
| Koperasi users lose their entry point | `/pilih` card ships in the same PR that removes the sidebar link |
| Route move churn vs concurrent sessions | Work in an isolated worktree; verify against `origin/main` before branching |

## Open questions — answered during planning research (2026-06-10)

1. **Rombongan Belajar TA field:** YES — `tahun_ajaran` Link, required
   (`rombongan_belajar.json:32`). No "Daftar Kelas" doctype exists; Rombel is
   the canonical register. Phase 0 migration for it: dropped.
2. **Jadwal/ekskul page mapping:** jadwal Pengaturan = papan, slot,
   slot.$name, slot-override, daftar, permintaan, kotak, persetujuan; jadwal
   Data = agenda, override, pantauan. Ekskul Pengaturan = program, mitra;
   Data = pendaftaran, sesi, raport. Workspace nav links to the module
   landing pages; fine-grained pages stay on each module's internal sub-nav.
3. **PPDB target-TA field:** YES — optional `tahun_ajaran` on Pendaftaran
   PPDB (`pendaftaran_ppdb.json:85`); hub card count filters by it.
