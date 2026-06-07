# Keuangan "Alur Uang" Hub Redesign — Design Spec

**Date:** 2026-06-07
**Status:** Approved (tournament winner + grafts)
**Scope:** Navigation/menu IA + hub landing + subpage surfacing. List pages, forms, and the live-data layer stay untouched (zero URL migration).

---

## 1. Why

The accounting/finance module today is two roots — **Keuangan** (operasional: tagihan/pembayaran/pengeluaran/kas) and **Akuntansi** (ledger: buku besar/anggaran/pajak/referensi), grouped by *doctype*. A 6-tournament/3-judge-panel run (accountant 70% / onboarding 30% / IA-heuristics) selected a **workflow-first money-flow pipeline** as the IA that best serves the daily accountant while doubling as the onboarding story, then grafted the strongest mechanics from the runner-up "work-queue inbox", the "fiscal-deadline strip" from frequency-adaptive, and the "month-end close checklist" from accounting-native-power.

Tournament scores: workflow-first 72.7 (winner) · work-queue-inbox 71.7 · frequency-adaptive 66.1 · accounting-native-power 65.3 · progressive-tiers 48.4 · role-switchboard 45.5.

## 2. Design — "Alur Uang"

One Keuangan hub whose **menu is the money pipeline**: `Tagih → Terima → Catat → Tutup Buku → Lapor Pajak`, plus a collapsed `Siapkan` (setup) drawer. Every leaf route is one of the existing 40 routes — pure regrouping, no URL change. Roles drive **emphasis only**, never visibility (existing `keuanganRole.ts` contract).

### 2.1 Navigation IA (5 stages + setup drawer)

| Stage | Items → existing route |
|---|---|
| **Beranda** | Beranda → `/keuangan` · Cari & Lompat (⌘K) |
| **1. Tagih** | Tagihan SPP & Siswa → `/keuangan/tagihan` · Jurnal Penyesuaian → `/akuntansi/buku-besar/jurnal/new` |
| **2. Terima** | Terima Pembayaran → `/keuangan/pembayaran` · Payment Entry (GL) → `/akuntansi/buku-besar/pembayaran` · Setoran ke Buku Kas → `/keuangan/kas` |
| **3. Catat** | Pengeluaran & Persetujuan → `/keuangan/pengeluaran` · Jurnal Umum → `/akuntansi/buku-besar/jurnal` · Buku Besar (GL) → `/akuntansi/buku-besar/gl` · Bagan Akun → `/akuntansi/buku-besar/akun` |
| **4. Tutup Buku** | Tutup Bulan (checklist) → `/keuangan?close=1` · Realisasi vs Anggaran → `/akuntansi/anggaran` · Cost Center → `/akuntansi/anggaran/cost-center` · Tutup Periode → `/akuntansi/referensi/period` |
| **5. Lapor Pajak** | SPT Masa PPN → `/akuntansi/pajak/spt-ppn` · e-Faktur → `/akuntansi/pajak/efaktur` · Withholding → `/akuntansi/pajak/withholding` · PPh 21 TER → `/akuntansi/pajak/ter` |
| **Siapkan (drawer)** | Tahun Fiskal · Periode · Kurs · Pengaturan (NPWP/NSFP) · Bagan Akun → `/akuntansi/referensi/*` + `/akuntansi/buku-besar/akun` |

Pages with a natural second home (Buku Kas, Payment Entry) get ONE canonical primary stage; ⌘K is the canonical cross-reach. Setup-only pages live in the drawer, hidden from first-timers.

### 2.2 Hub landing (`/keuangan`) — work-first order

1. **Pekerjaan Hari Ini** — urgency-ranked work-queue ON TOP (above the marketing ribbon, fixing the density complaint). Dense single-line rows: `[urgency dot red/amber/emerald] · [type chip] · label · Rp (tabular-nums) · age/"3 hari telat" · inline action (Lihat/Terima/Setujui→deep-link)`. Role pre-filters the top (kasir→unpaid, bendahara→approvals, akuntan→tax/unposted) via existing `KeuanganRoleChips` emphasis → 0 clicks to your work on cold start. Empty-state closure + an "Inbox Zero" progress meter.
2. **Pipeline ribbon** — 5 stage cards, each one live KPI + a red/amber badge count of waiting items (reuses existing `stats.*` aggregations). Your role's stage is outlined/elevated; click → that stage's first page.
3. **Saat Ini Penting** — conditional deadline strip (pure `keuanganCalendar.ts` from today + due-date data), e.g. "Lapor PPN sebelum 15 Jun" + countdown + deep-link chips. Collapses to nothing when idle. Date-only fallback guaranteed.
4. **Existing viz band** — UNCHANGED charts (LineChart cash trend, GaugeChart collection, DonutChart expense, WaterfallChart, StackedBar, Top Tunggakan), re-homed under owning stage. `KeuanganRoleChips` + `KeuanganPageGuide` kept.
5. **Footer** — ⌘K pill + a row of quick-create Links (Tagihan Baru, Terima Bayar, Jurnal Baru, Pengeluaran) → existing `/new` routes (hub-local Links, NOT the koperasi `QuickActionGrid`).

### 2.3 Subpage surfacing (fastest first)
1. **⌘K palette** — extend `global-search.ts` with a finance route+action provider sourced from the hub groups + a curated verb table (buat jurnal, terima bayar, spt ppn, withholding, tutup bulan, cost center, e-faktur), each → route (+ optional `/new`). Reuses the existing ⌘K binding.
2. **Inline work-queue actions** — each queue row deep-links to its exact page.
3. **Task/stage LinkGrid** — shared `<LinkGrid>` (extracted from akuntansi index) lists sibling subpages on each stage screen.
4. **Persistent pipeline header + breadcrumb** — ModuleShell header shows the stages on every page for 1-click lateral hops.

## 3. Components & data

- **REGROUP** `src/lib/keuanganHub.ts`: replace 3 sections (`ringkasan/operasional/akuntansi`) with the 5 pipeline stages + `siapkan` drawer. `KeuanganSectionKey` + `KEUANGAN_HUB_GROUPS` change; every leaf `to` stays identical. Rewrite `resolveActiveSection()` + its test, and `KEUANGAN_NAV_GROUPS` mapping (drawer excluded from the header pill row, surfaced separately).
- **NEW** `src/lib/keuanganCalendar.ts` — pure, unit-tested fiscal-deadline computation from `today` + due/period data, with a date-only fallback (PPN-15th, PPh-monthly, month-end close). No React.
- **NEW** `src/lib/keuanganWorkQueue.ts` — pure selector turning existing live rows (`TagihanRow`, `PengeluaranRow`, draft `SptMasaPPN`) into ranked `WorkItem[]` (urgency, type, amount, age, deep-link target). No mutation. Unit-tested.
- **REBUILD** `src/routes/sch.$sekolah.keuangan.index.tsx` — work-queue + ribbon + deadline strip + re-homed charts; reuse existing StatCards/charts/GUIDE_STEPS.
- **EXTRACT** `src/components/keuangan/LinkGrid.tsx` from the file-private one in `sch.$sekolah.akuntansi.index.tsx`; both consume it.
- **EXTEND** `src/lib/global-search.ts` with the finance action provider (net-new function + tests; existing entity search untouched).
- **REDIRECT** `/akuntansi` index → `/keuangan` (the unified hub is the single landing); akuntansi deep pages keep rendering under their layout.
- **ADD** "Tutup Bulan" close panel rendered at `/keuangan?close=1` — read-only ordered checklist (reconcile kas → review unposted journals → review tagihan → SPT → Tutup Periode) linking each step to its leaf. No mutation.

## 4. Explicitly DEFERRED (out of v1 scope, documented not silently dropped)
- **Bulk multi-select mutations** (Setujui N / Posting N) — submitting financial documents needs balanced-only guard + amount-threshold confirm + undo window + audit trail (judges flagged these as BLOCKING). That is a net-new mutation surface that also violates "keep forms/data untouched". v1 deep-links each queue row to the existing form, where the current submit flow + its guards already live. Bulk mutation is a separate scoped follow-up.
- **Per-page `validateSearch` prefilter** — no keuangan list page reads URL search params today; v1 deep-links land on the list, queue/role context carried by the stage screen, not URL params.
- **QuickActionGrid keydown hotkeys / F-key scheme** — dropped (browser-collision + koperasi regression risk); ⌘K-typed verbs are the keyboard path.

## 5. Risks / invariants
- Ribbon/queue counts read the already-loaded live hooks (one fetch per hook, memoized) — no per-page re-fetch on navigation.
- `keuanganCalendar` MUST return a result via date-only fallback even when Period docs are misconfigured.
- Regrouping breaks `keuanganHub.test.ts` + `resolveActiveSection` assertions — rewrite in lockstep; verify the pill-row active state against every leaf route.
- No financial document is mutated by any new code in v1.

## 6. Success criteria
- Daily accountant reaches any of the 3 top tasks (receive payment, approve expense, post/file) from the hub in ≤ 1 click via the work-queue, or ≤ ~4 keystrokes via ⌘K.
- New user reads the 5-stage pipeline left-to-right and understands how school money moves, with plain-language hints at each scary noun.
- `tsc` 0 errors, `eslint` 0 errors, full vitest green (incl. rewritten hub/role tests + new calendar/work-queue/search tests), `build` ok.
