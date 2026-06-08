# Pesan Tournament — POV: Tata Usaha (TU)

> Design-only plan. Output of a 4-competitor design bracket judged AS the TU front-desk
> operator. NOT implemented. Run `implement plan` / `full cycle` only after human approval.
> Date: 2026-06-08 · Module: Pesan · Bracket: C1 C2 │ C3 C4 → SF → FINAL

## POV brief — job-to-be-done

TU = school front desk. Dominant daily verb is **KIRIM, not BALAS**: tagihan reminders,
jadwal changes, document requests, official pengumuman all flow OUT in volume to specific
audiences. Today that surface **literally does not exist** — verified in
`PesanComposeModal.tsx`, the only "Pesan Baru" button merely creates a `Contact Inbox
SekolahPro` row (a fake outbound that LOGS inbound). "Good" for TU = nothing waiting to go
out, reply in 2 clicks with a template, broadcast to the right audience (per-rombel /
semua-wali / penunggak) without exporting a spreadsheet.

## Winner — TU-C4 "Reimagine" (Final 41/45 · SF-B 42/45)

**"Pusat Pesan" — a KIRIM-first outbound communications desk that demotes the inbox to a
"Masuk" lane.** Stop calling this module "Inbox"; rebuild it so the primary verb is "Kirim
Pengumuman ke audiens" and the inbound public-contact list becomes a secondary lane.

### Why it won (judge rationale, AS TU)

The dominant job is sending, and every other angle just polished the inbox (a small inbound
lane). C4 reframes the landing into a KIRIM-first desk with a 3-step **audience → template →
send** composer (live recipient-count badge kills the spreadsheet), plus a **Riwayat** tracker
with per-recipient delivery status and resend-failed — the proof-of-delivery the Kepsek
actually demands, which the fire-and-forget modal can never give. It keeps templated 2-click
replies via "Sisipkan Template" in the demoted-but-kept Masuk lane, so inbound triage isn't
lost. Vernon: native Email Template for merge-tags, only **ONE** new tenant-registered doctype
(`Pesan Broadcast`) with a `hooks.py` `on_submit` fan-out into the existing append-only Mobile
Outbox ledger + native scheduler — vs C2's heavier 3 new doctypes + a hand-rolled template
that rejects native Email Template.

## Key screens / flows

1. **Pusat Pesan — Beranda Desk** (replaces the split-pane as the landing). Primary button
   "Buat Pengumuman" + 4 StatCards reframed OUTBOUND-first (Terkirim hari ini / Terjadwal /
   Gagal-perlu-ulang / Masuk belum dibalas). Two SectionCard lanes: "Keluar" (recent +
   scheduled broadcasts w/ delivery counts) and "Masuk" (existing Contact Inbox).
   ModuleShell sub-nav: Beranda · Buat · Riwayat · Template · Masuk.
2. **Buat Pengumuman — 3-step composer** (the new heart, NOT a logging modal). Step 1
   *Audiens*: SearchableSelect builder — Semua Wali / Per Rombel / Per Kelas-Tingkat /
   Penunggak SPP / Pilih manual, with a live `→ 312 penerima` badge. Step 2 *Isi*: native
   Email Template picker pre-fills subject+body w/ merge tags `{{nama_wali}}`
   `{{nama_siswa}}` `{{nominal}}`, editable; channel chips (WA / Email / Notif). Step 3
   *Kirim*: review + "Kirim sekarang" or "Jadwalkan". Submit creates ONE `Pesan Broadcast`
   doc that fans out Mobile Outbox rows.
3. **Riwayat Pengiriman** — broadcast tracker table (judul, audiens, jadwal, status,
   terkirim/total, gagal). Row → per-recipient delivery detail from Mobile Outbox + native
   Email Queue. "Kirim ulang yang gagal" re-queues only failed rows (idempotency_key dedup).
4. **Masuk** — the OLD split-pane inbox, demoted to a sub-nav tab + upgraded: reply box gets
   "Sisipkan Template"; the renamed `PesanComposeModal` → "Catat Pesan Masuk" walk-in logging
   lives here (its mislabeling as the primary button is what this reframe fixes).
5. **Template Pesan** — manage reusable native Email Template rows + signature.

## Grafted from runners-up

| Idea | From |
|------|------|
| **Bulk multi-select on Masuk lane** — header checkbox → select mode, Shift-range, bulk "Balas dengan Template (N)" / "Tandai Selesai (N)", `e` to resolve + auto-advance. Replaces crude all-or-nothing `handleMarkAll`. | TU-C2 |
| **Audience-as-descriptor resolved at SEND time** (`audiens_type` + `audiens_filter` JSON, never a copied recipient snapshot) — count badge + server fan-out re-run the same live query. Reuse `lib/beranda/scope.ts` + `derive.ts` (rombel membership, `computeTunggakanBesar`). | TU-C1 |
| **Route EMAIL channel through native Notification + Email Queue** for per-recipient delivery truth (no custom table) + a size-threshold native Workflow approval gate; keep Mobile Outbox for the WA channel only. | TU-C3 |

## Bracket result

| Design | Angle | Round | Score |
|--------|-------|-------|-------|
| **TU-C4** | Reimagine — Pusat Pesan KIRIM-first desk | **Winner** | Final 41 (fit5 simp4 edge4 vernon5 feas4) · SF-B 42 |
| TU-C2 | Power-user console (keyboard-first, bulk, ⌘K) | Final | SF-A 40 (fit5 simp3 edge5 vernon4 feas3) |
| TU-C3 | Native-first (Notification/Email Template/Workflow/Email Queue) | SF | Lost SF-B (Vernon-purer but treats job as clear-an-inbox) |
| TU-C1 | Simplest-path (one screen, mode-toggle modal) | SF | Lost SF-A (no bulk, mode-toggle mis-send hazard) |

## Files likely touched

- `apps/school/src/routes/sch.$sekolah.pesan.tsx` — CONVERT to thin ModuleShell **layout**
  route + `<Outlet/>` (mirror `sch.$sekolah.aset.tsx`); redirect old deep-link to Beranda tab.
- `…/sch.$sekolah.pesan.index.tsx` — NEW Beranda Desk landing.
- `…/sch.$sekolah.pesan.buat.tsx` — NEW 3-step composer → creates one `Pesan Broadcast`.
- `…/sch.$sekolah.pesan.masuk.tsx` — NEW: OLD split-pane moved here + template insert + C2 bulk.
- `…/sch.$sekolah.pesan.riwayat.tsx` — NEW broadcast tracker + resend-failed.
- `…/sch.$sekolah.pesan.template.tsx` — NEW Email Template CRUD + signature.
- `apps/school/src/lib/pesanRole.ts` — NEW (clone `keuanganRole.ts` engine; presentation-only).
- `apps/school/src/lib/pesan/audience.ts` — NEW descriptor + resolver (reuse beranda helpers).
- `apps/school/src/lib/pesan/broadcast.ts` — NEW hooks over `Pesan Broadcast` + `resolve_pesan_audience`.
- `apps/school/src/lib/pesanNav.ts` — NEW `PESAN_NAV_GROUPS` for ModuleShell.
- `apps/school/src/components/pesan/{AudienceBuilder,TemplatePicker,BulkActionBar}.tsx` — NEW.
- `apps/school/src/components/pesan/PesanComposeModal.tsx` — rename intent → "Catat Pesan Masuk".
- `apps/school/src/components/guide/miscPageGuides.ts` — rewrite pesan guide (avoid bug-032 KPI-label getByText collision).
- **Frappe BE (separate repo)** — NEW `Pesan Broadcast` doctype + `on_submit` fan-out in
  `hooks.py` + register in `tenant_registry.py` `DOCTYPES['SCHOOL']` + whitelisted
  `resolve_pesan_audience(audiens_type, audiens_filter)` + optional Workflow/Email Template fixtures.

## Data model sketch

**EXISTING (reuse, no schema change):** `Contact Inbox SekolahPro` (now Masuk lane only,
+bulk status patches) · `Mobile Outbox Entry` (REUSED dispatch ledger; new op `send_broadcast`
alongside `reply_contact_inbox`, one row/recipient, `response.broadcast`) · native `Email
Template` (bodies + reply snippets + signature, merge tags) · native `Notification` + `Email
Queue` + `Email Queue Recipient` (graft C3 email delivery truth) · `Rombongan Belajar` /
`Anggota Rombel` / `Tagihan` (READ-only audience resolution).

**NEW (must tenant-register):** `Pesan Broadcast` — judul, audiens_type
(semua_wali|per_rombel|per_kelas|penunggak|manual), audiens_filter (JSON **descriptor not
snapshot**), template (Link Email Template), isi, channels (WA|Email|Notif), jadwal (Datetime
nullable), status (Draf|Menunggu Persetujuan|Terjadwal|Terkirim|Sebagian-gagal),
total_penerima, terkirim_count, gagal_count, workflow_state, sekolah (Link). *Justification:*
Mobile Outbox is per-message append-only (no campaign state/scheduling); Notification has no
audience-filter/stats slot. `on_submit` fans out + hands scheduled sends to native scheduler.
Plus whitelisted `resolve_pesan_audience` (no storage, server is source of truth) + optional
Workflow fixture (size-threshold Kepsek approval).

## Open questions for the human

1. Is the WA/Email gateway consuming Mobile Outbox actually wired/live in BE? If not,
   "Terkirim" counts are aspirational. (Not in web repo.)
2. Email Template tenant-scoping: native Email Template has no `sekolah` field — one site per
   school, or shared site row-level scoping? Decides leak risk.
3. Is wali contact reachable from Anggota Rombel server-side for `resolve_pesan_audience`, and
   does "penunggak" map to a concrete Tagihan field?
4. Approval gate threshold N (graft C3): routine sends should NOT hit approval — propose
   N≈100, confirm with stakeholders.
5. MVP slicing: ship composer + `Pesan Broadcast` + Riwayat first, defer scheduling +
   resend-failed? Or is a scheduled tagihan reminder day-1?
6. Does demoting `/pesan` need a feature flag / staged rollout? Confirm redirect target +
   that the parent/student read-only `/pesan` route stays untouched.
7. Is there an in-app push pipeline? If not, hide the "Notif aplikasi" channel chip.

## Reconcile note

This is **one** role's slice of a single role-sliced module. See
`2026-06-08-pesan-tournament-reconcile.md` for how the TU / Guru / Kepsek winners merge into
ONE module (single 3-way role-branch + shared libs + one merged `Pesan Broadcast` doctype) —
NOT three forks.
