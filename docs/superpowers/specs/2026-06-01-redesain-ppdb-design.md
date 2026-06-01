# Redesain Modul PPDB — Berbasis Peran, Tutorial per-Halaman, Visualisasi

**Date:** 2026-06-01
**Branch:** `feat/redesain-ppdb`
**Status:** Approved (brainstorming gate passed)
**Scope:** Full redesign of all PPDB surfaces in `apps/school`. Presentation +
guidance + visualization layer only — every data hook, doctype/field name,
whitelisted endpoint, and business rule is preserved verbatim. No backend change.

## Goal

Make the PPDB module effortless for **daily operators** and **managers**, and
fast to onboard for **new staff**. Maximize visualization. Mirror the already-
shipped akademik redesign pattern (role-aware framing + `PageGuide` tutorial +
in-house SVG viz) for cross-module consistency.

## Personas

| Persona | Frappe roles | Primary need |
|---------|--------------|--------------|
| Staff PPDB | operator, bendahara, admin_sekolah | Daily processing: "what needs my action now", few clicks, bulk actions |
| Manajer PPDB | kepala_sekolah | Oversight: funnel conversion, quota fill, revenue, trend, bottlenecks |
| New staff | any | Guided tutorial, next-action prompts, friendly empty states, jargon tooltips |

Roles **frame** the UI (labels, emphasis, default view) — they never **hide**
functionality. Access control stays on the backend. Permissive-by-design
fallback grants every role when the session is unavailable.

## Information Architecture

Keep the existing 9 tabs (no nav restructure — minimizes routing risk). Redesign
the content of each. The landing tab (`Beranda`) becomes role-adaptive with a
segmented toggle so anyone can switch view; the toggle defaults to the persona's
primary view.

## Foundation modules (built first, TDD)

### `lib/ppdbRole.ts` — mirror of `akademikRole.ts`
- Buckets: `staff | manajer`.
- `usePpdbRole(): PpdbRoleInfo { roles, primary, isStaff, isManajer }`.
- Pure, exported, unit-tested: `mapRoles`, `pickPrimary`, `normalizeRole`.
- Matchers: kepala_sekolah→manajer; operator/bendahara/admin_sekolah/super_admin→staff.
- Permissive fallback = both roles.

### `lib/ppdbAnalytics.ts` — pure aggregators over `Pendaftar[]` / row lists
- `funnelData(rows)` → `ChartDatum[]` counts per `PIPELINE_STAGES`.
- `statusDistribution(rows)` → `DistributionSegment[]`.
- `jalurDistribution(list)` → `ChartDatum[]`.
- `paymentSummary(list)` → `{ collected, outstanding, billed, pctCollected }`.
- `paymentStatusDistribution(list)` → `DistributionSegment[]` (Lunas/Cicilan/Tertunda).
- `dailyRegistrationTrend(rows, days)` → `number[]` buckets by `tanggal_daftar`.
- `scoreHistogram(list, binSize)` → `ChartDatum[]` over `skorTes`.
- `docCompleteness(p)` → `{ done, total, pct }`.
- `quotaInfo(total, kuota)` → `{ filled, sisa, pct }`.
- `paymentAging(list, todayIso, thresholdDays)` → overdue rows.
- All pure, deterministic, fully unit-tested incl. empty/zero/over-100 edges.

### `lib/ppdbQueue.ts` — staff work-queue derivation
- `buildWorkQueue(list, todayIso): WorkQueueGroup[]` with groups:
  - `dokumen` — dokumen `Belum`/`Ditolak` or tahapan Verifikasi Berjalan.
  - `seleksi` — status Tes/Seleksi/Lulus-pending with `skorTes` undefined.
  - `pembayaran` — any pembayaran `Tertunda`.
  - `daftar-ulang` — Lulus/Diterima not yet Daftar Ulang.
- Each group: `{ id, label, count, tone, actionHref, items }`. Pure + tested.

### `components/viz/advanced.tsx` — new SVG primitives (extends existing kit)
- `FunnelChart({ stages })` — tapering pipeline funnel, counts + %.
- `GaugeArc({ value, max, tone })` — semicircular capacity gauge for quota.
- `TrendArea({ points, labels, tone })` — labeled area line for daily trend.
- Pure SVG, dependency-free, SSR-safe, `role="img"` + aria summary, degrade on
  empty. Geometry helpers unit-tested; components smoke-tested. Re-export via
  `components/viz/index.ts`.

## Per-page redesign

1. **Beranda** (`ppdb.index.tsx`) — role-adaptive. `Ringkasan` (manajer default):
   KPI row + `FunnelChart` + `TrendArea` (daftar harian) + `DonutChart` jalur +
   `DistributionBar` pembayaran + `GaugeArc` kuota + `AttentionList`. `Antrian
   Kerja` (staff default): grouped action inbox from `buildWorkQueue` with counts,
   tones, deep links + `NextActionCard`. Segmented toggle. `PageGuide`.
2. **Buat PPDB** (`ppdb.buat.tsx`) — streamlined create wizard, inline validation,
   `PageGuide`, friendly empty/intro state.
3. **Pendaftaran** (`ppdb.daftar.tsx`) — enhanced table (NO Kanban): keep bulk
   Ajukan/Verifikasi, add doc-completeness mini-bar + payment dot columns,
   `DistributionBar` status strip on top, `PageGuide`.
4. **Calon Siswa** (`ppdb.calon-siswa.tsx`) — directory cards + biodata
   completeness `ProgressRing` + filters + `PageGuide`.
5. **Gelombang** (`ppdb.gelombang.tsx`) — per-batch `GaugeArc` quota + mini
   `FunnelChart` + timeline + `PageGuide`.
6. **Seleksi** (`ppdb.seleksi.tsx`) — rank table + score `BarChart` histogram +
   pass/fail `DonutChart` + bulk umumkan + `PageGuide`.
7. **Pembayaran** (`ppdb.pembayaran.tsx`) — collected/outstanding `GaugeArc` +
   status `DonutChart` + aging list + record-payment modal + `PageGuide`.
8. **Daftar Ulang** (`ppdb.daftar-ulang.tsx`) — per-student `WorkflowStepper` +
   confirmation queue + completion `DistributionBar` + `PageGuide`.
9. **Pengaturan** (`ppdb.pengaturan.tsx`) — sectioned settings + `OnboardingChecklist`
   setup + `PageGuide`.

## Onboarding system
- `PageGuide` on every page (per-halaman tutorial, persists collapsed state).
- `NextActionCard` ("Langkah berikutnya") computed from data state.
- Friendly empty states + jargon tooltips (`GlossaryTooltip`).

## Constraints
- TanStack Router file routes, TanStack Query, `@sekolahpro/ui`, Tailwind tokens.
- UI strings Bahasa Indonesia; code/comments English.
- vernon-dev: function ≤ 40 lines, file ≤ 300 lines, named constants, doc comment
  on every function, inline WHY on non-trivial blocks. No new npm dependency.
- **TDD**: every pure function + new chart + page behavior gets a failing test
  first. Mock `@sekolahpro/api-client` (`useResourceList`/`frappeFetch`) and
  `@sekolahpro/auth` (`useSession`) in component tests.

## Testing & verification
- `pnpm --filter @sekolahpro/app-school test` green (excluding 1 pre-existing
  unrelated akademik failure).
- `pnpm --filter @sekolahpro/app-school typecheck` clean.
- `pnpm --filter @sekolahpro/app-school lint` clean.
- UI verified via production build + dev smoke.
