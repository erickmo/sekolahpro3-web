# Akademik TA Hub + Workspace — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.
> Execute SEQUENTIALLY in the worktree — route restructure shares one generated routeTree;
> parallel agents would conflict. Verify inline (tsc/lint/vitest/build), never fan-out builds.

**Goal:** Ubah modul Akademik dari feature-first (TA = dropdown filter) menjadi period-first:
hub daftar Tahun Ajaran (berjalan + arsip) → workspace per-TA dengan submenu datar,
TA jadi segmen path `/akademik/$ta/...`.

**Architecture:** Sisipkan route layer dinamis `$ta`. Halaman fitur lama turun satu level.
`akademik.tsx` jadi layout tipis; logika periode pindah ke `akademik.$ta.tsx` (workspace);
`akademik.index.tsx` baru = hub. Data scoping tak berubah (tetap via `useAkademikContext`).

**Tech Stack:** React, TanStack Router (file-based, `tsr generate`), @sekolahpro/{ui,api-client}, vitest.

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `src/lib/akademikNav.ts` | Create | Pure helpers `isPeriodeSelfManaged/showContextBar/showPeriodeIntro/buildTaSegments` + `taPath()` (encode TA → path) + `WORKSPACE_SUBPATHS`. Decouple from route file churn. |
| `src/routes/sch.$sekolah.akademik.tsx` | Rewrite | Thin layout: `<Outlet/>` only. `createFileRoute("/sch/$sekolah/akademik")`. |
| `src/routes/sch.$sekolah.akademik.index.tsx` | Replace | HUB page (new component) — daftar TA berjalan + arsip + auto-redirect. |
| `src/routes/sch.$sekolah.akademik.$ta.tsx` | Create | WORKSPACE layout — port of old `akademik.tsx` logic, TA from `$ta` param. |
| `src/routes/sch.$sekolah.akademik.$ta.index.tsx` | Move (from `akademik.index.tsx` dashboard) | Dashboard. |
| `src/routes/sch.$sekolah.akademik.$ta.asesmen.index.tsx` | Move | Input Nilai Test. |
| `src/routes/sch.$sekolah.akademik.$ta.asesmen.$id.tsx` | Move | Detail asesmen. |
| `src/routes/sch.$sekolah.akademik.$ta.entri-nilai.tsx` | Move | Entri Nilai. |
| `src/routes/sch.$sekolah.akademik.$ta.entri-nilai.edit.tsx` | Move | Editor grid (ta dari path). |
| `src/routes/sch.$sekolah.akademik.$ta.raport.tsx` | Move | Raport. |
| `src/routes/sch.$sekolah.akademik.$ta.raport.$id.tsx` | Move | Detail raport. |
| `src/components/akademik/AkademikContextBar.tsx` | Modify | Buang dropdown TA; sisakan status/role/semester + label TA. |
| `src/components/akademik/AkademikBreadcrumb.tsx` | Create | `Akademik › {nama TA} › {submenu}`; "Akademik" → hub. |
| `src/routes/__tests__/akademik-layout.test.ts` | Modify | Import helpers dari `lib/akademikNav` (bukan route file). |
| `src/components/akademik/AkademikContextBar.test.tsx` | Modify | Sesuaikan: tak ada dropdown TA lagi. |
| `src/routes/__tests__/akademik-hub.test.ts` | Create | Hub: pilih berjalan/arsip, auto-redirect, empty, `?pick`. |
| `src/components/akademik/AkademikBreadcrumb.test.tsx` | Create | Label + link hub. |

---

## Task 1: Extract nav helpers to lib (decouple from route churn)

**Files:** Create `src/lib/akademikNav.ts`; Modify `src/routes/__tests__/akademik-layout.test.ts`.

- [ ] Move `isPeriodeSelfManaged`, `showContextBar`, `showPeriodeIntro`, `buildTaSegments`,
      `PERIODE_SELF_MANAGED`, `PERIODE_INTRO_PREFIXES`, `TaStatusRow`/`DistributionSegment`
      out of `akademik.tsx` into `akademikNav.ts`. Add `taPath(name)` =
      `encodeURIComponent(name)` and `WORKSPACE_SUBPATHS = ["asesmen","entri-nilai","raport"]`.
- [ ] Repoint test import: `from "../../lib/akademikNav"`. Keep all existing assertions.
- [ ] Run: `pnpm test -- akademik-layout` → expect PASS (logic unchanged).
- [ ] Commit: `refactor(akademik): extract nav/visibility helpers to lib/akademikNav`.

## Task 2: Move feature routes under `$ta` (mechanical)

**Files:** git mv 7 route files; update each `createFileRoute(...)` string + internal
`to`/`params`/`from`/`useParams` to include `$ta`.

- [ ] `git mv` dashboard `akademik.index.tsx` → `akademik.$ta.index.tsx` FIRST (frees `index`).
- [ ] `git mv` the other 6: `asesmen.index`, `asesmen.$id`, `entri-nilai`, `entri-nilai.edit`,
      `raport`, `raport.$id` → `$ta.` variants.
- [ ] In each moved file: update `createFileRoute("/sch/$sekolah/akademik/$ta/...")`.
- [ ] Update internal `useParams({from:"/sch/$sekolah/akademik/$ta/..."})` where a moved file
      reads its own route, and any `useParams({from:"/sch/$sekolah"})` that now also needs `ta`.
- [ ] `asesmen.index` + `raport`: detail links `to:".../$id"` → add `$ta` to `params`
      (`{ sekolah, ta, id }`), pull `ta` from params.
- [ ] `entri-nilai.edit`: read `ta` from `$ta` path param (was `search.ta`); drop `ta` from
      its search schema if now redundant (keep `rombel/mapel/semester`).
- [ ] `entri-nilai`: "Buka editor" link → include `$ta` param.
- [ ] Run: `pnpm exec tsr generate` to regenerate routeTree, then `pnpm typecheck`.
      Expect: route path errors surface here — fix until 0.
- [ ] Commit: `refactor(akademik): nest feature routes under $ta path segment`.

## Task 3: Workspace layout `akademik.$ta.tsx`

**Files:** Create `src/routes/sch.$sekolah.akademik.$ta.tsx`; rewrite `akademik.tsx` thin.

- [ ] Port `AkademikLayout` logic from old `akademik.tsx` into `$ta.tsx`:
      `useParams` `$ta`, fetch taList, `taRow = taList.find(name === decodeURIComponent($ta))`;
      if loaded & not found → `navigate` to hub (`/sch/$sekolah/akademik`).
- [ ] Context value: `tahunAjaran = decoded $ta`, semester from `?semester=` (computeSemester+
      storage), `isPastPeriod`, `noActiveTa`, `dirty`. `setTahunAjaran(v)` → navigate to
      `/sch/$sekolah/akademik/$ta` with `params.ta = taPath(v)` keeping current subpath.
      `setSemester` → set `?semester=`.
- [ ] Render `ModuleShell navGroups={NAV_GROUPS}` (NAV_GROUPS `to` now `.../$ta/...`),
      `context={<AkademikContextBar/>}` (showBar), breadcrumb above Outlet, period intro
      (showPeriodeIntro) as today. Persist `{ta,semester}` to storage (skip in edit).
- [ ] Rewrite `akademik.tsx` → `createFileRoute("/sch/$sekolah/akademik")({ component:()=> <Outlet/> })`.
- [ ] Run: `pnpm exec tsr generate && pnpm typecheck` → 0.
- [ ] Commit: `feat(akademik): workspace layout per Tahun Ajaran ($ta)`.

## Task 4: NAV_GROUPS + param reuse verification

**Files:** Modify `akademik.$ta.tsx` NAV_GROUPS (the source moved with workspace).

- [ ] NAV_GROUPS `to`: `/sch/$sekolah/akademik/$ta` (Dashboard, exact),
      `/sch/$sekolah/akademik/$ta/asesmen|entri-nilai|raport`.
- [ ] Verify GroupedNavTabs `<Link to>` inherits `$ta` (as it does `$sekolah`). If tsc/render
      fails, add optional `params` passthrough to GroupedNavTabs (`NavTabItem.params?`).
- [ ] Run: `pnpm typecheck` 0; `pnpm build` (smoke nav active-state).
- [ ] Commit: `feat(akademik): sub-nav links carry $ta param`.

## Task 5: Simplify AkademikContextBar

**Files:** Modify `AkademikContextBar.tsx` + its test.

- [ ] Remove `SearchableSelect` TA, `loadTA`, guarded TA switch. Keep status badge, role badge,
      semester `SearchableSelect` (still guarded by `dirty`), banner. Add read-only TA label.
- [ ] Update `AkademikContextBar.test.tsx`: assert semester present, no TA dropdown.
- [ ] Run: `pnpm test -- AkademikContextBar` PASS; `pnpm typecheck` 0.
- [ ] Commit: `refactor(akademik): context bar drops TA dropdown (switch via hub)`.

## Task 6: Breadcrumb component

**Files:** Create `AkademikBreadcrumb.tsx` + test; wire into `$ta.tsx`.

- [ ] `AkademikBreadcrumb({ taLabel, subLabel })`: `Akademik › {taLabel} › {subLabel}`,
      "Akademik" = `<Link to="/sch/$sekolah/akademik" search={{pick:1}}>`. Derive subLabel from
      pathname via NAV map.
- [ ] Test: renders 3 crumbs; hub link has `pick`.
- [ ] Run: `pnpm test -- AkademikBreadcrumb` PASS.
- [ ] Commit: `feat(akademik): breadcrumb Akademik › TA › submenu`.

## Task 7: Hub page `akademik.index.tsx`

**Files:** Replace `src/routes/sch.$sekolah.akademik.index.tsx` (new hub).

- [ ] Component: fetch TA (name, nama, is_current, status, tanggal_*). Split berjalan
      (`is_current`) vs arsip. `validateSearch`: `{ pick?: 1 }`.
- [ ] Section "Tahun Ajaran Berjalan": card(s) → `Buka →` Link to `/sch/$sekolah/akademik/$ta`
      `params.ta = taPath(name)`. Fallback: TA terbaru bila tak ada is_current.
- [ ] Section "Arsip" (collapsible, default closed): list non-current → Link workspace.
- [ ] Auto-redirect `useEffect`: if `!search.pick` && stored TA valid in taList →
      `navigate(replace)` to `/sch/$sekolah/akademik/$ta`. Anti-loop via `pick`.
- [ ] Empty state (0 TA) + PageGuide "Mulai dari pilih Tahun Ajaran".
- [ ] Run: `pnpm exec tsr generate && pnpm typecheck` 0.
- [ ] Commit: `feat(akademik): TA hub page (berjalan + arsip + auto-redirect)`.

## Task 8: Hub tests

**Files:** Create `src/routes/__tests__/akademik-hub.test.ts`.

- [ ] Extract hub pure logic to testable fns in `akademikNav.ts` if needed
      (`splitTaList(taList) → {berjalan, arsip}`, `pickAutoRedirectTa(stored, taList)`).
- [ ] Tests: split berjalan/arsip; auto-redirect picks stored valid TA, null when invalid/absent;
      fallback newest when no is_current.
- [ ] Run: `pnpm test -- akademik-hub` PASS.
- [ ] Commit: `test(akademik): hub split + auto-redirect selection`.

## Task 9: Full regression + docs

- [ ] `pnpm exec tsr generate && pnpm typecheck` → 0.
- [ ] `pnpm lint` → 0.
- [ ] `pnpm test` (full) → green (route tests asesmen-tenant/entri-nilai-averages/raport-actions
      may import moved paths — update imports if they reference route files).
- [ ] `pnpm build` → ok.
- [ ] Update `docs/implementation-tracker.md` (akademik IA entry) + akademik domain README if nav documented.
- [ ] Commit: `docs(akademik): tracker + domain nav reflect TA hub`.

---

## Self-Review notes

- Spec §Architecture → Tasks 2–4 (route layer). §Hub → Tasks 7–8. §Workspace → Task 3.
  §Context bar → Task 5. §Breadcrumb → Task 6. §Edge cases (encode, invalid param, arsip
  banner, 0 TA) → Tasks 2/3/7. §Testing → Tasks 1,5,6,8,9.
- Param names consistent: path param `ta` everywhere (`taPath()` encodes, `decodeURIComponent`
  decodes). `setTahunAjaran` takes raw TA `name`, encodes via `taPath`.
- Risk flagged in Task 4: GroupedNavTabs param inheritance — fallback documented.
