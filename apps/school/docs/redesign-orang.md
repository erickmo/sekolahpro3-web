# Redesign: Modul "Orang" (Siswa & Staff)

Foundation phase — pure-logic layer for the role-based redesign of the Siswa
(students) and Staff/Kepegawaian (employees) modules. This document records the
information architecture (IA) decisions, the visualization inventory per
dashboard, the onboarding aids, and the field-name caveats discovered while
reading the existing code.

## Stakeholders & their primary needs

| Stakeholder | Primary need | Dashboard signal |
|---|---|---|
| TU / Operator | Bulk data, mutasi, Dapodik, berkas | A clear "Perlu Tindakan" (action queue) |
| Kepala Sekolah | Oversight | High-level demographics, KPIs, trends |
| Wali Kelas / Guru | Their rombel & students | Quick access to Daftar Siswa, Anggota Rombel |
| Bendahara | Billing context for students | Status & headcount context (no fabricated SPP data) |
| HR / Kepegawaian | Staff records, SK, sertifikasi, berkas | Role mix, status kepegawaian, sertifikasi coverage |

Two over-arching goals drive every decision: (1) the modules must be **easy to
use and easy to onboard** a new staff member onto, and (2) they should carry **as
much tasteful data-visualization as the real data supports** — never fabricated
stub metrics.

## Information-architecture decisions

Both modules use the existing `GroupedNavTabs` sub-navigation. Routes are grouped
by *task intent*, not by doctype, so an operator can find an action where they'd
mentally look for it. `lib/orang/nav.ts` is the single source of these groups.

- **Siswa:** Ringkasan -> Data Pokok -> Penerimaan -> Kelulusan & Keluar ->
  Administrasi. The dashboard (`/sch/$sekolah/siswa`) is the exact-match entry.
- **Staff:** Ringkasan -> Data Pokok -> Penugasan Mengajar -> Kepegawaian. The
  dashboard (`/sch/$sekolah/staff`) is the exact-match entry.

Every `to` in `nav.ts` was verified against an existing route file under
`src/routes/` at authoring time. No new routes are introduced; the redesign only
reorganizes navigation into existing screens.

## Architecture (testability)

Number-crunching lives in pure, hook-free modules under `lib/orang/` so it can be
unit-tested without mocking API hooks:

- `siswaStats.ts` — `computeSiswaStats`, `genderSegments`, `statusDonut`,
  `deriveActionQueue` over `SiswaRow[]`.
- `staffStats.ts` — `roleDonut`, `statusKepegawaianBars`, `sertifikasiCoverage`,
  `aktifCount`, `genderSegments`, `deriveStaffActionQueue` over `PegawaiApi[]`.
- `glossary.ts` — `ORANG_GLOSSARY` + `glossaryFor` (Indonesian jargon).
- `nav.ts` — `SISWA_NAV_GROUPS`, `STAFF_NAV_GROUPS`.

Dashboards will split into `Page()` (does hooks + aggregation) and a pure
`XDashboardView` (props only) so the view can be rendered in RTL tests with mock
aggregated data.

## Visualization inventory

### Siswa dashboard
- **StatCard:** total siswa, siswa aktif (from `computeSiswaStats`).
- **DonutChart (status):** `statusDonut` — Aktif=emerald, Calon=sky,
  Alumni=violet, Pindah Keluar=amber, DO=rose, unknown=neutral.
- **DistributionBar (gender):** `genderSegments` — Laki-laki=brand,
  Perempuan=rose, unknown=neutral.
- **BarChart (jenjang / agama):** `computeSiswaStats().byJenjang` / `.byAgama`.
- **AttentionList:** `deriveActionQueue` — Calon awaiting activation, Pindah
  Keluar awaiting finalisation. Emitted only when the underlying count > 0.

### Staff dashboard
- **StatCard:** total pegawai, pegawai aktif (`aktifCount`), sertifikasi pct
  (`sertifikasiCoverage`).
- **DonutChart (role):** `roleDonut` — Guru=brand, Staff=violet, Dual-role=amber
  (dual-role counted once, never double-counted).
- **BarChart (status kepegawaian):** `statusKepegawaianBars` — unknown grouped
  under "Lainnya".
- **DistributionBar (gender):** `genderSegments` — same tone scheme as siswa.
- **ProgressRing (sertifikasi):** `sertifikasiCoverage().pct`.
- **AttentionList:** `deriveStaffActionQueue` — non-aktif pegawai, guru belum
  sertifikasi. Emitted only when count > 0.

## Onboarding aids

- `GettingStartedCard` / `EmptyState` for empty sections.
- `OnboardingChecklist` for first-run setup.
- `ModuleFlow` to guide multi-step processes (mutasi, kelulusan).
- `GlossaryTooltip` fed by `ORANG_GLOSSARY` to explain NISN, Dapodik, Rombel,
  Mutasi, JJM, SK Mengajar/Jabatan, GTY/PPPK/PNS/Honorer, Sertifikasi, etc.

## Field-name caveats (confirmed by reading source)

- **Siswa** (from `src/routes/sch.$sekolah.siswa.daftar.tsx`): the list requests
  `name, nama_lengkap, nis, nisn, jenjang, tahun_masuk, jenis_kelamin, agama,
  status` (and `tanggal_lahir` for export). `SiswaRow` only exposes the fields the
  aggregation actually consumes. Status domain: `Calon, Aktif, Alumni,
  Pindah Keluar, DO`. Gender domain: `Laki-laki, Perempuan`.
- **Pegawai** (from `src/features/pegawai/roles.ts`): typed `PegawaiApi` declares
  `status_kepegawaian, jenis_kelamin, is_aktif (0|1), sudah_sertifikasi (0|1)`,
  plus role helpers `apiIsGuru / apiIsStaff / apiIsDualRole`. Role values are
  `Pegawai Guru` / `Pegawai Staff`.
- **Defensive aggregation:** every field is optional. Missing/blank values bucket
  to `Tidak diketahui` (siswa dimensions) or `Lainnya` (status kepegawaian).
  Empty input returns zeroed results; nothing throws.
- **No fabricated metrics:** action queues are derived strictly from counts that
  exist in the data (e.g. number of Calon students). No stub figures such as
  "8% nunggak SPP" are invented.
- **Sertifikasi scope:** coverage is computed over the *guru* population only
  (incl. dual-role), because sertifikasi pendidik applies to teachers; including
  pure staff would distort the percentage. Division guards against an empty guru
  set (pct = 0, no divide-by-zero).
- **viz types live in `charts.tsx`** (not `charts.ts`): `Tone`, `ChartDatum`
  (tone optional), `DistributionSegment` (tone REQUIRED).
- **`AttentionItem` (from `@sekolahpro/ui`)** is
  `{ id, label, description?, tone?, badge?, href?, actionLabel?, actionHref?,
  onAction?, meta? }` and its `AttentionTone` is only
  `danger | warning | info | neutral` (NO `brand`/`success`). The action queues
  therefore use `label`/`description`/`actionLabel`, store the integer count in
  the string `badge` field, and use tones `info`/`warning`.
