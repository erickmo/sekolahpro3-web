# Kelas Module Redesign — Tournament Plan (POV: Tata Usaha)

> Design-tournament output. **Proposal only — NOT implemented.** Human approves before `implement plan`.
> Date: 2026-06-07 · Feature: Kelas module (full redesign) · POV/Judge: **Tata Usaha (Admin TU)**
> Sibling plans: `2026-06-07-kelas-tournament-guru.md`, `2026-06-07-kelas-tournament-kepsek.md`,
> reconcile: `2026-06-07-kelas-tournament-reconcile.md` (read the reconcile FIRST — all three slice ONE module).

## POV brief (job-to-be-done)

TU owns class **STRUCTURE**. Each new tahun ajaran: create N rombel, assign wali kelas, fill anggota,
then run bulk naik kelas at year rollover. Daily: fix capacity overflow, chase rombel-tanpa-wali,
place orphan students (registered but unassigned). **GOOD = fast bulk setup at start-of-year, ZERO
orphan/over-capacity students, clean rollover with auditable Mutasi docs.** Cares about completeness +
speed, not aesthetics.

## Winner — C1 Simplest-path: "Papan Kelas" (score 44/45)

Collapse the 5-page Kelas module + standalone Bulk Naik Kelas page into **ONE TU command page** at
`/sch/$sekolah/kelas/`: a TA selector, a rombel-card grid, and three always-visible **fix-it trays**
(Tanpa Wali / Over-Penuh / Siswa Belum Berkelas) that the TU drains to zero with zero-config inline
actions — no separate rombel/anggota/bulk pages and no modals in the daily loop. Setup is **3 clicks**
(generate N rombel se-tingkat with sane defaults → inline wali → click-to-place orphans). Naik Kelas
collapses into a `?rollover=1` side drawer that still emits auditable Mutasi Siswa docs through the
**unchanged** Draft→Pending Ka-TU→Pending Kepsek→Approved workflow.

### Why it won (judged)

- **SF-A:** C1 43 vs C2 (Power-user) 33 · **SF-B:** C4 (Reimagine) 42 vs C3 (Native-first) 35
- **FINAL (real head-to-head): C1 44 vs C4 38.**
- Lowest **risk-per-click**. The current `/kelas/` index ALREADY computes `tanpaWali/overKapasitas/rombelPenuh`
  from a live `useResourceList('Rombongan Belajar')` + client `.filter()` (index.tsx L64-78); `get_siswa_aktif`
  / `proses_bulk_naik_kelas` already exist — so C1 mostly **promotes existing signals into actionable trays**
  rather than inventing infrastructure.
- Decisive tiebreak: **no drag-drop infra exists** in the web app (no `@dnd-kit`/`useSortable`/`onDragStart`,
  not in package.json), making C4's signature drag board net-new, harder-to-a11y UI risky on low-end TU office
  hardware. C1 reaches the same 3-click burst with plain **click-card placement** needing zero DnD, and keeps
  `RombelFormModal`/`AnggotaRombelFormModal` as an "Edit lanjutan" escape hatch so a mid-year transfer or
  repeat-year case never strands the TU. Won Simplicity + Feasibility, tied Fit/Edge/Vernon.

## Grafted ideas (from eliminated designs)

1. **Operational orphan definition + per-student Naik/Tinggal/move controls** — *from C2 Power-user.*
   Define "Siswa Belum Berkelas" exactly as: aktif Siswa with NO Aktif Anggota Rombel row for the selected TA
   (Pendaftaran Siswa whose `rombongan_belajar` is empty OR no Aktif anggota). Pair the rollover drawer with a
   per-row Naik-vs-Tinggal toggle + batch "set status Keluar / move to another rombel" for mid-year-transfer +
   repeat-year cases. Tightens C1's weak spot the final judge flagged.
2. **Server-side Query Reports back the defect COUNTS** — *from C3 Native-first.*
   `rombel_tanpa_wali`, `rombel_over_kapasitas`, `siswa_orphan`, `mutasi_pending` — SQL-computed, sekolah-scoped,
   paginate-proof. Kills the current lying client `.filter()`-over-getDocList counts that only stay honest today
   via `limit_page_length:0` (the 50+ rombel scaling cliff). Trays drain from the live list; **counts + gate read
   the reports.** (Phase 2.)
3. **Single non-dismissable "defects must hit 0" gate** — *from C4 Reimagine.*
   A live defect counter (orphan + over-cap + tanpa-wali) refuses to let the TU mark the year "siap" while any
   defect remains. Makes completeness an enforced zero-target, not a soft hint. Grafted as the `DefectGate` component.

## Bracket result

| Competitor | Angle | Eliminated | Score | Note |
|---|---|---|---|---|
| **C1 Simplest-path — Papan Kelas** | 1 page: TA selector + rombel grid + 3 fix-it trays, zero-config inline | **Winner** | **44** | Won SF-A (vs C2) + FINAL (vs C4 44-38). Cheapest evolution of existing index. |
| C4 Reimagine — Papan Penempatan | Stateful placement board (orphan pool ↔ rombel cols) + defect gate; drag/multi-select | Final | 38 | Lost final on Simplicity+Feasibility: no DnD infra → net-new risky UI. Best graft: the "defects→0" gate. |
| C3 Native-first — Antrean Struktur TU | Thin host over 5 server-computed Query Reports + Mutasi workflow + 2 Notification fixtures | Semifinal | 35 | Lowest-risk build, won Vernon-quality in its bracket, but report/ dir net-new and jobs stay scattered. Best graft: SQL-true counts. |
| C2 Power-user — Komando Kelas | Keyboard-first dense tables + multi-select batch + ⌘K palette + batch screens | Semifinal | 33 | Strong edges but re-scatters the one job across cockpit + 4 routes; N-round-trip batch writes risk. Graft: operational orphan def. |

## Data model sketch (native-first, additive only)

No field renames, no new heavy doctypes for the core loop.

**Reused unchanged:** `Rombongan Belajar` (nama_rombel, tahun_ajaran, tingkat, jenjang, wali_kelas, sekolah,
kapasitas[32], ruangan, status, jumlah_siswa denorm, anggota child; controller already has
`validate()`→`_validate_kapasitas`/`_validate_unique_anggota`/`_validate_kapasitas_vs_anggota` +
`recount_jumlah_siswa()`), `Anggota Rombel` (siswa, no_urut, tanggal_masuk_rombel, status),
`Mutasi Siswa` + its Workflow (fixtures/workflow_mutasi_siswa.json — UNCHANGED, rollover feeds it),
`Pendaftaran Siswa` (LEFT JOIN source for orphan detection).

**NEW BE (controller-layer, NOT page-bypass)** — `sekolahpro/siswa/api/kelas_board.py`, all `@frappe.whitelist`,
all sekolah-scoped. ALL writes route through `doc.save()`/`validate()` + `recount_jumlah_siswa()` — never `db_set`
anggota directly:
- `buat_rombel_batch(sekolah, tahun_ajaran, tingkat, jumlah, kapasitas=32)` → inserts N via `new_doc().insert()` so validate fires; auto nama A..N
- `tugaskan_wali(rombel, user)` → `doc.save()` (re-validates)
- `tempatkan_siswa(rombel, siswa)` → append Anggota Rombel + `doc.save()` (capacity/unique guard) + recount; returns new jumlah_siswa
- `pindahkan_kelebihan(rombel)` → flips overflow anggota (no_urut desc beyond kapasitas) to status Keluar → re-surface in orphan list
- `siswa_belum_berkelas(sekolah, tahun_ajaran)` → SQL: aktif Siswa with NO Aktif Anggota Rombel in TA *(graft C2)*

**NEW BE (C3 graft, Phase 2)** — Query Reports under `sekolahpro/siswa/report/` (dir net-new):
`rombel_tanpa_wali`, `rombel_over_kapasitas`, `siswa_orphan`, `mutasi_pending`. Tray COUNTS read these; tray ROWS
stay live-list for inline patch.

No new fields for MVP. No new anchored doctype → no tenant_registry change.

## Files likely touched

**Web (app-school):**
- `src/routes/sch.$sekolah.kelas.index.tsx` — **REWRITE** → Papan Kelas (TA selector + rombel-card grid + 3 fix-it trays + DefectGate)
- `src/routes/sch.$sekolah.kelas.tsx` — EDIT NAV_GROUPS: collapse Daftar/Rombongan/Anggota pills; add `?rollover` drawer trigger; optional "Edit lanjutan" link
- `src/routes/sch.$sekolah.kelas.{daftar,rombel,anggota}.tsx` — **REDIRECT-STUBS** → `/kelas/` (keep modals mounted as Edit-lanjutan escape hatches)
- `src/routes/sch.$sekolah.kelas.$kodeKelas.tsx` — KEEP as-is (only secondary route, deep per-class read view)
- `src/components/kelas/RombelCard.tsx` *(NEW)* — inline wali picker + capacity badge + click-to-place target
- `src/components/kelas/FixItTray.tsx` *(NEW)* — generic tray (Tanpa Wali / Over-Penuh / Belum Berkelas)
- `src/components/kelas/GeneratorStrip.tsx` *(NEW)* — Buat N Rombel se-Tingkat, zero-config defaults
- `src/components/kelas/RolloverDrawer.tsx` *(NEW)* — `?rollover=1` drawer wrapping get_siswa_aktif/proses_bulk_naik_kelas + per-student Naik/Tinggal toggle
- `src/components/kelas/DefectGate.tsx` *(NEW)* — live counter blocking "Tahun siap" while defects > 0
- `src/components/kelas/{RombelFormModal,AnggotaRombelFormModal}.tsx` — KEEP (fallback)
- `src/components/kelas/pageGuides.ts` — EDIT TU-role guide for board + trays + rollover flow
- `src/lib/kelasBoard.ts` *(NEW)* — orphan/defect aggregation + thin client wrappers over new whitelisted methods; pure, unit-tested

**Backend (sekolahpro):**
- `sekolahpro/siswa/api/kelas_board.py` *(NEW)* — the 5 whitelisted methods above
- `sekolahpro/siswa/doctype/rombongan_belajar/rombongan_belajar.py` — REUSE ONLY (helpers call its validate/recount)
- `sekolahpro/siswa/page/bulk_naik_kelas/bulk_naik_kelas.py` — REUSE (driven by RolloverDrawer)
- `sekolahpro/fixtures/workflow_mutasi_siswa.json` — REUSE UNCHANGED
- `sekolahpro/siswa/report/` *(NEW DIR, Phase 2)* — the 4 Query Reports

## Open questions for the human

1. **Orphan authority:** source of truth = Pendaftaran Siswa (empty `rombongan_belajar`) OR absence of any Aktif Anggota Rombel row? They can diverge (enrolled then removed). Confirm so `siswa_belum_berkelas()` doesn't under/over-count.
2. **TA scoping (top correctness risk):** current index has NO `tahun_ajaran` filter — shows ALL rombel across years. Board needs a TA selector defaulting to active TA. Reuse an existing active-TA singleton/helper (like akademik's `$ta` context), or pick manually?
3. **Defect-gate semantics:** what does "Tahun siap" actually DO when satisfied — flip a status field, fire a notification, or purely visual? A persisted "finalized" state needs a new field/doctype decision (none exists).
4. **Pindahkan kelebihan policy:** which anggota get bumped — highest no_urut, most-recent tanggal_masuk, or TU manual pick? Auto-bumping wrong students mid-year is destructive → default should likely be manual-select.
5. **Partial-failure on buat_rombel_batch:** Frappe whitelisted = one request = one transaction → an exception rolls back the whole batch. Confirm all-or-nothing is desired.
6. **Redirect vs delete** for /daftar /rombel /anggota: plan keeps redirect-stubs to preserve deep links + Kepsek/Guru read access. OK for read-only personas to land on the TU board, or do they need a separate read view? *(See reconcile — Kepsek/Guru get role-sliced surfaces.)*
7. **Phase split:** is the C3 Query Report layer in v1 (replace client counts now) or fast-follow? v1-without-reports keeps `limit_page_length:0` client count — fine for typical schools, breaks the 50+ rombel SLA.
