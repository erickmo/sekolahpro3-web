# Jadwal Tournament Plan — POV Kepala Sekolah (Headmaster) (2026-06-07)

## POV brief (job-to-be-done)

The Kepala Sekolah does not build schedules — they **oversee and sign off** on them. Their entire interaction with the Jadwal module reduces to three recurring questions and one verb:

1. **Is every class covered?** (no rombel with empty/unassigned slots)
2. **Is teacher workload legal and balanced?** (no certified guru below the 24-JTM floor; nobody over the overload ceiling)
3. **What needs my signature?** (major schedule changes awaiting approval)

The verb is **verdict-then-delegate**: read a dashboard, approve what's clean, drill down *only when a flag turns red*, and forward the fix to Kurikulum rather than performing it. They log in occasionally (not a daily power operator), they review at a desk, and they are **personally liable** for what they sign — a coverage hole or a sub-24-JTM violation that reaches Dapodik/sertifikasi review is on them.

The current module is the exact opposite of this: a builder's CRUD console (Slot Jadwal, Jadwal Pelajaran, Jadwal Override, Slot Override) wrapped in a 4-step "Alur Penyusunan Jadwal" flow ribbon, an "Aksi Cepat" shortcut grid, and "Perlu Perhatian" stubs — every surface tuned for Kurikulum. The Kepala is forced through a workshop when they came to read a scoreboard.

## Winner: C1 (Simplest-path) — why it won  (judge rationale woven in)

> "My whole day here is **verdict-then-delegate**, and C1 is the only design that makes my best day a **zero-click day**: I open /jadwal, see three green cards — every class covered, nobody under 24 JTM, nothing waiting for my signature — and I close the tab. That is precisely how I described my job: read dashboards, approve, drill only when a flag turns red."

C1 inverts the module for this persona. It collapses the entire builder surface into **one oversight landing page ("Pantauan Jadwal") plus one approval inbox ("Antrean Persetujuan")**, and removes slot/override/daftar CRUD from the kepala's sub-nav entirely (the routes still exist for other roles). The judge:

> "It strips the builder's flow ribbon and five CRUD pages I would never touch down to **{Pantauan, Persetujuan}**, gives me the coverage heatmap and workload bar I literally asked for, auto-surfaces compliance breaches via a nightly Notification so I never go hunting, and turns approval into two-click Setujui/Tolak over a native Workflow with impact preview."

The signature idea is that **the optimal interaction count is zero**: the landing page is a three-verdict scoreboard (coverage, 24-JTM workload, approval queue) where all-green means the kepala is done, and the only ways to go deeper are clicking a red signal or a two-click Setujui/Tolak in the Workflow-driven inbox. Compliance is computed by **native Query Reports + a nightly Notification**, not by anything the kepala operates.

It also won on cost and maintainability:

> "It is also the **cheapest to ship and the most maintainable**."

Coverage + workload come from Frappe **Query Reports** rendered as charts; compliance flags from a **scheduled Notification**; approval from a **Workflow state transition** — almost no custom aggregation or form authoring.

**Runner-up C6 (Compliance/beban-jam)** lost by one point and is the source of the most important graft:

> "C6 is a hair behind and genuinely tempting because it makes compliance a **gate** and hands me an **exportable Dapodik/sertifikasi dossier** — the thing I am personally liable for — but its extra snapshot machinery and denser reading cost simplicity points, and for the common case C1's silence-when-healthy beats C6's richer-but-busier cockpit. **I want the scoreboard, not the spreadsheet.**"

We keep C1's silence-when-healthy scoreboard as the spine and graft C6's accountability gate + snapshot dossier onto the *approval* path only — so the daily glance stays a three-card scoreboard, and the heavier machinery appears only at the moment of signing.

## Grafted ideas  (folded in only where they sharpen, not dilute, the oversight POV)

- **[from C6] Compliance-as-gate + snapshot dossier** — The Setujui action on the approval inbox is **locked behind green compliance checks** (0 slot kosong on the affected rombel, 0 affected guru <24 JTM, 0 mapel below curriculum-minimum jam). A nightly job writes a **timestamped compliance snapshot** so the kepala has an exportable, dated sertifikasi/Dapodik dossier. This protects the kepala from signing off a violation they are personally liable for. It is grafted onto the *approval path*, **not** the daily landing glance — so the scoreboard stays silent-when-healthy.
- **[from C4] "Sahkan Jadwal Semester" accountable sign-off** — In the approval inbox, semester-wide schedule approval is framed as **formally signing one document**, with the **Sahkan button disabled and a tooltip naming the exact blocker** ("Belum bisa disahkan: 2 slot kosong di 7A; Bu Sri 18 JTM") until every compliance flag is green. Turns approval into accountable sign-off rather than a rubber stamp. Reuses the C6 gate logic for the disabled-state reasons.
- **[from C3] Native Export to PDF/Excel on the workload view** — The "Beban Mengajar Guru" report exposes Frappe's built-in **Export** so the kepala can forward sub-24-JTM evidence straight to the yayasan/sertifikasi review with **zero new export code**. Sits on the workload drill-down, not the landing.
- **[from C2] Force-open flagged docs** — Any schedule carrying a **hard compliance flag** (empty slot, overload) is **excluded from one-click approval**; the kepala must open the drill-down before they can act. Guarantees a violation can never be bulk-rubber-stamped. This is the same gate as the C6 graft, applied per-row.
- **[REJECTED — from C5] Offline IndexedDB approval replay** — explicitly **not** grafted; risks stale approvals, and the kepala reviews at a desk. (A simple Frappe Notification web-push on kurikulum-submit is noted as an *optional* future nicety, but the offline write-queue is out.)

## Proposed IA / submenu  (the kepala's Jadwal surface)

**ModuleShell NAV_GROUPS become role-gated.** For `kepala_sekolah` the Jadwal sub-nav shows **only two items**; for kurikulum/operator the full builder nav is unchanged.

```
Kepala Sekolah sees:
  Pantauan   → /sch/$sekolah/jadwal            (Pantauan Jadwal — landing variant)
  Persetujuan→ /sch/$sekolah/jadwal/persetujuan (Antrean Persetujuan — NEW route)

Kurikulum / Operator / Admin see (unchanged builder nav):
  Ringkasan  → Dashboard (existing builder dashboard)
  Jadwal     → Jadwal Pelajaran, Slot Jadwal
  Override   → Jadwal Override, Slot Override
  + (optionally) Persetujuan as a "submit/track" view
```

- The landing route `/sch/$sekolah/jadwal/` renders a **role variant**: kepala → `<PantauanJadwal>`; everyone else → existing `<JadwalDashboardPage>`. Driven by a new `lib/jadwalRole.ts` helper (mirrors `lib/keuanganRole.ts`).
- `/sch/$sekolah/jadwal/persetujuan` is a **new route** — the only secondary screen for this role.
- The builder routes (`daftar`, `slot`, `slot.$name`, `override`, `slot-override`) **remain on disk and reachable**, just **dropped from the kepala's nav** (no hard access gate — Frappe permissions remain the real boundary; this is presentation-only, consistent with the codebase's permissive role-framing convention).

## Screens & flows  (step-by-step)

### Screen 1 — Pantauan Jadwal (landing, `role=kepala_sekolah` variant)

Replaces the builder dashboard for this role. **No** Aksi Cepat, **no** ModuleFlow ribbon, **no** slot shortcuts, **no** "Jadwal Hari Ini" list.

Layout:
- **Three verdict StatCards only** (reuse `<StatCard>`; each card is the single click into its drill-down):
  - **"Kelas Belum Tuntas"** — count of rombel with empty/unassigned slots (value `0` = green = nothing to do). `urgency=critical`, `accent=rose`.
  - **"Guru di Bawah 24 JTM"** — certification-floor breaches. `urgency=critical`.
  - **"Menunggu Persetujuan Anda"** — approval queue count → links to `/jadwal/persetujuan`. `urgency=warn`.
- **Coverage heatmap** — `Query Report "Cakupan Jadwal per Rombel"`, rows=rombel, cols=hari, cell color = % slot terisi; red cell = empty/unassigned mapel. Read-only; hover shows count. Click red cell → drill-down slide-over.
- **Workload-balance bar** — `Query Report "Beban Mengajar Guru"`, JTM per guru with a 24-JTM floor line + overload ceiling band; bars below floor render red, over ceiling amber. Carries the **[C3 graft] Export PDF/Excel** action.
- **Compliance flag strip** — chips auto-surfaced from the nightly Notification's last evaluation (kelas tanpa jadwal aktif semester ini; mapel < jam kurikulum minimum; guru sertifikasi <24 JTM). Click = drill; **dismiss not allowed** (these clear only when the underlying condition clears).
- **PageGuide** with `kepala_sekolah`-tagged steps: "baca tiga kartu, tindak hanya yang merah, setujui dari antrean."

**Flow A — Daily oversight (the win):** open `/jadwal` → three cards green → done, zero further clicks.
**Flow B — Coverage gap:** "Kelas Belum Tuntas" = 2 → click → drill slide-over lists the 2 rombel + empty cells → **"Teruskan ke Kurikulum"** (creates a ToDo) → kepala leaves.
**Flow C — Workload breach:** "Guru di Bawah 24 JTM" = 1 → click → bar drill shows Bu Sri at 18 JTM → optionally Export evidence → forward to kurikulum to rebalance.

### Screen 2 — Antrean Persetujuan (`/jadwal/persetujuan`)

The only secondary screen for this role. Approve/reject in two clicks, never opening a builder form.

- **List** of `Jadwal Pelajaran` / `Jadwal Override` docs in Workflow state **"Diajukan"**, filtered to this sekolah. Columns: rombel, jenis perubahan, pengaju (kurikulum), tanggal, **ringkasan dampak** (e.g. "3 slot baru, beban Bu Sri +4 JTM").
- **Per-row Setujui / Tolak** wired to a workflow action (see data model note on `useStatusTransition` vs `workflow_state`).
- **[C6+C4+C2 grafts] Compliance gate:** Setujui is **disabled** when the row carries a hard compliance flag; tooltip names the blocker ("Belum bisa disahkan: 2 slot kosong di 7A"). Flagged rows are **force-opened** — the kepala must expand the drill before acting.
- **Inline impact preview on expand:** before/after coverage % for that rombel + workload delta for affected guru, pulled from the same two Query Reports.
- **[C4 graft] "Sahkan Jadwal Semester"** sign-off button (semester-wide), disabled until every compliance flag for that semester is green.
- **Empty state** "Tidak ada yang menunggu persetujuan" — the desired resting state.

**Flow D — Approval:** "Menunggu Persetujuan Anda" = 3 → click → Antrean → expand row to read impact → if green, **Setujui** → Workflow transitions "Diajukan" → "Disetujui Kepsek", doc becomes `is_aktif`, row clears. If a hard flag is present, Setujui is locked with a named blocker.

### Screen 3 — Drill-down detail (read-only slide-over)

Reached only from a red card / red heatmap cell / flag chip.

- Shows the offending list (e.g. "Rombel 7A: 4 slot Senin kosong, mapel IPA belum ber-guru").
- **Single secondary action "Teruskan ke Kurikulum"** → creates a Frappe **ToDo / Notification** assigned to the kurikulum role. The kepala delegates, never edits.
- **No** FormSection/FormField create surface for this role.

**Flow E — Passive compliance:** nightly scheduled Notification re-evaluates the two Query Reports; a new breach → system alert + email to kepala_sekolah role, and the flag strip shows it next login. No manual checking. The same nightly run writes the **[C6 graft] compliance snapshot** row.

## Data model / Frappe-native touchpoints  (hooks-first, native-first)

> Backend lives in a separate checkout (bind-mounted; invisible to this web tree). All backend items below are specified for the `sekolahpro` app side and must be coordinated with the kurikulum redesign.

**Existing data confirmed (this checkout):** `Jadwal Pelajaran` is a **header** doctype `{name, rombel, tahun_ajaran, semester, kurikulum, is_aktif}`; per-slot detail (hari/jam_mulai/jam_selesai/mapel/guru) lives in child table **`slots` (Slot Jadwal)**. `Jadwal Override` + `Slot Override` mirror this. The current dashboard runs on **stubs** (`STUB_KONFLIK_SLOT=0`, etc.) — the heatmap/bar will degrade to "mostly red" honestly until slots are populated.

### Native (zero / near-zero custom aggregation)

- **Query Report "Cakupan Jadwal per Rombel"** — aggregates `Slot Jadwal` child rows under each `Jadwal Pelajaran` by rombel × hari; flags empty slots and null mapel/guru. Feeds the coverage heatmap and the "Kelas Belum Tuntas" card. Denominator joins `rombel` + `anggota_rombel` (siswa/ module) read-only.
- **Query Report "Beban Mengajar Guru"** — sums `durasi_menit`/JTM per guru across active `Slot Jadwal`; compares to a **24-JTM floor** + overload ceiling. Feeds the workload bar and the "Guru di Bawah 24 JTM" card. Carries native **Export** ([C3 graft]).
- **Dashboard + Dashboard Chart** — two charts (Heatmap, Bar) sourced from the two reports. Frontend reads them via `frappeFetch` to `frappe.desk.query_report.run` (there is no existing native-chart wiring in the web app today — see Open Questions; render with the existing React chart components if iframing a Frappe chart is rejected).
- **Workflow** on `Jadwal Pelajaran` and `Jadwal Override`: states **Draf → Diajukan → Disetujui Kepsek / Ditolak**; adds a `workflow_state` field. Approval = state transition only. `Jadwal Pelajaran.is_aktif` is set as a **workflow action side effect** of "Disetujui Kepsek", not via manual edit. The "Disetujui Kepsek" transition is **permission-gated to the kepala_sekolah role**.
- **Notification (scheduled, nightly)** — re-evaluates the two reports → system alert + email to `kepala_sekolah` role when a coverage or 24-JTM breach appears.

### New (the grafts)

- **[C6 graft] "Snapshot Kepatuhan Jadwal" doctype** (per-school, **must be registered in `tenant_registry.py` DOCTYPES['SCHOOL']** or tenant scoping silently leaks). Written nightly by the same scheduled job: `{sekolah, tanggal, kelas_belum_tuntas, guru_di_bawah_jtm, mapel_kurang_jam, ringkasan_json}`. Exportable timestamped dossier for sertifikasi/Dapodik. Retention TBD (Open Questions).
- **[C6+C4+C2 graft] Compliance-gate evaluator** — a backend method (or reuse the two report aggregates) that returns hard-flag reasons for a given Jadwal doc, consumed by the inbox to disable Setujui and supply the blocker tooltip. No new aggregation — derived from the existing two reports.

### Frontend touchpoints

- **`useStatusTransition` (jadwal-extra/workflowActions.ts) — RECONCILE:** today it PATCHes a plain `status` field via `useResourceUpdate`. Frappe Workflow transitions must go through `frappe.model.workflow.apply_workflow` (or a server method) to honor workflow guards/permissions — a raw field PATCH bypasses them. Add a thin **`useWorkflowAction`** wrapper (or repoint the helper at `workflow_state` via the workflow API). See Open Questions.
- **`lib/jadwalRole.ts` (NEW)** — mirrors `lib/keuanganRole.ts`/`akademikRole.ts`: derive `kepala` vs `kurikulum`/`operator` from `useSession`, permissive fallback (all roles when none match — never an access gate).
- **NAV_GROUPS role-gating** in `sch.$sekolah.jadwal.tsx` — `{Pantauan, Persetujuan}` for kepala, full builder nav otherwise.
- **PageGuide** — add `kepala_sekolah`-tagged steps to `jadwal/pageGuides.ts` (a new `pantauan` guide id) using existing `SCHOOL_ROLE_LABEL`.
- **Routing/params** — Tahun Ajaran filter autoname may contain `/` → `encodeURIComponent` on any route param (known gotcha).

### Tradeoffs (carried from the winning design)

- Hiding builder CRUD from the kepala's nav means if no kurikulum user exists, the kepala can't build from this view — **accepted** (persona oversees, does not build; routes still exist for other roles).
- Native Query Reports/Dashboard Charts are lower-code and Vernon-aligned but less visually bespoke than a hand-built React heatmap — **accepted** for maintainability; oversight reading beats pixel polish.
- Adding a Workflow changes the doctype lifecycle for **everyone** (kurikulum now submits for approval) — a real process change, **must be coordinated with the kurikulum redesign**.
- 24-JTM floor + per-mapel minimums encoded as thresholds/fixtures — regulation changes need a config update (the [C6] snapshot helps prove compliance over time).
- Real numbers depend on `Slot Jadwal` child data being populated — degrades to "mostly red" honestly rather than faking green.

## Bracket result table

| Competitor | Angle | Fit | Simpl | Edge | Vernon | Feas | Total /45 |
|---|---|---|---|---|---|---|---|
| **C1** | **Simplest-path** | **5** | **5** | **3** | **5** | **5** | **41** |
| C6 | Compliance/beban-jam | 5 | 4 | 4 | 5 | 4 | 40 |
| C4 | Reimagine | 5 | 4 | 4 | 4 | 4 | 39 |
| C3 | Native-first | 4 | 4 | 3 | 5 | 5 | 36 |
| C2 | Power-user | 4 | 2 | 5 | 4 | 2 | 32 |
| C5 | Mobile-first | 3 | 4 | 3 | 3 | 2 | 28 |

Notes: **C1** — three verdict cards + approval inbox; all-green = zero-click day; builder hidden from kepala's nav; native Query Reports + Workflow + nightly Notification. Thin on bentrok ruang/guru and guru-izin-mendadak override depth. **C6** — deepest accountability surface (pass/fail verdicts, Dapodik reconciliation, daily snapshot, exportable dossier); slightly heavier (new Snapshot doctype) and denser to read. **C4** — Rapor Jadwal: schedule as a document to grade/sign; "Sahkan" locked behind green checklist; slightly more conceptual reframe. **C3** — read-only Pengawasan lens, near-zero new code, instant export; report iframes feel "desk" not glanceable, nav not gated. **C2** — best edge coverage (force-open, bulk-approve clean queue, rebalance drawer) but a daily-power-operator ritual (j/k/x/a, ⌘K) for an occasional user. **C5** — push-to-approve PWA is slick but kepala reviews at a desk; offline IndexedDB replay risks stale approvals; cramped phone heatmap.

## Files likely touched

### app-school (web — this checkout)
- `apps/school/src/routes/sch.$sekolah.jadwal.tsx` — role-gate `NAV_GROUPS` ({Pantauan, Persetujuan} for kepala).
- `apps/school/src/routes/sch.$sekolah.jadwal.index.tsx` — render role variant: kepala → `<PantauanJadwal>`, else existing `<JadwalDashboardPage>`.
- `apps/school/src/routes/sch.$sekolah.jadwal.persetujuan.tsx` — **NEW** approval inbox route.
- `apps/school/src/components/jadwal/PantauanJadwal.tsx` — **NEW** landing variant (three verdict cards, heatmap, workload bar, flag strip).
- `apps/school/src/components/jadwal/AntreanPersetujuan.tsx` — **NEW** inbox (gate + impact preview + Sahkan).
- `apps/school/src/components/jadwal/PantauanDrilldown.tsx` — **NEW** read-only slide-over + "Teruskan ke Kurikulum".
- `apps/school/src/lib/jadwalRole.ts` — **NEW** role helper (mirror `keuanganRole.ts`).
- `apps/school/src/components/jadwal-extra/workflowActions.ts` — reconcile to `workflow_state` / add `useWorkflowAction`.
- `apps/school/src/components/jadwal/pageGuides.ts` — add `pantauan` guide id with `kepala_sekolah` steps.
- `apps/school/src/lib/jadwalReports.ts` — **NEW** `frappeFetch` wrappers for `frappe.desk.query_report.run` ("Cakupan Jadwal per Rombel", "Beban Mengajar Guru") + compliance-gate reasons.
- Tests: `components/jadwal/__tests__/*` + `lib/jadwalRole.test.ts` (RTL `afterEach(cleanup)` per repo convention; reword guide copy that collides with queried labels).

### backend (sekolahpro — separate checkout, coordinate)
- Query Reports: `Cakupan Jadwal per Rombel`, `Beban Mengajar Guru`.
- Workflow fixtures on `Jadwal Pelajaran` + `Jadwal Override` (states + `workflow_state` field + "Disetujui Kepsek" action setting `is_aktif`).
- `Notification` fixture (nightly scheduled, kepala_sekolah role).
- **NEW** `Snapshot Kepatuhan Jadwal` doctype + **register in `tenant_registry.py` DOCTYPES['SCHOOL']**.
- Scheduler hook (nightly evaluate reports → Notification + snapshot row).
- Dashboard + Dashboard Chart fixtures (Heatmap, Bar) if native charts are used.
- Tests: write `FrappeTestCase` (CI gate is `bench run-tests` unittest, **not** pytest, in the container).

## Open questions for the human

1. **Threshold config vs. hardcode** — back the 24-JTM floor + per-mapel curriculum-minimum jam with a "Standar Beban Mengajar" Single doctype (config-editable, no deploy on regulation change) or hardcode as report constants for ruthless simplicity?
2. **Workflow lifecycle coordination** — adding Draf → Diajukan → Disetujui Kepsek / Ditolak forces kurikulum to submit for approval. Must this be sequenced with the kurikulum (Wakil Kurikulum) redesign, or ship the kepala read+approve surface first against a manually-populated workflow?
3. **`useStatusTransition` reconciliation** — repoint at `workflow_state` via `frappe.model.workflow.apply_workflow`, or add a thin `useWorkflowAction` wrapper? The current helper PATCHes a plain field and bypasses Workflow guards/permissions.
4. **"Major change" definition** — what triggers a mandatory kepala approval: every Slot edit, or only changes crossing a threshold (≥N slots, beban delta ≥ X JTM, active-semester only)? Too broad = approval fatigue; too narrow = liability gap.
5. **Snapshot retention + scoping** — how long to keep daily "Snapshot Kepatuhan Jadwal" rows (audit/Dapodik need vs. table growth), and confirm per-sekolah tenant scoping is registered in `tenant_registry.py`.
6. **Entry point** — does the kepala expect this oversight aggregated on `/akademik` or the global home, or is entry strictly via `/jadwal`?
7. **Web-push on submit (C5 partial)** — in scope for v1 (a plain Frappe Notification web-push when kurikulum submits) or defer to a notifications pass? The email/system-alert Notification is in scope regardless; the offline write-queue stays rejected.
