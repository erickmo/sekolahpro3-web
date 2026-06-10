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
  ~line 528): 6 sections, 21 items, filtered by `canSee(to, roles)`.
- Koperasi entry is a cross-link object (`koperasiCrossLink`, ~line 509)
  pointing to the separate koperasi shell `/kop/$sekolah`.
- `/akademik` is already period-first (PR #52): hub listing TA berjalan +
  arsip, auto-redirect, workspace at `/akademik/$ta/<submenu>`, helpers in
  `lib/akademikNav`.
- Jadwal pages are TA-aware; Absensi Guru carries TA; **Absensi Harian does
  not**; Kelas/Rombel are TA-scoped by convention only; ekskul has its own
  cloned TA context (`ekskulContext`).
- `isPastPeriod` produces a UI banner only — archived TA data is not
  write-locked in the backend.

## Phase 0 — Backend prerequisites (sekolahpro3, parallel track)

1. **TA resolver consolidation.** Single shared resolver; delete the
   `ekskulContext` TA clone and import the shared one. (Debate verdict: DO.)
2. **`tahun_ajaran` on Absensi Harian.** Link field + backfill patch + list
   filters. (Absensi Guru already has it.)
3. **Real write-lock for past TA.** Controller-level validation on
   period-scoped doctypes (Absensi*, Asesmen/Nilai, Slot Jadwal, ekskul
   registration): reject writes when the document's TA is not the active one,
   bypassable only by an explicit admin flag. Follows the Frappe
   controller-first rule — validation lives in doctype controllers, not a
   service layer.
4. **Deferred (flagged):** real `tahun_ajaran` fields on Daftar Kelas/Rombel
   + data migration. Until this lands, the UI must not claim per-TA class
   data (see Phase 1 guardrail below).

Phase 0 items 1–3 gate **Phase 2**. Phase 1 may ship before Phase 0 completes
because of the archived-TA guardrail below.

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

Exact page-to-group assignment for jadwal/ekskul pages is a planning-phase
task (list every route file, classify Pengaturan vs Data).

### 1.3 Archived-TA guardrail (honesty rule)

Inside a workspace whose `$ta` is not the active TA:

- Pengaturan items backed by convention-scoped data (Kelas & Rombel, Susun
  Jadwal) are **disabled (visible, non-clickable)** with the caption "hanya
  tersedia untuk tahun ajaran berjalan" until Phase 0 item 4 lands. Showing current-year
  class data under an archive label is lying to the user.
- Data items that are genuinely TA-filtered (nilai, TA-aware jadwal pages,
  ekskul after resolver consolidation) render normally, read-only per the
  existing `isPastPeriod` banner (true lock arrives with Phase 0 item 3).

### 1.4 PPDB placement

- Routes move `/ppdb/*` → `/akademik/ppdb/*` — **not** under `$ta`, because
  PPDB targets the *next* TA while the hub auto-redirects to the running TA.
- The TA hub gets a PPDB card ("PPDB <next TA> — N pendaftar") linking to
  `/akademik/ppdb`.
- Public PPDB flows (landing/situs) untouched. Verify during planning whether
  PPDB doctypes carry a target-TA field; if so the card can show real counts.

### 1.5 Koperasi relocation

- Delete `koperasiCrossLink` and its sidebar entry from `__root.tsx`.
- Add a Koperasi card/entry on `/pilih` (school picker — today's only
  organization-level surface) linking to the koperasi shell, gated by the
  same role check the cross-link used (`canSee("/koperasi", roles)` logic).
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
redirect stubs at old paths (existing repo pattern), `encodeURIComponent` on
`$ta` (TA names may contain `/`), regenerate `routeTree.gen.ts` before
typecheck. Update in the same pass: ⌘K command entries, `canSee` route
gating, PageGuide ids, any `Link` with typed params (`linkParamsFor` casts).

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

## Open questions for the planning phase

1. Does Rombongan Belajar already carry a `tahun_ajaran` field, or is scoping
   purely conventional? (Determines Phase 0 item 4 scope.)
2. Which exact `/jadwal` and `/ekstrakurikuler` route files map to Pengaturan
   vs Data groups?
3. Does PPDB carry a target-TA field usable for the hub card count?
