# Jadwal Tournament Plan — POV Tata Usaha (Admin TU) (2026-06-07)

## POV brief (job-to-be-done)

The Tata Usaha / Admin TU is the person who physically *builds and patches* the timetable. Their day splits into two repeating jobs:

1. **Build** the master weekly timetable for each rombel at the start of a semester — dense, repetitive desk work, slot by slot.
2. **Patch** it all term long when reality breaks the plan — "Bu Ani izin Selasa, carikan pengganti jam ke-3", a sudden libur, an extra session.

"Good" for this persona was defined as exactly four things:

- **Fewest clicks per slot** when building.
- **Conflict detection BEFORE publish**, not a stub count discovered after the fact.
- **One-click substitution** for the request-driven half of the day.
- **A clear "what is still broken" worklist** sitting in the same surface they work in.

The TU is not a vim user and not a compliance officer. Keyboard-maximalism (C2) and JTM/Dapodik legal gating (C6) are adjacent to their core loop. Mobile (C5) solves only the corridor-triage sliver of their day. The build is desk work; the patch is a one-liner.

## Winner: C1 (Simplest-path) — why it won  (judge rationale woven in)

C1 collapses today's **5-page CRUD spread** (Dashboard + Daftar + Slot + Override + Slot-Override) into **two surfaces**: a **Papan Susun** (one rombel-week grid you click-to-fill) and a **Kotak Permintaan** (one substitution inbox). It does the TU's four jobs in the fewest surfaces with the least to learn.

In the judge's own words:

> "As the TU who actually lives in this screen, C1 wins because it does my four jobs in the fewest surfaces with the least to learn. I build the timetable by clicking an empty cell and typing two fields — Mapel then auto-filtered Guru — and the cell turns red the instant a server-validated double-book happens, so I catch every clash WHILE I type, not after I publish. The Sisa rail (Belum terisi / Bentrok / Mapel tanpa guru) is my broken-worklist sitting in the same view I work in, each line jumping me straight to the bad cell, and Terbitkan literally can't fire until it's green. Cari Pengganti is one ranked dropdown of free-and-qualified teachers that writes both override doctypes plus the notification in a single action — no two-form scavenger hunt."

On why C1 beat the runner-up C4 (Reimagine, the conflict-free Broker):

> "C4's broker is arguably more foolproof and has better edge coverage, but it pays for that by making the grid read-only, and a read-only grid fights how I bulk-build a fresh semester; it also leans on clean competency/cap master data and new server methods I can't count on every tenant having. C1 gives me 90% of C4's safety at a fraction of the build cost, collapses 5 pages to 2, and enters TA/semester/kurikulum once instead of per slot. That's the design that makes my Tuesday-morning 'carikan pengganti jam ke-3' a single click and my semester build a green-or-not grid I can clear to zero."

**The signature idea:** a single click-to-fill rombel-week grid where every empty cell *is* the entire slot-entry form (Mapel + Guru, two fields) and turns red the instant a server-validated guru/room double-book is detected — so building, conflict-checking, and the "what's still broken" worklist all happen in ONE screen, and the **Terbitkan** button physically can't fire until the grid is green.

**Why this fits the existing codebase cheaply.** The backend already does the hard part: `JadwalPelajaran.validate()` + `sekolahpro/akademik/utils/jadwal_conflict.py` already raise `ValidationError` on guru double-book (internal *and* cross-active-jadwal), kelas double-book, and slot overlap. C1's "red paint is truth, not a client guess" is mostly *surfacing* validation that already exists, not inventing it. The two override doctypes (`Jadwal Override` + `Slot Override`) already enforce the substitution rules; C1 just hides the two-form split behind one action.

## Grafted ideas  (each labelled with its source competitor)

These four grafts fold in *without* diluting the TU POV — every one of them serves "fewest clicks / catch-before-publish / one-click patch / broken-list in view". The fifth (C5) was rejected as scope-diluting.

- **[from C4 — Reimagine] The conflict-free-only Broker as the candidate engine.** A picker that can ONLY surface teachers who (a) teach the mapel, (b) are free at that exact hari+jam, and (c) are under their weekly JTM cap. Graft it as the engine behind **both** C1's empty-cell **Guru** field **and** the **Cari Pengganti** dropdown — so even the build flow can't introduce a double-book by construction, not just catch it after. This gives the TU ~90% of C4's "zero-error" safety while keeping the grid *editable* (the part of C4 the judge rejected).
- **[from C3 — Native-first] One Query Report as the single source of truth.** A native Query Report **"Konflik & Lubang Jadwal"** is the ONE server-side surface that simultaneously feeds (1) the StatCards, (2) the Sisa worklist rail, (3) the grid red-paint truth, and (4) the publish-gate condition. One low-code SQL surface instead of four stubs that can silently disagree — this directly retires the `STUB_KONFLIK_SLOT / STUB_OVERRIDE_AKTIF / STUB_GURU_IZIN_DAMPAK` hardcodes in the current dashboard.
- **[from C2 — Power-user] Bulk paste / column-fill.** Copy a filled cell, shift-select a range, paste to replicate the same guru+mapel down a column (e.g. PJOK every Friday jam ke-1) or across parallel rombel. A big clicks-saver layered on top of click-to-fill that targets the once-a-semester repetition the TU dreads — kept lightweight (no full keyboard-grid / ⌘K verb surface that the judge dinged C2 for).
- **[from C6 — Compliance/beban-jam] Live per-guru JTM tally + soft flag.** A running per-guru JTM count and an **advisory** "guru di bawah 24 JTM" line on the worklist — so the TU notices a sertifikasi shortfall while assigning instead of in a spreadsheet later. Crucially **advisory only, never a hard publish-block** (the judge explicitly rejected C6's gating: "can actively block me when a guru is legitimately under 24 jam"). The tally reads the same Detail Penugasan Guru competency data the Broker uses, so it's near-free.
- **[from C5 — Mobile-first] REJECTED (`graft_worth_it: false`).** The Bereskan/Tambal two-verb framing with a phone-friendly Cari Pengganti is a nice corridor convenience, but the full PWA/serviceWorker/offline-queue cost is disproportionate for a desk-bound build persona. The Kotak Permintaan will be *responsive* (works on a phone) for the "guru izin" moment, but no offline queue / no background-sync — that is enough.

## Proposed IA / submenu  (the TU's Jadwal surface)

**Before (5 pages, config-CRUD framing):**

```
Ringkasan → Dashboard
Jadwal    → Jadwal Pelajaran (daftar) · Slot Jadwal
Override  → Jadwal Override · Slot Override
```

**After (2 surfaces, job framing):**

```
ModuleShell sub-nav (NAV_GROUPS trimmed to 2 items):
  Susun      → Papan Susun        /sch/$sekolah/jadwal              (index)
  Permintaan → Kotak Permintaan   /sch/$sekolah/jadwal/permintaan
```

- `/sch/$sekolah/jadwal` (index) becomes the **Papan Susun** grid editor (replaces today's Dashboard + Daftar + Slot).
- `/sch/$sekolah/jadwal/permintaan` is the new **Kotak Permintaan** inbox (replaces today's Override + Slot-Override).
- Removed top-level pages: `daftar`, `slot`, `slot.$name`, `override`, `slot-override`. These become **redirect stubs → `/sch/$sekolah/jadwal`** (or `/permintaan` for the override pair) so any deep links / muscle-memory URLs don't 404 — same redirect-stub pattern used in the school page-guides rollout.
- Bell-time definitions (the old Slot page) demote to an inline **"Atur jam pelajaran"** drawer link inside the Papan header — rare, per-school-year edit, not a top-level tab.
- The hub IA lives in a new **pure-data `lib/jadwalHub.ts`** module (mirrors the proven `lib/keuanganHub.ts`: NAV_GROUPS + active-section resolver + role-emphasis, no React, fully unit-testable). Roles drive *emphasis*, never visibility (`tata_usaha` + `operator` are primary write; `kurikulum` keeps the Terbit approval right).

## Screens & flows  (step-by-step)

### Screen 1 — Papan Susun (grid editor) · `/sch/$sekolah/jadwal`

**Purpose:** the ONE place TU builds the master timetable.

Key elements:
- **Rombel switcher** — a single `Select` at top, bound to the active Tahun Ajaran + Semester. TU never re-picks TA/kurikulum per slot; those are inherited from the Jadwal Pelajaran header *once*.
- **Week grid** — rows = jam ke-1..ke-N (from the bell-time / Slot Jadwal `tipe=Pelajaran` definitions), cols = Senin–Sabtu. `tipe=Istirahat/Upacara/Sholat` rows render as **locked grey bands** (non-clickable).
- **Click an empty cell → inline 2-field popover**: **Mapel** (Link → Mata Pelajaran), then **Guru** (Link → Pegawai, **auto-filtered by the Broker** to teachers who teach that mapel AND are free that hari+jam AND under JTM cap). Ruang optional, defaults to the rombel's homeroom. Enter saves. Two fields, two keystrokes-to-Tab, no page change.
- **Live conflict paint** — a cell turns **rose** the instant the chosen guru is already booked that hari+jam in ANY rombel, or the ruang collides; tooltip reads *"Bu Ani sudah di 8A jam ke-3"*. Powered by server `validate()` (truth, not a client guess).
- **Sisa worklist rail (right)** — *"Belum terisi: 7 slot · Bentrok: 2 · Mapel tanpa guru: 1"* + advisory *"Guru di bawah 24 JTM: Pak Joko"* [C6 graft]. Each line click-scrolls/filters the grid to those exact cells. This IS the broken-list, inline, **not a separate dashboard**. Fed by the one Query Report [C3 graft].
- **Bulk fill** — copy a cell, shift-select a range, paste to replicate [C2 graft].
- **StatCard strip reduced to 3** — `Terisi x/total`, `Bentrok`, `Belum Terbit` (reuse `@sekolahpro/ui` StatCard).
- **Single primary button: Terbitkan Jadwal** — disabled until Sisa worklist = 0; clicking runs the Workflow transition Draf→Terbit.
- **PageGuide** rewritten TU-first, one paragraph: *"Klik sel kosong → pilih mapel & guru → sel merah = bentrok → Terbitkan saat hijau semua."*

**Flow A — Build a fresh schedule:**
Pick rombel → empty grid appears → click Senin jam ke-1 → type "Mat" pick Matematika → Guru list auto-filters (Broker) to qualified-and-free pengampu, pick Pak Budi → Enter → cell green. Repeat per cell (or bulk-paste a column). Sisa worklist drops automatically. At 0 → **Terbitkan** activates → click → Workflow Draf→Terbit, jadwal goes live.

**Flow B — Conflict caught before publish:**
TU picks Bu Ani in 7A jam ke-3, but the Broker pre-filter normally hides her; if a clash slips through any other path, the cell turns red + tooltip on `validate()` rejection. TU clicks the rail line "Bentrok: 1" → grid jumps to the cell → swap guru → green.

### Screen 2 — Kotak Permintaan (substitution inbox) · `/sch/$sekolah/jadwal/permintaan`

**Purpose:** the request-driven half of the day, as a worklist — not a CRUD form.

Key elements:
- **Inbox list** — each row = one affected slot already resolved to *date + rombel + jam + mapel + guru-asli* (fed from **Absensi Guru** cross-module + manual add).
- **One-click "Cari Pengganti"** — opens a single dropdown pre-ranked by the **Broker** [C4 graft]: teachers FREE at that exact date/jam who teach the mapel and are under cap. Pick one → done. Behind the scenes it writes the `Slot Override` + `Jadwal Override` header in ONE transaction. TU never sees two doctypes.
- **Three-tab quiet filter** — *Libur · Pengganti · Tambahan*, each one-action: **Libur** = pick a date range (auto-voids slots), **Tambahan** = pick rombel+date+jam+mapel+guru. No separate header-then-child step.
- **Auto-notify toggle (default on)** — publishing a substitution fires the native Notification doctype to the substitute guru + wali kelas. Zero manual messaging.
- **"Hari ini" default filter** — inbox shows today's actionable items first; resolved items collapse out of view.
- Responsive layout so the corridor "Bu Ani izin" moment works on a phone [C5 *framing* only, no offline queue].
- **PageGuide** TU-first: *"Permintaan masuk di sini → klik Cari Pengganti → pilih guru kosong → selesai (guru otomatis diberi tahu)."*

**Flow C — Guru izin (request-driven):**
Bu Ani izin Selasa lands in Kotak Permintaan from Absensi Guru → TU opens the jam ke-3 row → clicks **Cari Pengganti** → dropdown shows only teachers free Selasa jam ke-3 who teach that mapel → pick Pak Joko → one click creates Slot Override + header + a Notification to Pak Joko & wali kelas.

**Flow D — Quick libur:**
Kotak Permintaan → tab **Libur** → pick a date range (e.g. 17 Agustus) → all slots in that range auto-void, no manual doctype creation; shows as a **Libur** badge on the grid for that date.

**Flow E — Check what's still broken:**
TU opens `/jadwal` → the Sisa rail immediately shows *"Belum terisi 7 · Bentrok 2 · Mapel tanpa guru 1"* → click each line to focus its cell. No separate dashboard hop.

## Data model / Frappe-native touchpoints  (hooks-first, native-first)

**Existing doctypes (reused as-is — confirmed against source):**

- **`Jadwal Pelajaran`** (parent, `JDW-.####`) — fields: `rombel` (Link→Rombongan Belajar), `semester` (Link→Semester), `tahun_ajaran` (Link→Tahun Ajaran), `kurikulum` (Link→Kurikulum), `is_aktif` (Check), `slots` (Table→Slot Jadwal), `sekolah` + `organisasi` (tenant anchors). TA/semester/kurikulum set ONCE here, inherited by all child slots.
- **`Slot Jadwal`** (istable child) — fields: `hari` (Select Senin–Sabtu), `jam_mulai`/`jam_selesai` (Time), `mata_pelajaran` (Link→Mata Pelajaran), `guru` (Link→Pegawai), `ruangan` (Link→Ruangan). ⚠️ **NOTE the real fieldname is `mata_pelajaran`, not `mapel`** — the winning design's prose says "Mapel" but the implementation must bind `mata_pelajaran`. The current web `JadwalRow`/`Row` types use a fictional flat `mapel`/`kelas` shape — those must be replaced by the real parent+child shape.
- **`Jadwal Override`** (parent, `OVR-.####`) — `rombel`, `tanggal` (Date), `tipe` (Select Libur/Pengganti/Tambahan), `alasan` (Data), `slots` (Table→Slot Override), tenant anchors. Unique (rombel, tanggal).
- **`Slot Override`** (istable child) — `jam_mulai`/`jam_selesai`, `mata_pelajaran`, `guru`, `ruangan`.
- **`Detail Penugasan Guru`** (child of Penugasan Guru) — `mata_pelajaran` + `rombongan_belajar` + `jumlah_jam` (JTM). **This is the competency + cap source for the Broker graft and the JTM tally graft.**
- **`Mata Pelajaran`**, **`Ruangan`** (infrastruktur), **`Pegawai`**, **`Rombongan Belajar`**, **`Absensi Guru`** — read sources.

**Existing server validation (reused — this is why C1 is cheap):**

- `JadwalPelajaran.validate()` already calls `_validasi_jam_slot`, `_validasi_overlap_slot`, `_validasi_guru_overlap`, and (when `is_aktif`) `_validasi_unik_aktif` + `_validasi_konflik_silang`.
- `akademik/utils/jadwal_conflict.py`: `find_guru_conflict`, `find_kelas_conflict`, `find_override_conflict` — the authoritative cross-document clash engine. The grid red-paint surfaces *these*.

**Net-new backend (hooks-first / native-first, minimal):**

1. **`tipe` Select on `Slot Jadwal`** (`Pelajaran\nIstirahat\nUpacara\nSholat`) — needed to render locked grey break/upacara bands. (Open question: or source bands from a separate jam-template.) DocType JSON + `bench migrate`.
2. **Whitelisted `cek_bentrok_slot(rombel, hari, jam_mulai, jam_selesai, guru, ruangan)`** on `jadwal_pelajaran.py` — a lightweight per-cell clash check (reuses `jadwal_conflict.py`) so the grid gets live paint without saving the whole doc on every keystroke. Frappe `@frappe.whitelist()`.
3. **Whitelisted `guru_kosong(rombel, mapel, date_or_hari, jam)`** — the **Broker** engine: returns teachers who teach the mapel (from Detail Penugasan Guru) ∩ free at that slot ∩ under JTM cap, ranked. Powers both the empty-cell Guru filter and Cari Pengganti. [C4 graft]
4. **Whitelisted `buat_pengganti(rombel, tanggal, jam, mapel, guru)`** — writes `Jadwal Override` + `Slot Override` in ONE transaction (the "TU never sees two doctypes" promise). [part of C1 core]
5. **Query Report "Konflik & Lubang Jadwal"** — the single SQL spine feeding StatCards + Sisa rail + grid paint + publish gate. Native Query Report (low-code). [C3 graft]
6. **Workflow on `Jadwal Pelajaran`** — states `Draf → Terkunci → Terbit`, with a guard blocking Terbit while the Query Report shows any unfilled/conflict slot. `kurikulum` holds the Terbit transition right. Native Workflow doctype + fixture.
7. **Notification (native)** — on `Slot Override` insert, alert substitute guru + wali kelas (email/system). Native Notification doctype + fixture; **no manual messaging code**.
8. **Frappe Calendar view on `Jadwal Override`** — reused for the read-only month-of-overrides glance (open question: native Calendar vs custom strip).
9. **Tenant registry** — any *new* anchored doctype (none planned beyond fields) must be registered in `tenant_registry.py DOCTYPES['SCHOOL']`; the `tipe` field addition does not. (Per Memory: new anchored doctypes silently leak tenant scope otherwise.)

**Frontend (app-school) reused UI:** `ModuleShell` (sub-nav trimmed to 2), `StatCard` (3 only), `PageGuide`, `FormField`/`FormSection` for the inline cell popover, `AttentionList` for the Sisa rail, `Badge`, `Button`. New pure-data `lib/jadwalHub.ts` mirrors `lib/keuanganHub.ts`.

## Bracket result table  (all 6)

| Competitor | Angle | Fit POV | Simpl | Edge | Vernon | Feas | Total /45 |
|---|---|---|---|---|---|---|---|
| **C1** | **Simplest-path** | **5** | **5** | **4** | **4** | **5** | **42** |
| C4 | Reimagine | 5 | 4 | 5 | 5 | 3 | 41 |
| C3 | Native-first | 4 | 4 | 4 | 5 | 5 | 39 |
| C2 | Power-user | 4 | 3 | 4 | 4 | 3 | 36 |
| C6 | Compliance/beban-jam | 3 | 3 | 4 | 4 | 2 | 32 |
| C5 | Mobile-first | 3 | 4 | 3 | 4 | 2 | 31 |

Notes: **C1** hits all four TU needs dead-on (click-to-fill 2-field grid, inline server-validated red-paint before publish, one-click Cari Pengganti writing both override doctypes + auto-notify, Sisa rail = broken-worklist in the same screen); 5→2 pages = lowest cognitive load. Only edge ding: complex multi-slot overrides punt to Desk and bell-time edit is demoted to an inline link. **C4** is the fewest-clicks-zero-error ideal but makes the grid read-only (fights bulk-build) and depends on clean competency/cap data + new methods (higher build cost). **C3** ships cheapest but the native Calendar embed gives two visual idioms and the worklist is only as fresh as the last report run — no live paint while typing. **C2** is the fastest pure bulk-entry but keyboard/⌘K-heavy raises onboarding for a non-power-user TU and the custom drag-drop grid is the priciest surface. **C6** is real headmaster value but is the compliance-officer job and can actively block the TU when a guru is legitimately under 24 jam. **C5** solves only the corridor-triage sliver while adding the most build cost (PWA + serviceWorker + background-sync + eventual-consistency window).

## Files likely touched

**Frontend — app-school (`apps/sekolahpro-web/apps/school/src/`):**

- `routes/sch.$sekolah.jadwal.tsx` — trim `NAV_GROUPS` to 2 items (Susun · Permintaan); pull IA from new `lib/jadwalHub.ts`.
- `routes/sch.$sekolah.jadwal.index.tsx` — **rewrite** from Dashboard into **Papan Susun** grid editor (rombel switcher, week grid, inline popover, Sisa rail, Terbitkan).
- `routes/sch.$sekolah.jadwal.permintaan.tsx` — **new** Kotak Permintaan inbox route.
- `routes/sch.$sekolah.jadwal.daftar.tsx`, `.slot.tsx`, `.slot.$name.tsx`, `.override.tsx`, `.slot-override.tsx` — **convert to redirect stubs** → `/jadwal` (or `/jadwal/permintaan` for the override pair).
- `components/jadwal/pageGuides.ts` — rewrite guides TU-first; collapse `JadwalGuideId` union to `papan` + `permintaan` (drop dashboard/daftar/override/slot-override/slot); update `__tests__/pageGuides.test.ts`.
- `lib/jadwalHub.ts` + `lib/jadwalHub.test.ts` — **new** pure-data IA (mirror `lib/keuanganHub.ts`).
- New components: `components/jadwal/PapanSusun.tsx`, `CellPopover.tsx`, `SisaRail.tsx`, `KotakPermintaan.tsx`, `CariPenggantiDropdown.tsx`, `JtmTally.tsx` (+ tests).
- `data/create-schemas.ts` — `JADWAL_PELAJARAN_FIELDS` reused for header create; remove the standalone slot/override create schemas if orphaned.
- Cross-module: a small read hook against **Absensi Guru** to feed the Kotak inbox.

**Backend — sekolahpro (`apps/sekolahpro/sekolahpro/akademik/`):**

- `doctype/slot_jadwal/slot_jadwal.json` — add `tipe` Select (+ `bench migrate`).
- `doctype/jadwal_pelajaran/jadwal_pelajaran.py` — add whitelisted `cek_bentrok_slot`, `guru_kosong`, `buat_pengganti` (reusing `jadwal_conflict.py`); + `FrappeTestCase` in `test_jadwal_pelajaran.py`.
- `utils/jadwal_conflict.py` — extend with the Broker free-and-qualified query (or a sibling `jadwal_broker.py`).
- New native artefacts (fixtures): **Workflow** on Jadwal Pelajaran (Draf→Terkunci→Terbit), **Notification** (substitute + wali kelas), **Query Report** "Konflik & Lubang Jadwal", **Calendar** view on Jadwal Override. Add to `sekolahpro/fixtures/` + hooks export.
- `tenant_registry.py` — verify scope (no new anchored doctype expected; field-only change).

**Docs:** `docs/domains/jadwal/` README + an ADR for the 5→2 collapse and the override-doctype-hiding decision.

## Open questions for the human

1. **`tipe` field on Slot Jadwal.** It does not exist today; the locked grey break/upacara bands need it. Add `tipe` Select (Pelajaran/Istirahat/Upacara/Sholat) to Slot Jadwal now, or render bell-time bands from a separate jam-template source?
2. **Per-cell live paint vs full-doc save.** The controller validates the *whole* Jadwal Pelajaran doc on save, not one slot. Recommend a lightweight whitelisted `cek_bentrok_slot(...)` for per-cell checks (net-new backend) — confirm vs accepting a full-doc save per cell.
3. **Where does "active period" come from?** Jadwal is *top-level*, NOT under the akademik `$ta` hub. The Papan rombel-switcher must scope to the active Tahun Ajaran + Ganjil/Genap — confirm the source (Pengaturan singleton? a period picker on the Papan header?).
4. **Workflow / publish rights.** Workflow (Draf→Terkunci→Terbit) is net-new. Does `kurikulum` keep the Terbit approval right (judge note says yes) or can `tata_usaha`/`operator` self-publish a green grid? This decides whether Terbitkan is a Workflow transition or a plain `is_aktif` flip.
5. **Notification recipients.** Auto-notify needs a wali-kelas relation per rombel and a guru→User/email channel. Confirm Rombongan Belajar carries `wali_kelas` and Pegawai has a system user / email, else the toggle silently no-ops.
6. **Broker data dependency.** Cari Pengganti ranking depends on Detail Penugasan Guru competency. If competency is sparse, degrade to "free teachers only" (judge-acceptable) or block substitution until mapped?
7. **Escape hatch.** Killing the standalone Slot Override + Slot Jadwal editors punts complex multi-slot overrides and bell re-timing to the Frappe Desk form. Confirm the Desk hatch is acceptable, or must an inline "Atur jam pelajaran" editor ship in v1?
8. **Month-of-overrides view.** Reuse the native Frappe Calendar on Jadwal Override (cheap, but two visual idioms — the exact thing the judge dinged C3 for) or build a custom strip inside Kotak Permintaan?