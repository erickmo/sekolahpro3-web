# Keuangan "Alur Uang" Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) tracking. TDD: red → green → refactor → commit.

**Goal:** Reshape the accounting/finance menu into a money-flow pipeline hub ("Alur Uang") with a work-queue cockpit, fiscal-deadline strip, ⌘K finance actions, and a month-end close checklist — IA + landing + surfacing only, zero URL migration, no financial-doc mutation.

**Architecture:** Pure-logic libs (`keuanganHub` regroup, `keuanganCalendar`, `keuanganWorkQueue`, finance search provider) are TDD'd in isolation, then composed by a rebuilt hub landing route. Existing list pages, forms, and the live-data layer are untouched. Roles = emphasis only.

**Tech Stack:** React + TanStack Router (flat file routes), TypeScript (exactOptionalPropertyTypes on), Vitest + RTL, @sekolahpro/ui, vernon_accounting live hooks.

**Working dir:** `apps/school` inside worktree `.worktrees/keuangan-alur-uang` (branch `feat/keuangan-alur-uang-hub`).
**Verify (inline, sequential — never parallel builds):** `pnpm --filter @sekolahpro/school test`, `pnpm --filter @sekolahpro/school typecheck`, `pnpm --filter @sekolahpro/school lint`, `pnpm --filter @sekolahpro/school build`.

---

### Task 1: Regroup hub IA → 5 pipeline stages + Siapkan drawer

**Files:**
- Modify: `src/lib/keuanganHub.ts`
- Modify: `src/lib/keuanganHub.test.ts`

- [ ] **Step 1 — Rewrite the test** to assert the new structure: `KeuanganSectionKey` union = `"beranda" | "tagih" | "terima" | "catat" | "tutup-buku" | "lapor-pajak" | "siapkan"`; `KEUANGAN_HUB_GROUPS` keys in that order; `tagih` first item label `"Tagihan SPP & Siswa"`; `lapor-pajak` contains `"SPT Masa PPN"`; every leaf `to` still matches `/^\/sch\/\$sekolah\//` and is one of the existing routes; `resolveActiveSection` maps `/keuangan/tagihan`→`tagih`, `/keuangan/pembayaran`→`terima`, `/keuangan/pengeluaran`→`catat`, `/keuangan/kas`→`terima`, `/akuntansi/buku-besar/jurnal/new`→`catat`, `/akuntansi/pajak/spt-ppn`→`lapor-pajak`, `/akuntansi/anggaran`→`tutup-buku`, `/akuntansi/referensi/fiscal-year`→`siapkan`, bare `/keuangan`→`beranda`, unrelated→null; `isItemEmphasized` unchanged contract.
- [ ] **Step 2 — Run test, expect FAIL.** `pnpm --filter @sekolahpro/school test -- keuanganHub`
- [ ] **Step 3 — Implement:** replace `KeuanganSectionKey` + `KEUANGAN_HUB_GROUPS` with the 5 stages + `siapkan`. Add a `ROUTE_SECTION` map (longest-prefix → section) so `resolveActiveSection` is a deterministic table lookup, not regex (a route can appear in 2 stages visually but resolves to ONE canonical section for active-state). Keep `KeuanganNavItem`/`isItemEmphasized` as-is. `KEUANGAN_NAV_GROUPS` maps only the 5 stage groups (exclude `siapkan`) for the header pill row; export `KEUANGAN_SETUP_GROUP` separately for the drawer.
- [ ] **Step 4 — Run test, expect PASS.**
- [ ] **Step 5 — Commit:** `feat(keuangan): IA pipeline 5 tahap + drawer Siapkan`

### Task 2: `keuanganCalendar.ts` — fiscal deadline strip (pure)

**Files:**
- Create: `src/lib/keuanganCalendar.ts`
- Create: `src/lib/keuanganCalendar.test.ts`

- [ ] **Step 1 — Write failing test.** `computeDeadlines(today, ctx)` returns `Deadline[]` (`{ id, title, dueDate, daysLeft, severity, to }`) sorted by `daysLeft`. Cases: given `today="2026-06-10"` and default rules → includes a PPN deadline `2026-06-15` with `daysLeft=5` severity `"amber"`; PPh-21 monthly deadline; a month-end "Tutup Buku" item. `daysLeft<=3`→`"red"`, `<=7`→`"amber"`, else `"emerald"`. With overdue (`dueDate<today`) → negative daysLeft, severity `"red"`, title prefixed. **Date-only fallback:** with `ctx` empty/misconfigured it STILL returns the statutory PPN/PPh/month-end deadlines (never empty in a month that has them). Pure (no `new Date()` inside — `today` passed in).
- [ ] **Step 2 — Run, expect FAIL.**
- [ ] **Step 3 — Implement** the statutory rules table (PPN masa = 15th next-or-this month, PPh setor = 10th, lapor = 20th, month-end close = last day) + optional `ctx.dueDates` merge, severity bucketing, sort. Doc-comment each rule with its WHY.
- [ ] **Step 4 — Run, expect PASS.**
- [ ] **Step 5 — Commit:** `feat(keuangan): lib keuanganCalendar deadline pajak + tutup buku`

### Task 3: `keuanganWorkQueue.ts` — ranked actionable queue (pure)

**Files:**
- Create: `src/lib/keuanganWorkQueue.ts`
- Create: `src/lib/keuanganWorkQueue.test.ts`

- [ ] **Step 1 — Write failing test.** `buildWorkQueue({ tagihan, pengeluaran, sptDraftCount, today, role? })` → `WorkItem[]` where `WorkItem = { id, type: "tagihan"|"belanja"|"pajak", label, amount, ageDays, dueLabel, severity, to }`. Asserts: overdue `TagihanRow` (status !== "Lunas"/"Dibatalkan", jatuhTempo < today) become `type:"tagihan"` items with `severity:"red"`, deep-link `to:"/keuangan/tagihan"`; `PengeluaranRow` with status awaiting approval (`"Menunggu"`/`"Diajukan"`) become `type:"belanja"` `to:"/keuangan/pengeluaran"`; `sptDraftCount>0` adds one `type:"pajak"` aggregate item; sorting = severity (red>amber>emerald) then amount desc; `role` only reorders (role-relevant type floats to top), never filters out. Empty inputs → `[]`. `inboxProgress(items, doneIds)` → `{ done, total }`.
- [ ] **Step 2 — Run, expect FAIL.**
- [ ] **Step 3 — Implement** the pure selector over the existing row shapes from `data/keuangan`. No mutation, no fetch.
- [ ] **Step 4 — Run, expect PASS.**
- [ ] **Step 5 — Commit:** `feat(keuangan): lib keuanganWorkQueue antrean kerja terurut`

### Task 4: Finance action provider for ⌘K

**Files:**
- Modify: `src/lib/global-search.ts`
- Create/Modify: `src/lib/global-search.test.ts`

- [ ] **Step 1 — Write failing test** for new `financeActions(query)` → `SearchHit[]` (category `"Keuangan"`): query `"with"` returns a hit with `href` ending `/akuntansi/pajak/withholding`; `"jurnal baru"` → `/akuntansi/buku-besar/jurnal/new`; `"tutup"` → `/keuangan?close=1`; below `MIN_QUERY_LENGTH` → `[]`. Existing `globalSearch` entity behavior unchanged (smoke assert one siswa case still works). Extend `SearchCategory` union with `"Keuangan"` and `groupHitsByCategory` order to include it first.
- [ ] **Step 2 — Run, expect FAIL.**
- [ ] **Step 3 — Implement** a static `FINANCE_ACTIONS` table (label + synonyms + href) fed from the hub leaf routes + verbs; fuzzy `includes` match on label/synonyms/href. Add `"Keuangan"` to the category union + ordering.
- [ ] **Step 4 — Run, expect PASS.**
- [ ] **Step 5 — Commit:** `feat(keuangan): provider aksi Keuangan untuk Cari (⌘K)`

### Task 5: Extract shared `<LinkGrid>`

**Files:**
- Create: `src/components/keuangan/LinkGrid.tsx` (+ export in `src/components/keuangan/index.ts`)
- Modify: `src/routes/sch.$sekolah.akuntansi.index.tsx` (import shared, delete local copy + local `QuickLink` if now shared)
- Create: `src/components/keuangan/__tests__/LinkGrid.test.tsx`

- [ ] **Step 1 — Test:** renders one anchor per item with label + hint; href built via `scopedLinkProps`. (RTL, wrap in router stub as existing component tests do; `afterEach(cleanup)`.)
- [ ] **Step 2 — Run, expect FAIL.**
- [ ] **Step 3 — Move** the `LinkGrid` + `QuickLink` interface verbatim into the shared file; re-import in akuntansi index. No behavior change.
- [ ] **Step 4 — Run test + akuntansi-index render still green.**
- [ ] **Step 5 — Commit:** `refactor(keuangan): ekstrak LinkGrid ke komponen bersama`

### Task 6: Rebuild hub landing — work-queue + ribbon + deadline strip

**Files:**
- Modify: `src/routes/sch.$sekolah.keuangan.index.tsx`
- Create: `src/components/keuangan/WorkQueueCard.tsx`, `PipelineRibbon.tsx`, `DeadlineStrip.tsx`, `QuickCreateRow.tsx` (+ barrel exports)
- Create: `src/components/keuangan/__tests__/WorkQueueCard.test.tsx`

- [ ] **Step 1 — Test WorkQueueCard:** given `items` renders one row each with label, formatted Rp, severity dot, and a deep-link action; empty `items` → renders the "Kotak masuk bersih" closure + 0/0 meter; role-pre-filter reorders. (RTL.)
- [ ] **Step 2 — Run, expect FAIL.**
- [ ] **Step 3 — Implement** the four presentational components (pure props), then recompose `KeuanganDashboard`: ROW1 `WorkQueueCard` (fed by `buildWorkQueue` over existing `useTagihanLive/usePengeluaranLive` + akuntansi `sptDraft`), ROW2 `PipelineRibbon` (5 stage cards w/ existing `stats.*` + waiting counts, role stage elevated), ROW3 `DeadlineStrip` (from `computeDeadlines`, collapses when empty), ROW4 existing charts re-homed, footer `QuickCreateRow` (Links to `/new`). Keep `KeuanganRoleChips` + `KeuanganPageGuide`. Update `GUIDE_STEPS` copy to the pipeline mental model.
- [ ] **Step 4 — Run test + typecheck.**
- [ ] **Step 5 — Commit:** `feat(keuangan): hub Alur Uang — antrean kerja, ribbon pipeline, strip tenggat`

### Task 7: Akuntansi index redirect + sub-nav reconcile

**Files:**
- Modify: `src/routes/sch.$sekolah.akuntansi.index.tsx` (redirect to `/keuangan` via route `beforeLoad`) — OR keep as a stage screen. Decision: **redirect** (single hub landing).
- Modify: `src/routes/sch.$sekolah.akuntansi.tsx` (SUBTABS already covered by pipeline header — keep akuntansi SUBTABS as in-tree secondary nav; no change required, verify no double-active-state).

- [ ] **Step 1 — Implement** `beforeLoad` on the akuntansi index route → `throw redirect({ to: "/sch/$sekolah/keuangan", params })`. Keep the old `AkuntansiOverview` component exported but unreferenced? No — delete dead component, move its LinkGrid usage is already shared. Keep deep akuntansi routes intact.
- [ ] **Step 2 — Verify** navigating to `/akuntansi` lands on `/keuangan`; deep akuntansi pages still render under `AkuntansiLayout`.
- [ ] **Step 3 — Commit:** `feat(keuangan): /akuntansi mendarat di hub Alur Uang terpadu`

### Task 8: "Tutup Bulan" close checklist (read-only)

**Files:**
- Create: `src/components/keuangan/TutupBulanPanel.tsx` + test
- Modify: `src/routes/sch.$sekolah.keuangan.index.tsx` (render panel when `search.close === 1`; add `validateSearch` for `close`)

- [ ] **Step 1 — Test:** panel renders the ordered checklist steps (Rekonsiliasi Kas → Tinjau Jurnal Belum Posting → Tinjau Tagihan → SPT Masa PPN → Tutup Periode), each with a deep-link and a derived status chip from counts passed as props. No mutation.
- [ ] **Step 2 — Run, expect FAIL.**
- [ ] **Step 3 — Implement** the panel; wire `validateSearch: (s) => ({ close: s.close === 1 || s.close === "1" ? 1 : undefined })` on the keuangan index route; when `close` set, render the panel above/instead of the dashboard body.
- [ ] **Step 4 — Run test + typecheck.**
- [ ] **Step 5 — Commit:** `feat(keuangan): panel Tutup Bulan (checklist tutup periode)`

### Task 9: Full verify + docs + finish

- [ ] `pnpm --filter @sekolahpro/school typecheck` → 0 (generate routeTree first: `pnpm --filter @sekolahpro/school generate` if needed)
- [ ] `pnpm --filter @sekolahpro/school lint` → 0
- [ ] `pnpm --filter @sekolahpro/school test` → all green
- [ ] `pnpm --filter @sekolahpro/school build` → ok
- [ ] Update `docs/` domain note if IA documented there; update this plan's checkboxes.
- [ ] Merge `feat/keuangan-alur-uang-hub` → main via PR (memory: direct push to main blocked).

---

## Self-review
- **Spec coverage:** IA regroup (T1), deadline strip (T2), work-queue (T3+T6), ⌘K (T4), LinkGrid (T5), hub rebuild (T6), unified landing (T7), close checklist (T8). All §3 components mapped. Deferred items (§4) intentionally absent.
- **Type consistency:** `KeuanganSectionKey` new union used identically in T1 test + impl; `WorkItem`/`Deadline` shapes defined once (T2/T3) and consumed in T6.
- **No mutation invariant:** T3/T6/T8 are read + deep-link only — honored.
