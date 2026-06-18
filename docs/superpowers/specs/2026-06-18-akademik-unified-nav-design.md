# Design — Akademik Unified Nav (one consistent menu across /akademik/**)

- **Date:** 2026-06-18
- **App:** `apps/school` (`@sekolahpro/app-school`)
- **Approach:** A — single module bar with per-module dropdowns, shown on every `/akademik/**` page.
- **Status:** Approved direction — pending spec review + plan.

## 1. Problem

Under `/sch/$sekolah/akademik/**` the top menu **changes per area** — 5 different navs:
- Workspace (`$ta` dashboard / penilaian / pendaftaran): `Ringkasan · Pengaturan · Penilaian` groups.
- Kelas (`$ta/kelas/**`): its own `Ringkasan · Kelas` groups.
- Jadwal (`$ta/jadwal/**`): its own groups.
- Ekskul (`$ta/ekskul/**`): its own groups.
- PPDB (`/akademik/ppdb/**`, **not** period-scoped): `Ringkasan · Pendaftaran · Proses · Kelola`.

Each sub-module layout renders its **own** `ModuleShell` + `NAV_GROUPS`; the `$ta` layout
deliberately bypasses its shell for sub-modules (`isSubmodulePath` → `<Outlet/>`), so the
menu is inconsistent as you move around akademik.

## 2. Goal / Non-goals

**Goal:** one **identical** akademik menu on every `/akademik/**` page — a module bar where
each module is a dropdown of its pages. Active module highlighted by current path.

**Non-goals (YAGNI):**
- No route/URL changes, no page-content changes, no backend changes.
- Not redesigning each page's body — only the shared nav (and the context row it shares).
- No new design-system primitive beyond the small dropdown this needs.

## 3. Verified existing state

- `ModuleHeader` (`components/ModuleHeader.tsx`) is a sticky panel with `context` + `nav`
  ReactNode slots → can host a custom nav. `ModuleShell` wraps it but hardcodes
  `nav={<GroupedNavTabs variant="header"/>}` (pills, no dropdown).
- `@sekolahpro/ui` exports **no** Menu/Dropdown/Popover → a small dropdown must be built.
- `$ta.tsx` (`AkademikWorkspaceLayout`): resolves TA from `$ta`, provides
  `AkademikContextProvider` (TA + semester), renders `ModuleShell` with
  `buildWorkspaceNavGroups()` — except `isSubmodulePath` (kelas/jadwal/ekskul/absensi) →
  bare `<Outlet/>` so the sub-module's own shell shows.
- Sub-module layouts (`$ta.kelas.tsx`, `$ta.jadwal.tsx`, `$ta.ekskul.tsx`, `$ta.absensi.tsx`)
  each render `ModuleShell` + their own `NAV_GROUPS` + a context strip
  (`StripTahun` / `AkademikContextBar`) + period providers
  (`KelasPeriodProvider`, etc.).
- `ppdb.tsx` (`/akademik/ppdb`, sibling of `$ta`, no period) renders `ModuleShell` + its
  own `NAV_GROUPS`.
- Akademik pages by module (from route files):
  - **Penilaian** (workspace): Input Nilai Test (`/asesmen`), Entri Nilai (`/entri-nilai`), Raport (`/raport`).
  - **Kelas**: Daftar Kelas (`/kelas/daftar`), Rombongan Belajar (`/kelas/rombel`), Anggota Rombel (`/kelas/anggota`), Kelas Saya (`/kelas/saya`, guru).
  - **Jadwal**: Papan (`/jadwal/papan`), Agenda (`/jadwal/agenda`), Daftar (`/jadwal/daftar`), Slot (`/jadwal/slot`), Override (`/jadwal/override`), Permintaan (`/jadwal/permintaan`), Persetujuan (`/jadwal/persetujuan`), Pantauan (`/jadwal/pantauan`).
  - **Ekskul**: Program (`/ekskul/program`), Pendaftaran (`/ekskul/pendaftaran`), Sesi (`/ekskul/sesi`), Raport (`/ekskul/raport`), Mitra (`/ekskul/mitra`).
  - **Absensi**: Harian (`/absensi/daftar`), Pelajaran (`/absensi/pelajaran`), Guru (`/absensi/guru`).
  - **PPDB** (no `$ta`): Pendaftaran (`/ppdb/daftar`), Calon Siswa (`/ppdb/calon-siswa`), Gelombang (`/ppdb/gelombang`), Seleksi (`/ppdb/seleksi`), Pembayaran (`/ppdb/pembayaran`), Daftar Ulang (`/ppdb/daftar-ulang`), Pengaturan (`/ppdb/pengaturan`).
  - **Dashboard**: workspace hub (`/akademik/$ta`).

## 4. Design

### 4.1 Module bar (the menu)
A single horizontal bar, identical on every `/akademik/**` page:

```
Dashboard | Penilaian ▾ | Kelas ▾ | Jadwal ▾ | Ekskul ▾ | Absensi ▾ | PPDB ▾
```

- **Dashboard** = direct link to `/akademik/$ta` (workspace hub).
- Each module = a **dropdown** opening that module's pages (§3 lists). One-page modules
  could be a direct link, but all multi-page → dropdown.
- **Active state:** the module whose section contains the current path is highlighted
  (e.g. on `/kelas/rombel` → "Kelas" active). Path → module via prefix match.

### 4.2 New components
- `components/akademik/AkademikNav.tsx` — renders the bar from a model; props
  `{ sekolah, ta, pathname }`. `$ta`-scoped items render `<Link to=".../$ta/..." params={{sekolah, ta}}>`;
  PPDB items render `<Link to=".../ppdb/..." params={{sekolah}}>` (no `ta`).
- `components/shell/NavDropdown.tsx` — minimal accessible dropdown: a trigger button
  (label + chevron, active styling) toggling a popover `<ul>` of `<Link>`s. Closes on
  outside-click, Escape, and route change (pathname prop change). `aria-expanded` /
  `aria-haspopup`, `role="menu"`. Keep it ~60 lines, no new dep.
- `lib/akademikNav.ts` — add `buildAkademikModules()` returning the model:
  `{ key, label, scoped: boolean, to?, items?: {to,label,exact?}[] }[]`, plus
  `activeModuleKey(pathname)`.

### 4.3 Where it renders (consistency mechanism)
The unified bar must appear ONCE per page (no double shells):

- **`$ta.tsx`**: always render `ModuleHeader` with `nav={<AkademikNav ta={...} pathname/>}`
  and `context={<AkademikContextBar taLabel/>}` for **all** `$ta` pages — remove the
  `isSubmodulePath → <Outlet/>` bypass. The workspace dashboard's intro/PageGuide/distribution
  stays only on the hub page (unchanged condition).
- **Sub-module layouts** (`$ta.kelas/jadwal/ekskul/absensi.tsx`): drop their `ModuleShell`
  + `NAV_GROUPS` + context strip. Keep ONLY their period/role providers wrapping `<Outlet/>`
  (e.g. `KelasPeriodProvider`). The shared bar + `AkademikContextBar` (from `$ta.tsx`) now
  cover them. Per-module role label / `StripTahun` is consolidated into the akademik context
  (acceptable; the menu+context become uniform — the point of this change).
- **`ppdb.tsx`**: render `ModuleHeader` with the same `AkademikNav`. PPDB is not period-scoped,
  so resolve a `ta` for the bar's `$ta`-scoped links from the stored periode
  (`readStoredPeriode(sekolah).ta`) or the active TA; if none, those links fall back to the
  hub (`/akademik` with `pick`). PPDB's own context (label/role) becomes the `context` row.

### 4.4 Context row
Keep it consistent too: `AkademikContextBar` (TA + semester) on `$ta` pages; PPDB shows a
PPDB-labelled context row (it has no TA/semester). The **menu** (the user's complaint) is
identical everywhere; the context row differs only where the data genuinely does (PPDB).

## 5. Error / edge handling
- Unknown `$ta` redirect (existing) unchanged.
- PPDB with no stored/active TA: `$ta`-scoped dropdown items link to `/akademik` (hub picker)
  rather than a broken `$ta`. Surfaced as the items still showing; clicking routes to the picker.
- Dropdown a11y: keyboard (Esc close, Enter/Space open), outside-click, close on navigation.

## 6. Testing
- `lib/akademikNav` unit: `activeModuleKey(pathname)` for each module + hub + ppdb; model shape.
- `AkademikNav` render: shows all module entries; active module highlighted for a kelas path,
  a ppdb path, the hub.
- `NavDropdown` render/interaction: trigger toggles list; Esc/outside-click closes; items are Links.
- Regression: existing akademik route/layout tests stay green; sub-module pages still render
  their content (now under the shared shell). `tsc` 0, `eslint` 0, full vitest green, build ok.
- Visual: the app is running on :5181 — but school has no auth stub, so verify via tests +
  (if a session is available) a manual/Playwright pass; otherwise rely on unit/render tests.

## 7. Files

**New:** `components/akademik/AkademikNav.tsx`, `components/shell/NavDropdown.tsx`,
`lib/akademikNav.ts` additions (+ tests).

**Modified:** `routes/sch.$sekolah.akademik.$ta.tsx` (always render unified nav),
`routes/sch.$sekolah.akademik.$ta.{kelas,jadwal,ekskul,absensi}.tsx` (strip own shell →
providers + Outlet), `routes/sch.$sekolah.akademik.ppdb.tsx` (use unified nav + TA resolve).
Possibly retire each module's `NAV_GROUPS` const + the `buildWorkspaceNavGroups`/`isSubmodulePath`
helpers (or repurpose into `buildAkademikModules`).

## 8. Open items for planning
1. Confirm `ModuleHeader` styling works with a dropdown-bearing nav (overflow/sticky vs popover
   z-index) — popover must escape the sticky header's clip; use a high z-index portal-free
   absolute popover, test overflow.
2. Per-module role labels (kelasRole/genericRole) lost from the strip — confirm acceptable or
   fold a single akademik role label into `AkademikContextBar`.
3. Jadwal has 8 pages — confirm which belong in the dropdown vs are deep/detail-only
   (keep the main operational ones; detail routes reachable from their list pages).
