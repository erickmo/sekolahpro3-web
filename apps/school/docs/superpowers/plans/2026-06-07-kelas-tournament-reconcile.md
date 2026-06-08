# Kelas Tournament — Reconcile Note (read this FIRST)

> Date: 2026-06-07 · Three POV tournaments (TU / Guru / Kepsek) ran over the SAME Kelas module.
> Each produced a winner plan. **This note reconciles them into ONE build.** Proposal only — NOT implemented.

## TL;DR — build ONE role-sliced module, NOT three forks

All three winners redesign the **same `/sch/$sekolah/kelas/` surface** for a different primary role. They are
**not** three separate modules and must not be built as three forked route trees. The spine is a **single
role-branch at the `/kelas` index** plus a few **shared libs/fixtures** the three surfaces all consume.

| POV | Winner | Surface | Landing behavior |
|---|---|---|---|
| **Tata Usaha** | C1 Simplest "Papan Kelas" (44/45) | TU builder board: TA selector + rombel grid + 3 fix-it trays + DefectGate | `/kelas/` index renders the board (default) |
| **Guru / Wali Kelas** | C4 Reimagine "Kelasku" cockpit (37/45) | Phone-first people-cards cockpit + Catatan Wali store | `/kelas/` redirects wali → `/kelas/saya` |
| **Kepala Sekolah** | C4 Reimagine "Meja Persetujuan" (40/45) | Two-pane approval desk + Dampak Struktur + Sertifikat strip | `/kelas/` index renders the desk |

## The single contention point: `sch.$sekolah.kelas.index.tsx`

All three plans rewrite/branch the SAME file. **It must become ONE role switch, not three competing rewrites:**

```
index.tsx render decision (single source = lib/kelasRole.ts deriveKelasRoles, priority-ordered):
  primary === 'kepsek'       -> <MejaPersetujuanKelas/>      (Kepsek plan)
  primary === 'wali_kelas'   -> redirect navigate('./saya')  (Guru plan)
  else (TU / admin / default)-> <PapanKelas/>                (TU plan)
```

**Dual-role rule (confirmed across all 3 open-questions):** priority places `wali_kelas` and `kepsek` **below
TU/admin** — a user who is both wali AND TU/Kurikulum keeps the **TU builder** as default and reaches the cockpit
via a "Kelasku" pill. Confirm the TU-vs-Kepsek precedence for a user who is somehow both (rare; default = Kepsek
desk, since approval is the higher-stakes job).

## Shared assets (build ONCE, consumed by multiple plans)

1. **`src/lib/kelasRole.ts`** — proposed by BOTH the Guru and Kepsek plans. **One file.** Wraps `lib/sessionRole.ts`
   (which today only exports generic `deriveRoles`/`mapRoles`/`pickPrimary` — verified). Exports `deriveKelasRoles`
   with buckets {kepsek, wali_kelas, tu/admin} + priority order + role labels. The index switch, the pill, and the
   Read-only gating all read this.
2. **ONE class-health Query Report** — the TU plan wants `rombel_tanpa_wali`/`rombel_over_kapasitas`/`siswa_orphan`/
   `mutasi_pending`; the Kepsek plan wants `Kepatuhan Rombel` (tanpa-wali / over-cap / penuh / tanpa-jadwal / rasio).
   **Unify into one server-side Report** (or a small report family) that backs BOTH the TU DefectGate counts AND the
   Kepsek Sertifikat strip — one source of truth, also visible in native Desk. Don't ship two overlapping reports.
3. **`src/lib/kelasApproval.ts`** — extract `canApproveKepsek` + Pending-Kepsek gate + `apply_workflow` wrapper from
   `siswa/mutasi/$id.tsx` (~L156-170). Imported by the Kepsek desk AND the existing TU mutasi detail. The TU plan's
   RolloverDrawer emits Mutasi docs that flow into exactly this gate → the two plans meet at the Mutasi workflow.
4. **`Mutasi Siswa` workflow (unchanged)** — the seam between TU (authors bulk Mutasi at rollover) and Kepsek
   (approves at Pending Kepsek). Neither plan changes it. The TU RolloverDrawer is the producer; the Kepsek Meja is
   the consumer.

## Build order (foundation first, then per-persona surfaces)

```
Phase 0  Foundation (shared)
  - lib/kelasRole.ts (deriveKelasRoles + priority + labels)
  - index.tsx single role-branch switch (3-way)
  - unified class-health Query Report (BE fixture, migrate)
  - lib/kelasApproval.ts extract (refactor mutasi.$id.tsx, no behavior change)
Phase 1  TU "Papan Kelas"  (highest reuse of existing index; lowest risk → ship first)
  - kelas_board.py whitelisted methods, RombelCard/FixItTray/GeneratorStrip/RolloverDrawer/DefectGate
Phase 2  Kepsek "Meja Persetujuan"
  - MejaPersetujuanKelas/AntreanKeputusan/KartuTinjau/SertifikatKepatuhan, lib/dampakStruktur.ts, Notification fixture
Phase 3  Guru "Kelasku" cockpit
  - /kelas/saya route + cockpit components, Catatan Wali doctype (+ tenant_registry), presence wiring
```

## Cross-cutting GOTCHAS to verify before coding (each cost a tournament point or a known bug)

- **`lib/sessionRole.ts` exports generic helpers only** — `kelasRole.ts` must add the wali_kelas/kepsek matchers itself
  (mirrors `akademikRole.ts` / `ppdbRole.ts`). Verified by both plans.
- **Beranda ALREADY self-routes user→rombel via `useSession`** — reuse this for the Guru cockpit redirect; **drop the
  bespoke `get_kelas_saya` whitelisted method** (the Guru final judge flagged it as redundant infra).
- **Absensi is NOT yet wired into `/kelas`** (the `$kodeKelas` detail file's own TODO) → the Guru "Hadir Hari Ini"
  presence strip is **net-new wiring**, not free. Budget for it.
- **`Catatan Wali` is a NEW anchored doctype** → MUST be registered in `tenant_registry.py DOCTYPES['SCHOOL']` or tenant
  scoping silently leaks (known repo gotcha, CI test gate exists). Its test = **FrappeTestCase** (CI gate is
  `bench run-tests`/unittest, NOT pytest in-container).
- **No drag-drop infra in the web app** (no `@dnd-kit`/`useSortable`) — the TU board uses plain click-card placement by
  design; do not reintroduce DnD.
- **`Absensi Harian` child field on the parent is `detail`** (not `detail_absensi_harian`) — Guru presence strip.
- **`query_report.run` has ZERO existing web usage** — the Kepsek Sertifikat strip (and unified report) is the first
  consumer. Either accept that or fall back to a whitelisted aggregate `get_list` matching the existing client-count style.
- **Current `/kelas` index counts are client `.filter()` over `limit_page_length:0`** — honest only until ~50 rombel.
  The unified Report (Phase 0) replaces them; until then the 50+ rombel SLA is at risk.
- **Dampak Struktur / DefectGate numbers lean on `jumlah_siswa` denorm** — keep ADVISORY (warning chip), never a hard
  block. The Workflow engine + controller `validate()` stay the only authority.

## Tournament integrity caveat (honest record)

The original 24-agent workflow had a judge-output formatting bug: the SF judges for the **Guru** and **Kepsek**
brackets returned the literal labels `"B"`/`"A"` instead of competitor keys `"C4"`/`"C1"`, so those two finals
**walked over** instead of being adjudicated, and both were genuine **SF ties** (Guru 41-41, Kepsek 43-43). Those two
finals were **re-run as proper head-to-head judged rounds** before writing these plans:

- **Guru final (re-judged): C4 37 vs C1 36** — tipped by the persistent `Catatan Wali` store.
- **Kepsek final (re-judged): C4 40 vs C1 39** — tipped by the `Dampak Struktur` guardrails + danger-flagged DO/Pindah.

Both confirmed the synthesizer's original C4 calls. The TU bracket ran a real final (C1 44 vs C4 38) and needed no re-run.

## AUDIT CORRECTIONS — applied 2026-06-07 (SUPERSEDE any conflicting text above/in siblings)

Two-agent plan audit (System Analyst = BLOCKED, Code Reviewer = CONCERN) + human decisions. These are binding for the build:

### Product decisions (human)
- **B1 — Kepsek queue is DESTRUCTIVE-ONLY.** The real `workflow_mutasi_siswa.json` escalates ONLY `Pindah Keluar` +
  `Drop Out` to `Pending Kepsek`; `Naik Kelas`/`Tinggal Kelas` are finalized by Ka-TU (Kepsek never sees them). So the
  Kepsek "Meja Persetujuan" queue = `workflow_state == 'Pending Kepsek'` = intrinsically Pindah/DO only. **DROP the
  "bulk Naik Kelas approval" feature entirely.** No workflow change. The danger-flag / Dampak-Struktur framing stays.
- **B2 — Bulk rollover stays AUTO-APPLY (out of scope).** `proses_bulk_naik_kelas` does `.insert().submit()` with empty
  `workflow_state` → side-effects fire immediately (self-approve), shipped+tested behavior. RolloverDrawer is a **thin
  wrapper over the existing endpoint** — it does NOT produce Pending-Kepsek docs and the Kepsek desk does NOT consume
  rollover output. No BE behavior change, no test rewrite. (Document the auto-apply; the B3 double-submit hardening is a
  separate future decision.)

### Mechanical corrections (fold into the named phase)
- **F1 — `lib/kelasApproval.ts` extracts from TWO files:** `siswa/mutasi/$id.tsx` AND `siswa/kelulusan/$id.tsx` (the
  `canApproveKepsek`/`canApproveKatu`/`apply_workflow`/reject-Comment block is copy-pasted in both). Both import the shared
  helper. Generic over `WorkflowState` + role-set. **Phase 0.**
- **F2 — `lib/mutasiConstants.ts` (Phase 0):** `WORKFLOW_STATE`, `JENIS_MUTASI`, `DESTRUCTIVE_JENIS` (= [Pindah Keluar, Drop
  Out]) as `as const`. Every new surface (DefectGate, dampakStruktur, AntreanKeputusan queue filter, kelasApproval) imports
  it. Reconcile the LIVE `"DO"` vs `"Drop Out"` inconsistency (siswa.$nis uses both) — **open question, do not silently pick.**
- **F3 — `lib/kelasRole.ts` mirrors `genericRole.ts`/`perpustakaanRole.ts`/`berandaRole.ts`** (wrap `deriveRoles` from
  `sessionRole.ts` with a config), NOT `akademikRole.ts` (which duplicates the engine — wrong template). Own buckets
  `{kepsek, wali_kelas, tu}` since it must distinguish wali_kelas from plain TU. Priority order = a named constant.
- **F4 — reuse `resolveTahunAjaran()` from `lib/akademikPeriode.ts`** (+ `readStoredPeriode`/`writeStoredPeriode`) for the
  board TA default. **Do NOT invent a new active-TA query** (BE or web). **TA selector + active-TA default is a v1
  REQUIREMENT** (not fast-follow): today's index filters `is_aktif` only with NO TA filter → counts currently span all
  years and are wrong regardless of rombel count.
- **F5 — BE layering (hooks-first):** roster mutations are **controller methods on `RombonganBelajar`**
  (`tempatkan_anggota(siswa)`, `pindahkan_kelebihan()`), next to `validate()`/`recount_jumlah_siswa()`. `kelas_board.py`
  whitelist entries are ≤10-line thin wrappers (`get_doc → call method → return`). `buat_rombel_batch` = thin orchestration
  (loop `new_doc().insert()`) reusing controller default `kapasitas`/`MIN_TINGKAT`/`MAX_TINGKAT` constants (don't re-literal `32`).
  `siswa_belum_berkelas` = read/query, fine in api. All writes via `doc.save()`/`validate()`; `db_set` only inside `recount`.
- **F6/F7 — `index.tsx` is a THIN ROUTER edited EXACTLY ONCE (Phase 0):** the 3-way switch only
  (`kepsek → <MejaPersetujuanKelas/>` | `wali_kelas → navigate('./saya')` | else `<PapanKelas/>`). Today's
  `KelasDashboardPage` body MOVES into `PapanKelas`. Persona phases add components, NEVER re-touch the switch.
  `PapanKelas`/`MejaPersetujuanKelas` are containers composing leaf components; aggregation/pure logic in
  `kelasBoard.ts`/`dampakStruktur.ts`/`kelasku.ts`. Every component ≤300 lines, every function ≤40.
- **F8 — ONE health-report spec now:** single `siswa/report/kepatuhan_rombel/` emitting all columns both surfaces need
  (tanpa-wali / over-cap / penuh / orphan / tanpa-jadwal / rasio / mutasi-pending). Deferred to fast-follow per v1, but until
  it ships BOTH the TU DefectGate counts AND the Kepsek Sertifikat read the SAME client-count helper in `kelasBoard.ts`.

### Edge-case corrections (System Analyst)
- **C5/C7 — orphan SQL filters BOTH `Siswa.status == 'Aktif'` AND no-Aktif-Anggota-Rombel-in-TA** (else DO/Pindah students
  pollute the orphan tray). `Tinggal Kelas` keeps the student as Aktif anggota of the OLD rombel → correctly NOT an orphan.
- **C7 — `pindahkan_kelebihan` edits ANGGOTA status only (→ Keluar) + recount; NEVER touches `Siswa.status`** (only Mutasi
  flips Siswa.status). Manual-select default (no auto-bump).
- **C6 — Dampak Struktur / guard-preview over-cap + Ditutup chip renders ONLY for `jenis == Naik Kelas`** (the only jenis with
  a `rombel_tujuan`); Pindah/DO/Tinggal show the destructive-confirm only, no headroom chip.
- **C8 — `Catatan Wali` history queried by `siswa`** (not only `rombel`) so within-author cross-rombel history is retrievable;
  cross-WALI privacy wall (next-year wali can't read prior wali's notes) is INTENTIONAL — document it.
- **C4 — dual-role TU+Kepsek precedence is OPEN:** Analyst argues default to TU Papan (daily structure job) + Meja pill, not
  Kepsek desk. Confirm with human before Phase 2. Both surfaces MUST be reachable via pill from either default.

## Revised build order (after corrections)

```
Phase 0  Foundation (web-only, lowest risk, ship/commit first)
  - lib/mutasiConstants.ts (F2)
  - lib/kelasRole.ts (mirror genericRole, F3) + named priority constant
  - lib/kelasApproval.ts (extract, F1) + refactor mutasi.$id.tsx AND kelulusan.$id.tsx (behavior-preserving)
  - index.tsx 3-way role-branch switch (F6/F7) — move KelasDashboardPage body into PapanKelas (TU default unchanged for now)
  - tests: kelasRole role-slice, kelasApproval gate parity, index switch; tsc/eslint/vitest green
Phase 1  TU "Papan Kelas" (web + BE controller methods)
Phase 2  Kepsek "Meja Persetujuan" — DESTRUCTIVE-ONLY queue (B1), no bulk-Naik
Phase 3  Guru "Kelasku" cockpit + Catatan Wali doctype (BE) + presence wiring (reuse Rekap Absensi Siswa report)
Fast-follow  unified kepatuhan_rombel Query Report (F8) replaces client counts
```

BE caveat: BE repo (`sekolahpro`) is currently on branch `feat/jadwal-persona-guru` (concurrent session). BE work (Phase 1
controller methods, Phase 3 Catatan Wali) needs its own branch off BE main once that checkout is free — do not collide.

## Next step

Build Phase 0 foundation under TDD in an isolated worktree (base = origin/main). Persona surfaces + BE = subsequent phases
(multi-session L; state lives here + in the tracker). Resolve the remaining OPEN items before their phase: `DO`/`Drop Out`
value (F2), dual-role TU+Kepsek default (C4), rasio siswa:guru source, Catatan cross-year privacy copy, TA timezone.
