# ModuleShell — Unified Module Chrome

Date: 2026-06-03
Status: Approved (brainstorming)
Domain: app-school (frontend, TanStack Router file routes)

## Problem

Submenu pages are visually inconsistent. Only 3 of ~21 modules (akademik,
ekstrakurikuler, perpustakaan) render the cohesive sticky header — a context
row fused with a sub-nav tab row (`ModuleHeader` + `GroupedNavTabs variant="header"`).
The other 18 use raw `Tabs`, stacked `GroupedNavTabs`, a mega menu, or a hub nav,
with no sticky context+nav panel. The user wants every multi-page module to match
the ekstrakurikuler "Pendaftaran" reference page.

## Goal

Every multi-page `sch.$sekolah.*` module renders:
1. A sticky, full-bleed `ModuleHeader` panel = optional context row + header sub-nav.
2. Per-page `PageHeader` (breadcrumb eyebrow + title + description) — already
   present on ~95% of pages, so almost no per-page edits.

Chrome lives at the **module layout** level; converting a module = editing its
one `sch.$sekolah.{module}.tsx` layout file (plus a nav-config lib where useful).

## Scope

### In scope (13 convert + 3 refactor)
- Convert: absensi, ppdb, siswa, staff, aset, keuangan, akuntansi, master,
  jadwal, kelas, infrastruktur, pengaturan, situs.
- Refactor onto shared component: akademik, ekstrakurikuler, perpustakaan.

### Out of scope
- Single-page modules: audit, laporan, pesan, pickup-verify (no submenu).
- koperasi (`kop/$sekolah` — separate route tree, separate session/layout).
- No new Tahun Ajaran / Semester wiring into modules that never had it.

## Design

### New shared components (`src/components/shell/`)

**`ModuleShell`** — config-driven layout wrapper. Renders the existing
`ModuleHeader` with two slots:
- context slot: `<ModuleContextBar>` (default, built from props) OR a custom node
  (period modules pass their own period bar) OR nothing (config-only modules).
- nav slot: `<GroupedNavTabs variant="header">` built from `navGroups`.

Props:
```
label?: string            // "Absensi" -> context bar shows "Konteks Absensi"
framing?: string          // one-line audience/purpose description
roleLabel?: string        // resolved role badge text (optional)
cta?: ReactNode           // optional right-aligned action slot
navGroups: NavTabGroup[]  // required
pathname: string          // required (active-tab detection)
context?: ReactNode       // override default bar (period modules)
children?: ReactNode       // page outlet content wrapper is caller's responsibility
```
Rule: when neither `context` nor any of `label/framing/roleLabel/cta` is supplied,
the context row is omitted entirely (config-only modules get header + nav only).

**`ModuleContextBar`** — generalization of the perpustakaan/aset role bars.
Renders `KONTEKS {LABEL}` + framing line + optional role badge + optional CTA.
Pure/dumb: takes only props (`label`, `framing?`, `roleLabel?`, `cta?`),
router-free, trivially testable. Reuses the existing context-row markup contract
(`px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2`) so it
sits flush in `ModuleHeader` exactly like the ekstrakurikuler bar.

### Generic role label

`src/lib/genericRole.ts` — `useGenericRoleLabel()` returns a Bahasa Indonesia
label for the user's primary session role, built on the existing
`deriveRoles`/`sessionRole.ts` engine (one shared matcher table, NOT per-module
buckets). Used by modules lacking a dedicated role lib. aset keeps `useAsetRole`.

### Per-module plan

| Module | Context row | Sub-nav source |
|---|---|---|
| absensi | ModuleContextBar (framing + role) | new ABSENSI_NAV_GROUPS |
| ppdb | ModuleContextBar (framing + role) | new PPDB_NAV_GROUPS (grouped; 9 items) |
| siswa | ModuleContextBar (framing + role) | existing SISWA_NAV_GROUPS (lib/orang/nav) |
| staff | ModuleContextBar (framing + role) | existing STAFF_NAV_GROUPS (lib/orang/nav) |
| aset | ModuleContextBar fed by useAsetRole | ASET tabs -> NavTabGroup[] |
| keuangan | ModuleContextBar (finance framing) | convert hub -> NavTabGroup[] header |
| akuntansi | ModuleContextBar (finance framing) | convert hub -> NavTabGroup[] header |
| master | none (config) | convert mega menu -> NavTabGroup[] (Umum/Akademik) |
| jadwal | none (config) | new JADWAL_NAV_GROUPS |
| kelas | none (config) | new KELAS_NAV_GROUPS |
| infrastruktur | none (config) | new INFRA_NAV_GROUPS |
| pengaturan | none (config) | new PENGATURAN_NAV_GROUPS |
| situs | none (config) | convert situs tabs -> NavTabGroup[] (10 items, grouped) |
| akademik | keep period bar (via context=) | already header |
| ekstrakurikuler | keep period bar (via context=) | already header |
| perpustakaan | PerpustakaanContextBar -> ModuleContextBar | already header |

Nav grouping: wide modules (ppdb 9, situs 10, master 9) get logical groups so the
single header pill row reads cleanly and scrolls gracefully.

### Refactor note (existing 3)

akademik/ekstrakurikuler keep their bespoke period bar (data-bound TA/Semester
selectors) — those move into `ModuleShell` via the `context=` slot unchanged.
perpustakaan's role bar collapses into `ModuleContextBar`. aset's `AsetContextBar`
collapses into `ModuleContextBar`. Goal: one context-bar implementation for the
role/framing case; period bars stay specialized but route through `ModuleShell`.

## Risks

- **AppShell full-bleed parity**: `ModuleHeader` uses negative margins
  (`-mx-4 sm:-mx-6 lg:-mx-8`, `-mt-6 lg:-mt-8`) tuned to `<main>`'s `p-6 lg:p-8`.
  All `sch.*` routes must share that AppShell padding. VERIFY by running the app
  on a converted module before claiming done.
- **Concurrent situs work**: a sibling worktree (feat/cms-lowrisk-gaps) may edit
  situs files. Resolve at merge.
- **Existing 3 must stay visually identical** post-refactor — snapshot/manual check.
- **Wide nav rows** must scroll, not wrap (InlineNavPills already uses overflow-x-auto).

## Testing

- Unit: `ModuleContextBar` renders label/framing/role/cta and omits absent parts;
  `ModuleShell` omits context row when no context props; nav-group configs are
  non-empty and `to` paths are well-formed.
- Integration (RTL): a representative converted layout renders the sticky header,
  the correct active tab for a given pathname, and the outlet.
- Regression: `tsc` 0 errors, full `vitest` green, `pnpm build` ok.
- Manual: run app, open one converted module (e.g. /jadwal) + one period module
  (/akademik) — verify sticky header bleed + active tab + period selectors intact.

## Non-goals / YAGNI

- No new backend, no fixtures, no TA/Semester data wiring.
- No redesign of page bodies — only the module chrome + nav config.
- No conversion of single-page or koperasi routes.
