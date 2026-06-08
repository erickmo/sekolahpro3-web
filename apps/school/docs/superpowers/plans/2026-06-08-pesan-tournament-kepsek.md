# Pesan Tournament — POV: Kepala Sekolah (Headmaster)

> Design-only plan. Output of a 4-competitor design bracket judged AS the headmaster.
> NOT implemented. Run `implement plan` / `full cycle` only after human approval.
> Date: 2026-06-08 · Module: Pesan · Bracket: C1 C2 │ C3 C4 → SF → FINAL

## POV brief — job-to-be-done

Kepsek runs the school. Re: Pesan = (1) broadcast **official** school-wide announcements
(libur, rapat wali, kebijakan) under their authority; (2) **oversee** communication
health/SLA — is anything inbound unanswered/overdue? are staff replying? what is response
time? (3) **approve/sign** sensitive official outbound before it goes out. Little time → wants
zero-click status ("apakah komunikasi sekolah sehat hari ini?"), an authoritative one-tap
broadcast, and a gate so nothing official goes out unreviewed. "Good" = a glance shows comms
health (unanswered, oldest-waiting, overdue SLA) + 3 green/red signals + one-tap official
broadcast + approval queue. Pattern from prior tournaments: zero-click status cards +
compliance-GATE + approval desk. Pain today: no oversight view, no SLA, no approval, no
official-broadcast authority surface.

## Winner — KEPSEK-C3 "Native-first" (Final 42/45 · SF-B 42/45)

**A zero-click oversight cockpit that replaces the staff split-pane for the kepsek-primary
view, built almost entirely from NATIVE Frappe primitives** (fixture-able, hooks-first). Three
SLA signals answer "apakah komunikasi sehat hari ini?". One-tap official broadcast = native
Notification + Email Template fixture queued into the existing Mobile Outbox by a `hooks.py`
doc_event. Sensitive outbound passes a native **Workflow gate** (Draft → Menunggu Kepsek →
Disetujui) on a tenant-registered `Pengumuman Sekolah` doctype, approved with the **exact
`apply_workflow` + `RejectModal` pattern already shipped in the Kelas Kepsek desk**.

### Why it won (judge rationale, AS Kepsek)

The non-negotiable is an **UNBYPASSABLE compliance-GATE** — nothing official leaves under the
Kepsek's name unreviewed — and C3 is the only design with the right architecture. It binds a
native Frappe Workflow to a purpose-built tenant-registered doctype where `apply_workflow` is
the sole authority, so a draft physically cannot reach "sent" without a Kepsek Approve. It
reuses the exact `MejaPersetujuanKelas.tsx` + `useFrappeMutation("frappe.model.workflow.
apply_workflow")` + `RejectModal` stack already shipped and verified across three siswa
approval routes — `kelasApproval.ts` states verbatim that "apply_workflow stays the sole
authority", refuting C4's claim that the workflow caller is a fake/no-op. C1 and C4 instead
bolt a draft/approval lifecycle onto `Mobile Outbox Entry` (append-only send queue) where the
gate is a soft status the gateway must be trusted not to auto-send — C1 admits "official drafts
could leak out" without a backend guard; **an approval gate that might leak is not a gate the
Headmaster can trust.** C3 also gives true oversight: a backend aggregation over the FULL
Contact Inbox for the three SLA signals, where C1/C4 compute health only from the first ~100
client-loaded rows (the oldest unanswered message could sit on row 101 — an audit blind spot).
It removes the reply box ("Kepsek oversees, not desk work"). Wins decisively on Fit (5) and
Vernon (5), the two pillars the role depends on.

## Key screens / flows

1. **Panel Kepala Sekolah** (Pesan index, role=kepsek). Lands here instead of the split-pane.
   One-sentence **verdict crown** ("Komunikasi sekolah SEHAT hari ini" / "PERLU PERHATIAN" /
   "TERLAMBAT", graft C4) above three zero-click signal StatCards — Belum Dibalas (rose if >0),
   Terlama Menunggu (amber, shows oldest-waiting age), Lewat SLA (rose count past the response
   window). Below: "Kesehatan Komunikasi" card w/ 7-day response-time sparkline + per-staff
   reply tally + prominent "Pengumuman Resmi" button. **No reply textbox.**
2. **Komposer Pengumuman Resmi** (Modal). Pick native Email Template / Notification (Libur,
   Rapat Wali, Kebijakan — fixtures), pick audience (Semua Wali / Per-Rombel / Per-Jenjang),
   edit body, "Kirim Sekarang". Shows recipient-count preview ("akan terkirim ke 412 wali").
3. **Meja Persetujuan Pesan** (approval queue). 2-pane desk mirroring Kelas MejaPersetujuan:
   left = `Pengumuman Sekolah` rows where `workflow_state == 'Menunggu Kepsek'`; right = Kartu
   Tinjau (body, audience, recipient count, drafter). "Setujui & Kirim" (`apply_workflow`
   "Approve" → doc_event queues send) or "Tolak" (RejectModal w/ reason).
4. **Inbox staff** (unchanged) — reachable via ModuleShell sub-nav, secondary tab; existing
   reply / Tandai-Selesai preserved.
5. **PanelTindakLanjut** — AttentionList of overdue-SLA inbound with a **"Tugaskan"** (delegate
   to staff owner) action, NOT "Balas" (graft C4 — keeps Kepsek at governance altitude).

## Grafted from runners-up

| Idea | From |
|------|------|
| **Phase the build** — ship a Kepsek "Pengawasan" oversight tab + repurposed broadcast modal onto the EXISTING route via ModuleShell sub-nav in v1 (zero new route, reuse `PesanComposeModal`); land the heavier `Pengumuman Sekolah` Workflow doctype as v2. | KEPSEK-C1 |
| **Server-side SLA config** — store `sla_jam_balas` in a tenant-registered `Pengaturan Pesan` Single (not a hardcoded constant); back the three signals + oldest-waiting with a backend aggregator over the FULL inbox. | KEPSEK-C2 |
| **"Tugaskan" (delegate) framing + one-sentence verdict crown** above the three cards — keeps Kepsek out of desk work more sharply than bare signal cards. | KEPSEK-C4 |

## Bracket result

| Design | Angle | Round | Score |
|--------|-------|-------|-------|
| **KEPSEK-C3** | Native-first (Notification + Email Template + Workflow gate + full-inbox SLA) | **Winner** | Final 42 (fit5 simp4 edge4 vernon5 feas4) · SF-B 42 |
| KEPSEK-C1 | Simplest-path (3-card health strip + soft gate, no new route) | Final | SF-A 43 (fit5 simp5 edge4 vernon4 feas5) |
| KEPSEK-C2 | Power-user | SF | SF-A loser (thin "test" approach; 4 new doctypes over-build) |
| KEPSEK-C4 | Reimagine | SF | SF-B loser (elegant verdict, but gate bolted on append-only Outbox = bypassable) |

> Note: C1 scored 43 in SF-A vs C3's SF-B 42, but the Final judge force-picked **C3** — for the
> Headmaster, an *enforceable* (unbypassable) native Workflow gate + full-inbox SLA beats C1's
> faster-to-ship soft-status gate that "might leak". C1's lower-cost phasing is grafted in.

## Files likely touched

- `apps/school/src/routes/sch.$sekolah.pesan.tsx` — MODIFY: add kepsek role-branch at index →
  render oversight Panel when `isKepsek`; keep split-pane as secondary; wrap in ModuleShell sub-nav.
- `apps/school/src/lib/pesanRole.ts` (+ `.test.ts`) — NEW (clone `keuanganRole.ts`;
  `ROLE_KEPSEK` reuses "Kepala Sekolah" from `kelasApproval`; presentation hint only).
- `apps/school/src/lib/pesanSla.ts` (+ `.test.ts`) — NEW `deriveCommHealth(rows, slaJam)` →
  {belumDibalas, terlamaMenunggu, lewatSla, verdict}; default constant fallback.
- `apps/school/src/lib/pesanApproval.ts` — NEW thin re-export/adapter over `kelasApproval.ts`
  (REUSE `ROLE_KEPSEK`, `deriveApprovalGate`, `stateBadgeTone` — NOT a second implementation).
- `apps/school/src/components/pesan/PanelKepsek.tsx` (+ test) — oversight cockpit.
- `apps/school/src/components/pesan/KomposerPengumuman.tsx` — broadcast Modal.
- `apps/school/src/components/pesan/MejaPersetujuanPesan.tsx` (+ test) — 2-pane approval desk
  mirroring `MejaPersetujuanKelas`; calls `useFrappeMutation('frappe.model.workflow.apply_workflow')`.
- `apps/school/src/components/pesan/PanelTindakLanjut.tsx` — AttentionList + "Tugaskan" (graft C4).
- `apps/school/src/components/guide/miscPageGuides.ts` — add kepsek-panel PageGuide.
- **Frappe BE (separate repo)** — NEW `Pengumuman Sekolah` doctype + controller + register in
  `tenant_registry.py` `DOCTYPES['SCHOOL']`; Workflow fixture "Persetujuan Pengumuman" +
  Notification/Email Template fixtures; `hooks.py` doc_event `on_update` → on Disetujui queue
  send into Mobile Outbox (op `send_announcement`); NEW `@frappe.whitelist` reader aggregating
  Contact Inbox for the 3 SLA signals + 7-day series (full-table); NEW Single `Pengaturan
  Pesan` (sla_jam_balas Int=24, wajib_persetujuan_resmi Check) + register.

## Data model sketch

**EXISTING (reuse, no schema change):** `Contact Inbox SekolahPro` (READ for SLA signals +
sparkline; overdue = now − submitted_at > sla_jam AND status==Baru) · `Mobile Outbox Entry`
(REUSED broadcast/send queue; new ops `broadcast_announcement` immediate + `send_announcement`
post-approval; **no approval lifecycle stored here** — append-only contract preserved).

**NEW — fixtures only (native, zero custom code):** `Notification` (Pengumuman Libur / Rapat
Wali / Kebijakan) · `Email Template` (subject + HTML body, Bahasa Indonesia) · `Workflow`
("Persetujuan Pengumuman" bound to the announcement doctype, states Draft/Menunggu
Kepsek/Disetujui/Ditolak, transitions gated to "Kepala Sekolah", mirrors shipped Kelas/Mutasi
workflow).

**NEW — real custom doctype (ONLY non-fixture storage, MUST tenant-register):** `Pengumuman
Sekolah` (judul, isi Text Editor, audience Select Semua Wali|Per-Rombel|Per-Jenjang, target_ref
Dynamic Link, template Link Notification, recipient_count Int computed, pembuat Link User,
workflow_state). *Justification:* Contact Inbox is inbound-only, Mobile Outbox is append-only
with no review state — neither can hold a draft-with-approval lifecycle. Leans on native
Workflow/`apply_workflow`, not a custom state machine. **NEW config Single** `Pengaturan Pesan`
(sla_jam_balas, wajib_persetujuan_resmi) — per-school SLA/gate config, constant fallback.
*Tenant note:* `tenant_registry.py` lives in the separate BE repo → registration is a cross-repo
PR; both new doctypes need the `DOCTYPES['SCHOOL']` entry or they silently leak.

> **Merge note:** the reconcile doc merges this `Pengumuman Sekolah` with TU's `Pesan Broadcast`
> into ONE doctype carrying `workflow_state` — they are the same entity at different altitudes.

## Open questions for the human

1. Mobile Outbox fan-out: does the gateway fan one entry to N recipients, or one entry per
   recipient (heavier)? Decides whether `recipient_count` is metadata or N rows.
2. SLA default: 1×24 jam KERJA (working hours) vs raw 24h wall-clock? Confirm the default
   before `Pengaturan Pesan` overrides it.
3. Audience targeting: are anggota_rombel / wali relations rich enough for Per-Rombel /
   Per-Jenjang Notification queries? If thin, ship Semua-Wali-only v1.
4. Phasing (C1 graft): v1 = Pengawasan sub-nav tab + broadcast-only (no Workflow doctype yet),
   v2 = full native gate? Trades first-ship speed vs a temporary ungated window.
5. Broadcast-to-parent bridge: a Kepsek broadcast must materialize as the `nis=null` Contact
   Inbox row the parent `/pesan` already renders. Confirm the doc_event writes that bridge row.
6. Does ModuleShell wrapping regress the existing staff split-pane layout/tests?
7. Who routes a draft into "Menunggu Kepsek" (which staff create+submit vs Kepsek approves)?
8. "Tugaskan" ownership: add `assigned_to` (Link User) to Contact Inbox vs infer from latest
   Outbox `response.to`?

## Reconcile note

One role's slice of a single role-sliced module. See
`2026-06-08-pesan-tournament-reconcile.md` — the Kepsek panel replaces the split-pane ONLY for
`primary==='kepsek'`; TU's split-pane survives as the permissive-fallback default.
