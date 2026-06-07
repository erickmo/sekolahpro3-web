# Jadwal Tournament Plan — POV Guru (Teacher) (2026-06-07)

> Status: ready for `implement plan`. Frappe hooks-first / native-first. UI strings Bahasa Indonesia, code & comments English. Purely **additive** for guru — the kurikulum builder routes (`/daftar`, `/slot`, `/override`, `/slot-override`) are untouched.

## POV brief (job-to-be-done)

A Guru never builds a timetable and never wants the master grid. Their entire relationship with Jadwal is three questions, usually answered **on a phone while walking between classes**:

1. **What do I teach next** — jam, mapel, rombel, ruang?
2. **Did anything change** since I last looked — ruang pindah, kelas dibatalkan, am I now a pengganti?
3. Two secondary jobs: **file izin / minta tukar** in seconds, and **trust my JTM** (jam tatap muka) for sertifikasi.

The current module is a builder's CRUD for the `kurikulum` role: a 30-cell rombel-grid, a slot editor, and a separate Jadwal Override / Slot Override list. For a Guru with ~4 scattered slots, that is 100% noise — they have to mentally diff a grid to find their slots and cross-reference a second list to learn a class got cancelled. **The JTBD is "stay in sync with the next thing I have to teach," not "browse the master timetable."**

## Winner: C4 (Reimagine) — why it won

C4 throws away the grid mental model entirely and replaces it with a personal **Agenda Mengajar Saya** feed: a chronological, phone-first stream of MY teaching events, today pinned at top, anchored on a live `Sekarang / Berikutnya` marker. The signature move:

> **The override IS the notification IS the calendar entry** — not three separate places to check.

Every disruption (`ruang pindah`, `dibatalkan`, `Anda pengganti`, `tambahan`) is rendered **inline as a diffed event on my own timeline** (e.g. `Ruang B-2 → Lab IPA`), never buried in a standalone override admin list.

Judge rationale (quoted):

> "I'm a guru with four slots scattered across a thirty-cell master grid I never built and never want to see. My whole relationship with the timetable is: what do I teach next, where, and did anything change since I last looked — usually checked on my phone walking between classes. C4 is the only design that throws away the grid mental model entirely and gives me a chronological 'Agenda Mengajar Saya' feed where my next class is pinned at the top and every disruption — ruang pindah, dibatalkan, 'Anda pengganti' — is rendered inline as a diffed event on that same timeline instead of buried in a separate override list I'd have to go hunt for. That single move ('the override IS the notification IS the calendar entry') is exactly how my brain works: I don't want to cross-reference three places, I want one stream that already shows me what moved. The izin/tukar request launches in 2 taps from the event itself so I never re-type rombel/jam/mapel, my JTM is a live number I can actually trust for sertifikasi, and when I'm assigned a pengganti it just appears on my feed with a push. C1 is the close runner-up and honestly tempting because it's even simpler and cheaper, but it skips the Detail-Slot view, the roster peek before I walk into a class I rarely teach, and the request tray that lets me confirm my izin actually landed — small things that matter on a real bad-traffic morning when I'm filing leave from the car. C4 keeps everything phone-first and Frappe-native (Calendar view, Query Report, Notification, Workflow) and is purely additive, so the kurikulum keeps their builder untouched while I finally get a screen that's mine."

Why it beat the runner-up **C1** (41 vs 42): C1 gives nearly the same glance for the lowest cost, but skips the **Detail Slot** deep-view (with the roster peek before walking into a rarely-taught class), the **per-request tray** (so the teacher can confirm an izin actually landed), and clean handling of pengganti-assignment + bentrok visibility — the small things that matter on a bad-traffic morning. C4 wins on edges while staying just as phone-first and additive.

## Grafted ideas

Folded into C4 only where they sharpen — not dilute — the Guru POV:

- **[from C1] Pre-filled `Ajukan` FAB + hard route-wall.** A single floating `Ajukan` FAB pre-filled from the event it was tapped on, **plus a route guard that redirects guru-only users away from `/jadwal/daftar`, `/jadwal/slot`, `/jadwal/override`, `/jadwal/slot-override` entirely** — the builder surface literally does not exist for them, not just hidden in nav. (See Open Question on dual-role staff.)
- **[from C5] Offline PWA + web-push + staleness stamp.** Installable PWA + web-push so a room-move alert reaches the phone in-pocket with the app closed; a `Sekarang` countdown card and a `terakhir sinkron 07:14` staleness stamp. Mirror the existing `apps/attendance_station` manifest/service-worker. **Shipped as Tier 4 (follow-up)** — v1 ships system-alert + email Notification; true web-push/VAPID is the heavier, riskier add.
- **[from C3] Native Query Report + Number Card for JTM.** Lean on a native Frappe **Query Report `Beban Mengajar Guru`** + Number Card for the JTM count and PDF export, instead of any custom React aggregation — keeps the certification number always-fresh and low-code.
- **[from C6] Printable `Rekap JTM` export.** A printable per-semester `Rekap JTM` with **linearitas** (mapel-sesuai-sertifikat) and a `kepala_sekolah` sign-off block for the Dapodik/sertifikasi berkas — grafted as **one export screen**, never the module's hero.
- **[dropped — C2] ⌘K verb console.** Rejected. Wrong persona (phone-in-hallway, not desk-with-keyboard), and our own memory says `financeActions` hrefs must be plain routes — query-arg/verb-parsing actions break route matching. Even the nav-only variant adds at-desk surface a between-classes teacher won't touch.

## Proposed IA / submenu

New **guru-scoped** surface mounted under the existing Jadwal module. Kurikulum's IA is unchanged.

```
/sch/$sekolah/jadwal                         (existing kurikulum dashboard — untouched)
  /daftar /slot /slot/$name /override /slot-override   (existing builder — route-walled for guru-only)

/sch/$sekolah/jadwal/saya                    NEW — Agenda Mengajar Saya (guru landing)
/sch/$sekolah/jadwal/saya/$slot              NEW — Detail Slot Saya (read-only deep view)
/sch/$sekolah/jadwal/saya/permintaan         NEW — Permintaan Saya (izin/tukar tray)
  Request Sheet                              NEW — bottom-sheet MODAL, not a route (launched from any event)
```

**Guru sub-nav** (rendered via `ModuleShell` `navGroups`, only the two items below when the resolved role is `guru`):

```
Agenda Saya   ->  /sch/$sekolah/jadwal/saya
Permintaan    ->  /sch/$sekolah/jadwal/saya/permintaan
```

**Landing-routing rule:** when a user whose resolved role is `guru` (and not kurikulum) hits `/sch/$sekolah/jadwal`, redirect to `/sch/$sekolah/jadwal/saya`. Kurikulum / dual-role staff keep the builder dashboard. The guard reuses the `genericRole` mapping (`guru` key already exists in `apps/school/src/lib/genericRole.ts`).

## Screens & flows

### Screen 1 — Agenda Mengajar Saya (`jadwal/saya`, new guru landing)
Replaces the builder dashboard as the Guru's home: one scrollable, phone-first timeline of MY events, today pinned, anchored on a live `Sekarang / Berikutnya` marker.

- **Sticky `Berikutnya` hero card** — next slot I teach (jam, mapel, rombel, ruang) + a **Perubahan ribbon** if that slot was moved/cancelled/I'm pengganti, diffed inline (`Ruang B-2 → Lab IPA`). Carries the C5 countdown (`mulai dalam 12 menit`).
- **Vertical day timeline** (Senin..Sabtu, segmented) — past slots dimmed, current slot ring-highlighted. Reads my events from the `JTM Saya` data source filtered to my guru.
- **Per-event change chips** — tone `danger` `Dibatalkan`, amber `Ruang pindah`, violet `Anda pengganti`, neutral `Tambahan`. Every Jadwal Override / Slot Override touching my slots surfaces HERE.
- **Overflow action per event** — `Ajukan Izin / Minta Pengganti` (2-tap, opens Request Sheet pre-filled with that slot). The C1 **FAB** is the always-visible shortcut to the same sheet for the next slot.
- **StatCard strip** (compact, 2-up on phone) — `JTM Minggu Ini` live count + `JTM / target sertifikasi` progress, sourced from the native Query Report.
- **Staleness stamp** (C5) — `terakhir sinkron 07:14`.
- **PageGuide `Cara pakai Agenda Saya`** role-tagged `guru` — explains the feed, the change ribbons, the JTM counter.

### Screen 2 — Detail Slot Saya (`jadwal/saya/$slot`)
Read-only deep view of one teaching event with full change history + one-tap actions. Replaces sending a teacher into a slot CRUD editor they cannot edit anyway.

- **Header** — mapel · rombel · ruang · jam, with an effective-state banner if an override applies (original vs current, who changed it, kapan).
- **Daftar Anggota Rombel quick peek** (read-only, from `siswa/anggota_rombel`) — know the class before walking in.
- **Riwayat Perubahan timeline** — Jadwal Override + Slot Override entries affecting this slot, newest first, with `alasan`.
- **Primary buttons** — `Ajukan Izin (kelas ini)` and `Minta Tukar Jam`, both launch the Request Sheet scoped to this slot.
- **Secondary** — `Tambahkan ke Kalender` (ICS / Google Calendar export of just my schedule).

### Screen 3 — Permintaan Saya (`jadwal/saya/permintaan`)
My own tray of izin/tukar requests with live workflow status — so I trust the request landed and see when kurikulum approves + who the pengganti is.

- **StatCard row** — `Menunggu Persetujuan`, `Disetujui`, `Ditolak` counts.
- **List of my Permintaan Jadwal docs** — Workflow state badge (`Diajukan → Disetujui / Ditolak`) and the assigned pengganti name once filled.
- **Per card** — tanggal, slot terdampak (mapel/rombel/jam), tipe (Izin / Tukar), alasan, approver note.
- **`Ajukan Permintaan Baru`** button (also reachable from any event).
- **PageGuide** step tagged `guru` explaining the 2-tap flow and what each status means.
- **Sub-link:** `Rekap JTM` (C6 graft) — opens the printable per-semester JTM ledger with linearitas + kepala_sekolah sign-off block (export screen, not hero).

### Screen 4 — Request Sheet (bottom-sheet modal, not a route)
The 2-tap leave/substitute request, launched from an event so it is pre-contextualized; the teacher never types rombel/jam/mapel.

- **Pre-filled read-only context block** — the slot tapped from (tanggal, jam, mapel, rombel).
- **`FormSection` + `FormField`** — Tipe (segmented: `Izin tidak hadir` / `Minta tukar jam`), Tanggal (defaults to the slot's date), Alasan (required short text), optional `Usulkan pengganti` guru picker.
- **Single primary `Kirim`** → creates a `Permintaan Jadwal` doc, fires a Notification to kurikulum, enters Workflow state `Diajukan`.
- **Confirmation toast** + the originating event immediately shows a pending `Izin diajukan` chip.

### Flows (step-by-step)

1. **Glance-before-class (80% case):** Guru opens app between classes → lands on `/jadwal/saya` → `Berikutnya` hero shows next slot, jam, ruang, and a `Ruang pindah → Lab IPA` ribbon if changed → done in under 5 seconds, zero taps.
2. **Change alert → confirm:** Kurikulum edits a Jadwal Override moving the teacher's room → Frappe Notification (system alert + email; web-push in Tier 4) fires to that guru's `user_id` → teacher taps notification → deep-links to **Detail Slot Saya** showing original vs new room + alasan → reassurance, no hunting.
3. **2-tap leave:** Guru taps overflow on tomorrow's 3rd slot → Request Sheet opens pre-filled → picks `Izin tidak hadir`, types alasan, `Kirim` → Permintaan Jadwal created, Workflow=`Diajukan`, Notification to kurikulum → event shows pending `Izin diajukan` chip.
4. **Pengganti assignment lands:** Kurikulum approves + assigns a pengganti via Workflow → original teacher's request flips to `Disetujui` with pengganti name; the assigned pengganti gets a Notification and a violet `Anda pengganti` event **auto-appears on THEIR `/jadwal/saya` timeline**.
5. **Trust my JTM:** Guru opens `/jadwal/saya` → JTM StatCards show live week total + progress toward certification target (Slot Jadwal minutes minus cancelled overrides) → taps card → Query Report breakdown per mapel/rombel for the certification form → `Rekap JTM` PDF export for the berkas.

## Data model / Frappe-native touchpoints

**Reads (existing, read-only for guru):**
- **`Jadwal Pelajaran`** (header) — filtered to schedules whose `Slot Jadwal` rows reference this guru.
- **`Slot Jadwal`** (child; confirmed fields `hari`, `jam_mulai`, `jam_selesai`, `mata_pelajaran`, `guru`, `ruangan`) — source of MY events and JTM minute sums. JTM minutes derived from `jam_selesai − jam_mulai` (no `durasi_menit` field exists; see Open Questions).
- **`Jadwal Override` + `Slot Override`** (existing) — re-surfaced as **inline diffed change events** on MY timeline, matched to me via the affected slot's `guru`. `Slot Override` is an istable child (no tenant fields — per memory, children carry no tenant scoping).
- **`siswa/anggota_rombel`** — read-only roster peek on Detail Slot Saya.
- **Guru identity** — resolved via `Pegawai` link to the logged-in `user_id`; role key `guru` (already in `genericRole.ts`) gates the `/jadwal/saya` surface.

**New doctype — `Permintaan Jadwal`** (anchored, school-scoped):
| field | type | notes |
|---|---|---|
| `guru` | Link → Pegawai | the requester |
| `slot_jadwal` | Link → Slot Jadwal | the affected slot (pre-filled) |
| `tanggal` | Date | defaults to slot date |
| `tipe` | Select: `Izin` / `Tukar` | |
| `alasan` | Small Text | required |
| `usulan_pengganti` | Link → Pegawai | optional, teacher's suggestion |
| `pengganti_final` | Link → Pegawai | set by kurikulum on approval |
| `catatan_approver` | Small Text | approver note |
| `sekolah` / `organisasi` | (tenant fields) | per anchored-doctype convention |

> **MUST be added to `tenant_registry.py` `DOCTYPES['SCHOOL']`** (currently lists `Jadwal Pelajaran`, `Jadwal Override`, `Pegawai`; `Permintaan Jadwal` is absent) — otherwise tenant scoping silently leaks (memory: frappe-new-doctype-tenant-registry).

**Native Frappe primitives (hooks-first / low-code):**
- **Calendar view** on `Slot Jadwal` scoped by `guru = session.user` — optional native desk view. **Recommendation:** the phone glance is a pure-React feed reading the Query Report data; do NOT make the between-classes glance depend on an embedded native-Calendar iframe (C3's seam). Native Calendar stays an at-desk extra.
- **Query Report `JTM Saya` / `Beban Mengajar Guru`** (C3 graft) — sums Slot Jadwal minutes grouped by mapel/rombel, filtered to current guru; minus cancelled overrides. Powers the StatCards + the PDF export. **Number Card** for the headline JTM count.
- **Notification doctype** — alerts on Jadwal Override / Slot Override / Permintaan Jadwal changes routed to the affected guru's `user_id` (system + email; web-push = Tier 4 / C5 graft). Verify a delivery channel is actually wired (Open Question).
- **Workflow doctype** on `Permintaan Jadwal` (`Diajukan → Disetujui / Ditolak`), approver = kurikulum (role configurable — Open Question).
- **Fixtures:** workflow + workflow states + notification templates + the Query Report shipped as fixtures so they migrate cleanly; new doctype JSON under `sekolahpro/akademik/doctype/permintaan_jadwal/`.

**Reused UI:** `ModuleShell` (guru-scoped sub-nav: Agenda Saya / Permintaan Saya), `StatCard` (JTM + request counts), `PageGuide` (guru-tagged steps via existing `jadwal/pageGuides.ts` + `schoolGuideRole.ts`), `FormSection` / `FormField` (request sheet).

## Bracket result table

| competitor | angle | fit | simpl | edge | vernon | feas | total/45 |
|---|---|---|---|---|---|---|---|
| **C4** | Reimagine — kill the grid, personal Agenda feed; every change a diffed inline event | 5 | 5 | 5 | 4 | 4 | **42** |
| C1 | Simplest-path — read-only day-rail + JTM card + one Ajukan button | 5 | 5 | 3 | 4 | 5 | 41 |
| C5 | Mobile-first — installable offline PWA lens, push the moment a room moves | 5 | 3 | 4 | 3 | 3 | 38 |
| C3 | Native-first — one role-adaptive Jadwal Saya from Calendar+Report+Notification+Workflow | 4 | 4 | 3 | 5 | 4 | 37 |
| C6 | Compliance/beban-jam — reframe the module as a JTM audit ledger for sertifikasi | 3 | 2 | 3 | 4 | 3 | 31 |
| C2 | Power-user — keyboard-first cockpit, ⌘K verb console, drag-drop swaps | 2 | 1 | 4 | 3 | 2 | 27 |

## Files likely touched

**Frontend — `apps/school` (additive):**
- `src/routes/sch.$sekolah.jadwal.saya.tsx` — NEW guru layout route (guru sub-nav + landing redirect from `/jadwal` for guru-only).
- `src/routes/sch.$sekolah.jadwal.saya.index.tsx` — NEW Agenda Mengajar Saya page (timeline + hero + StatCard strip + FAB + staleness stamp).
- `src/routes/sch.$sekolah.jadwal.saya.$slot.tsx` — NEW Detail Slot Saya.
- `src/routes/sch.$sekolah.jadwal.saya.permintaan.tsx` — NEW Permintaan Saya tray (+ Rekap JTM link).
- `src/routes/sch.$sekolah.jadwal.tsx` — add guru landing redirect to `/saya`; route-wall guard (C1 graft) for `/daftar /slot /override /slot-override`.
- `src/components/jadwal/AgendaTimeline.tsx`, `BerikutnyaHero.tsx`, `EventRow.tsx` (change chips/diff), `RequestSheet.tsx`, `RekapJtm.tsx` — NEW.
- `src/components/jadwal/pageGuides.ts` — add guru-tagged steps for Agenda Saya / Permintaan Saya.
- `src/lib/jadwal/agenda.ts` — NEW: resolve session→guru, fetch my slots + overlay overrides as diffed events, derive JTM minutes (read-only).
- `src/lib/jadwal/nav.ts` — NEW `GURU_NAV_GROUPS` (mirrors `orang/nav.ts` pattern); used by the saya layout's `ModuleShell`.
- (reuse) `src/lib/genericRole.ts` — `guru` key already present; no change expected.
- Tests: `__tests__/agenda.test.ts`, `nav.test.ts`, RequestSheet + EventRow component tests (RTL `afterEach(cleanup)` per memory).

**Backend — `apps/sekolahpro` (one new doctype + native fixtures):**
- `sekolahpro/akademik/doctype/permintaan_jadwal/` — NEW doctype JSON + `.py` controller (business logic in controller, NOT handler; <40-line methods).
- `sekolahpro/api/tenant_registry.py` — add `"Permintaan Jadwal"` to `DOCTYPES['SCHOOL']`.
- `sekolahpro/akademik/report/beban_mengajar_guru/` — NEW Query Report (JTM Saya) + Number Card.
- Fixtures: Workflow + Workflow States (`Diajukan / Disetujui / Ditolak`) for Permintaan Jadwal; Notification templates (override-changed, permintaan-status, pengganti-assigned) routed to guru `user_id`.
- `test_permintaan_jadwal.py` — FrappeTestCase (CI gate is `bench run-tests` unittest, NOT pytest — per memory); reuse `make_*_fixture` helpers; `make_tahun_ajaran_fixture` forces one active TA/sekolah.
- `bench migrate` after adding doctype + fixtures.

## Open questions for the human

1. **JTM source of truth.** Do admins already maintain certification JTM in a manual/Dapodik sheet? If so, label the live counter `indikatif` until reconciled, to avoid two conflicting numbers.
2. **Guru identity link.** Is every teacher's Frappe User reliably linked to a `Pegawai`, and does `Slot Jadwal.guru` link `Pegawai` (not `User`)? The entire `/jadwal/saya` filter depends on `session.user → Pegawai → guru slots`. Confirm the link field and 100% coverage.
3. **Notification delivery channel.** Is email configured per-tenant? Confirm we ship system-alert + email for v1 (web-push/VAPID = C5 Tier 4 follow-up). No channel = no change pushes.
4. **Pengganti approver role.** Who approves `Permintaan Jadwal` — `kurikulum`, `kepala_sekolah`, or per-school configurable? This fixes the Workflow transitions + Notification routing.
5. **JTM minutes derivation.** Confirmed Slot Jadwal has only `jam_mulai`/`jam_selesai` (no `durasi_menit`). Confirm we compute minutes from those, and how a cancelled override subtracts from the total.
6. **Calendar embed vs React feed.** Embed the native Frappe Calendar (iframe/theming/mobile-sizing risk per C3) or render a pure-React feed over the same Query Report data? Recommend pure-React for the glance; native Calendar as an optional desk view only.
7. **Route-wall scope (C1 graft).** Hard-redirect guru away from `/daftar /slot /override` (404/redirect) or merely hide them from nav? A hard wall is cleanest, but breaks **dual-role staff** who are both guru AND kurikulum — likely gate the wall on `guru AND NOT kurikulum`.