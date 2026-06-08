# Pesan Tournament — RECONCILE (TU + Guru + Kepsek → ONE role-sliced module)

> Design-only plan. Merges the three POV winners into a single build plan. NOT implemented.
> Date: 2026-06-08 · Module: Pesan
> Inputs: `2026-06-08-pesan-tournament-{tu,guru,kepsek}.md`

## Strategy — ONE module, not 3 forks

Same lesson jadwal/kelas already paid for. The three winners are not three products; they are
**three VIEWS of one communication surface** sharing the exact same two backend stores
(`Contact Inbox SekolahPro` + `Mobile Outbox Entry`) and the same outbound primitives (audience
resolution, Email Template bodies, native Workflow gate). Forking would triple-implement
audience resolution, template picking, and the Outbox dispatch contract — and each fork would
re-derive role from `session.roles` independently, the precise duplication `sessionRole.ts`
exists to kill.

Instead: (1) convert the flat `sch.$sekolah.pesan.tsx` split-pane into a thin **ModuleShell
LAYOUT route** + a `.index.tsx` doing a single 3-way role branch (mirror `kelas.index.tsx` /
`aset.tsx`); (2) every role's surface composes from the SAME shared libs (`pesanRole`,
`pesan/audience`, `pesan/compose`, `pesanSla`, `pesanApproval`) and SAME components
(`AudienceBuilder`, `TemplatePicker`, `KomposerPengumuman`); (3) divergence is purely **which
surface mounts and which affordances are visible**. Role is a presentation hint ONLY
(sessionRole engine, permissive fallback); the backend Workflow + tenant scoping are the real
gate. Vernon hooks-first honored: native Email Template for bodies, native Workflow/
`apply_workflow` for the official-send gate, native Notification/Email Queue for email delivery
truth, Mobile Outbox reused as the dispatch ledger — only the IRREDUCIBLE state no native
doctype can hold becomes a new tenant-registered doctype. **Existing staff inbox UX must not
regress:** the split-pane survives intact as the TU "Masuk" lane AND the permissive-fallback
default, so any unrecognized session still lands on today's working inbox.

## The single role-branch point

`apps/school/src/routes/sch.$sekolah.pesan.index.tsx` (NEW) — split today's flat
`sch.$sekolah.pesan.tsx` into:
- **(a)** `sch.$sekolah.pesan.tsx` → a thin ModuleShell **layout** (label="Pusat Pesan",
  roleLabel from `usePesanRole`, `navGroups=PESAN_NAV_GROUPS`, + `<Outlet/>`; mirror
  `aset.tsx` ~1.6K).
- **(b)** the new index doing ONLY:
  ```
  const { primary } = usePesanRole();
  if (primary === 'kepsek') return <PanelKepsek/>;
  if (primary === 'guru')   return <Navigate to=".../pesan/saya"/>;   // roster-born surface
  return <MasukDesk/>;       // TU primary AND permissive-fallback default (existing split-pane)
  ```
Exactly the `kelas.index.tsx` discipline: zero business logic in the route; decision driven by
the tested `usePesanRole`; all fetching/rendering in surface components. **This is the ONLY
place the UI forks per role.**

## Shared libraries (build once, all roles consume)

| Lib | Purpose |
|-----|---------|
| `lib/pesanRole.ts` (+ test) | Single role engine. Clone `kelasRole.ts` shape EXACTLY (wrap `deriveRoles`, do NOT re-implement). `PesanRole = 'tu' \| 'guru' \| 'kepsek'`; `'tata_usaha'` before `'kepala'` ordering guard; **CRITICAL add a `guru` matcher** (plain "Guru" matches nothing in kelasRole → non-homeroom teachers would never get the surface); `defaultPrimary='tu'` so the fallback keeps today's split-pane; `usePesanRole()`. |
| `lib/pesan/audience.ts` | Single audience **descriptor** + resolver for ALL roles. `AUDIENCE_TYPES` (semua_wali\|per_rombel\|per_jenjang\|penunggak\|manual); descriptor `{audiens_type, audiens_filter}` resolved at SEND time (graft TU-C1, never a snapshot); client count-preview REUSES `computeTunggakanBesar` + `useMyRombels` from `lib/beranda`. FE count advisory; server `resolve_pesan_audience` is source of truth. |
| `lib/pesan/compose.ts` | Single Mobile Outbox dispatch-payload builder so the op/idempotency_key/response-JSON contract lives in ONE place (today inline at `pesan.tsx` L125-137). `newIdempotencyKey()`, `buildReplyPayload` (op=`reply_contact_inbox`), `buildBroadcastPayload` (op=`send_broadcast`), `buildPesanWaliPayload` (op=`send_pesan_wali`). Reuses `kelasku.ts` contact helpers. |
| `lib/pesan/broadcast.ts` | Thin hooks over the NEW `Pesan Broadcast` doctype + `resolve_pesan_audience`. Used by TU composer/riwayat + Kepsek Pengumuman. |
| `lib/pesanSla.ts` (+ test) | Kepsek: pure `deriveCommHealth(rows, slaJam)` → signals + verdict; default constant fallback. |
| `lib/pesanApproval.ts` | Kepsek: **REUSE `kelasApproval.ts` directly** (ROLE_KEPSEK, deriveApprovalGate, stateBadgeTone — generic over WorkflowState). Thin adapter, NOT a second approval impl. Same `apply_workflow` mutation as `MejaPersetujuanKelas`. |
| `lib/pesanNav.ts` | `PESAN_NAV_GROUPS: NavTabGroup[]` for ModuleShell, role-filtered by the layout (TU: Beranda/Buat/Riwayat/Template/Masuk; Kepsek: Pengawasan/Persetujuan/Pengumuman; Guru: minimal). |

## Per-role surface

- **TU** (`primary='tu'`, AND permissive default): KIRIM-first "Pusat Pesan" desk — Beranda
  landing (4 outbound StatCards + Keluar/Masuk lanes) + tabs Buat (3-step composer) · Riwayat
  (tracker + resend-failed) · Template · Masuk (existing split-pane moved as-is + "Sisipkan
  Template" + C2 bulk multi-select). Renamed `PesanComposeModal` = "Catat Pesan Masuk" here.
- **Guru** (`primary='guru'`): NO inbox destination. `/pesan/saya` is a thin redirect target;
  the real surface is BORN on `StudentSheet.tsx` (inline "Kirim Pesan Wali") + `kelas.saya.tsx`
  (Alpa/Antrean rows + "Pesan Satu Kelas"). Only list = `TindakLanjutSaya`. Recipients via
  `useMyRombels` (my-students scope). Sends create `Pesan Wali` (on_insert → Outbox) + light
  Catatan Wali breadcrumb.
- **Kepsek** (`primary='kepsek'`): governance altitude, NO reply box. `PanelKepsek` cockpit —
  verdict crown + 3 SLA signal cards (backend full-inbox aggregator) + Kesehatan card +
  `PanelTindakLanjut` "Tugaskan". Sub-nav: Persetujuan (`MejaPersetujuanPesan`, same
  `apply_workflow` stack as kelas) · Pengumuman (`KomposerPengumuman` under Kepsek's name).

## Shared doctypes (after merge)

**EXISTING (reuse):** `Contact Inbox SekolahPro` (Masuk lane store + Kepsek SLA source via
full-table aggregator; +bulk patches +`Tugaskan` owner — see conflicts) · `Mobile Outbox
Entry` (single dispatch ledger for ALL outbound; agreed new ops `send_broadcast` / `send_pesan_
wali` / `send_announcement`; append-only, no lifecycle state; centralize in `lib/pesan/
compose.ts`) · native `Email Template` (one source for `TemplatePicker` across roles) · native
`Notification`+`Email Queue`+`Email Queue Recipient` (email delivery truth, graft TU-C3) ·
READ-only `Rombongan Belajar`/`Anggota Rombel`/`Tagihan`.

**NEW (tenant-register in `tenant_registry.py` `DOCTYPES['SCHOOL']`, anchored by `sekolah`
Link):**
- **`Pesan Broadcast`** — the MERGE of TU's `Pesan Broadcast` + Kepsek's `Pengumuman Sekolah`
  (same entity, different altitude). Carries `workflow_state`. judul, audiens_type,
  audiens_filter (JSON descriptor), template (Link Email Template), isi, channels, jadwal,
  status, total/terkirim/gagal counts, workflow_state, sekolah. `on_submit` fans out Outbox +
  schedules.
- **`Pesan Wali`** (Guru) — siswa, rombel, guru, wali_phone snapshot, kategori, isi, arah, thread_key,
  status, channel, broadcast_key, sekolah. Owns the 2-way teacher↔parent thread. `on_insert` →
  Outbox. Cross-repo edit to `parent.list_pesan` for 2-way.
- **`Pengaturan Pesan`** Single — `sla_jam_balas` (24) + `wajib_persetujuan_resmi` +
  `ambang_persetujuan` (approval audience-size threshold N). Reconciles TU-C3 threshold +
  Kepsek SLA into ONE config.
- **Fixtures (native, zero code):** `Workflow` "Persetujuan Pengumuman" bound to `Pesan
  Broadcast` (Draf→Menunggu Kepsek→Disetujui/Ditolak, gated to "Kepala Sekolah") + Email
  Template/Notification seeds.
- **Whitelisted `resolve_pesan_audience`** (no storage; server is source of truth).

## Conflicts resolved

1. **Destination model** (biggest disagreement). TU demotes-but-keeps the split-pane; Guru
   deletes it; Kepsek replaces it. → None is module-wide truth; each is that ROLE's primary
   surface, and the single role-branch is exactly what lets all three coexist. TU's split-pane
   = TU Masuk lane AND permissive-fallback default (zero regression). Guru never mounts it.
   Kepsek panel replaces it ONLY for `primary==='kepsek'`.
2. **Broadcast doctype collision.** TU `Pesan Broadcast` vs Kepsek `Pengumuman Sekolah` — both
   are "draft-with-audience-with-approval-lifecycle official outbound". → MERGE into ONE
   `Pesan Broadcast` carrying `workflow_state`. `Pengaturan Pesan.wajib_persetujuan_resmi` /
   `ambang_persetujuan` (N≈100) decides whether a broadcast routes through "Menunggu Kepsek" or
   sends immediately (routine TU sends skip approval — SF-B judge flagged forced approval as
   resented friction). One doctype, one Workflow, role decides the entry path.
3. **Template store.** TU/Kepsek = native Email Template; Guru wanted a tenant-scoped `Pesan
   Wali Template` for short WA text. → Ship native Email Template as the shared `TemplatePicker`
   source for v1 (use_html=0 serves short WA text fine; merge tags render server-side); DEFER
   the separate doctype to v2 unless multi-tenancy is shared-site row-level (then it's needed).
   Tracked as open question, not built twice now.
4. **Delivery-truth semantics.** Email Queue gives Sent/Error; WA-via-deep-link can never
   confirm. → Honest PER-CHANNEL labels in `compose.ts`: "Terkirim — via WhatsApp" =
   composed/handed-off; "Terkirim" = gateway/Email-Queue-confirmed. One vocabulary,
   channel-qualified.
5. **SLA / approval config scatter.** Both were heading toward hardcoded constants. → One
   Single `Pengaturan Pesan` holds both; `pesanSla.ts` + the Workflow read it with constant fallback.
6. **Role matcher gap.** `kelasRole.ts` plain "Guru" matches NOTHING (fine for read-only Kelas,
   FATAL for Pesan). → `pesanRole.ts` MUST add an explicit `guru` matcher (keep `tata_usaha`
   before `kepala`). Deliberate divergence from kelasRole, covered by `pesanRole.test.ts`.

## Build order

0. **Pre-flight (cross-repo contract):** confirm with the BE team the doctype names (`Pesan
   Broadcast`, `Pesan Wali`, `Pengaturan Pesan`), the three new Outbox op values, the
   `resolve_pesan_audience` signature, and the `parent.list_pesan` 2-way contract BEFORE any FE
   payload is coded (avoid OCR/absensi-style field-contract rework). Confirm the WA/Email
   gateway consuming Mobile Outbox is actually live (else Terkirim counts are aspirational).
1. **Shared foundation:** `lib/pesanRole.ts` + test (clone kelasRole, ADD `guru` matcher) +
   `lib/pesanNav.ts`. Pure libs, fully unit-tested, no UI change.
2. **Route → layout+index pair WITHOUT changing any surface:** `pesan.tsx` → thin ModuleShell
   layout + `<Outlet/>`; move today's split-pane body verbatim into `MasukDesk` rendered by the
   new index (always MasukDesk for now). Verify inbox byte-for-byte unchanged + tests green +
   redirect for old deep-link.
3. **Centralize dispatch contract:** `lib/pesan/compose.ts` (lift `newIdempotencyKey` + L125-137
   payloads); rewire MasukDesk `handleSend`/`handleMarkAll` + add C2 bulk multi-select.
4. **Shared outbound primitives:** `lib/pesan/audience.ts` + `lib/pesan/broadcast.ts` +
   `AudienceBuilder.tsx` + `TemplatePicker.tsx` (consumed by all roles).
5. **TU slice:** Beranda desk + Buat composer + Riwayat + Template; rename PesanComposeModal.
   (BE parallel: `Pesan Broadcast` doctype + register + on_submit fan-out + resolve method.)
6. **Kepsek slice:** `pesanSla.ts` + test, `pesanApproval.ts` (adapter over kelasApproval —
   REUSE), `PanelKepsek` + `PanelTindakLanjut` + `KomposerPengumuman` + `MejaPersetujuanPesan`
   (mirror Kelas, same `apply_workflow`); branch into index for kepsek. (BE parallel: Workflow
   fixture + `Pengaturan Pesan` Single + full-inbox SLA aggregator + register.)
7. **Guru slice:** `compose.buildPesanWaliPayload`; EDIT `StudentSheet.tsx` + `kelas.saya.tsx`;
   `PesanComposeWaliModal` (do NOT mutate TU modal); `TindakLanjutSaya`; light Catatan Wali
   breadcrumb; index redirects guru → `/pesan/saya`. (BE parallel: `Pesan Wali` doctype +
   on_insert hook + register + `parent.list_pesan` 2-way edit.)
8. **Guides + polish:** `miscPageGuides.ts` pesan + per-tab guides (AVOID queried KPI label
   verbatim in copy — bug-032 getByText collision).
9. **Verify inline/sequential** (NOT fan-out builds — workflow-concurrent-build-stall memory):
   `pnpm generate` (routeTree.gen) → tsc → eslint → vitest → build. Confirm parent `/pesan`
   read-only route untouched.

## Open questions for the human

1. Is the WA/Email gateway consuming Mobile Outbox wired/live in BE? (Shared risk; not in web repo.)
2. Multi-tenancy model: one site per school vs shared site row-level `sekolah` scoping? Decides
   whether native Email Template can leak → whether the deferred `Pesan Wali Template` is needed.
3. Parent-app 2-way scope: may `parent.list_pesan` accept replies (adds a reply input to the
   read-only parent app) this iteration, or ship Guru phase 1 outbound-only?
4. Non-wali subject teachers: message ANY student they teach (Anggota Rombel ∩ my mapel) or
   only homeroom? Sets the backend permission query + roster source.
5. Approval threshold N (`ambang_persetujuan`) ≈ 100? + which staff roles may create+submit a
   `Pesan Broadcast` draft vs who only approves?
6. SLA window: 1×24 jam KERJA vs raw 24h? Confirm the default before `Pengaturan Pesan` overrides.
7. "Tugaskan" ownership: add `assigned_to` (Link User) to Contact Inbox vs infer from Outbox
   `response.to`?
8. Broadcast-to-parent bridge: confirm the Notification/doc_event writes the `nis=null` Contact
   Inbox row the parent `/pesan` already renders, else parents never see announcements.
9. MVP slicing: composer + `Pesan Broadcast` + Riwayat + Kepsek oversight panel first; defer
   scheduling, resend-failed, in-app Notif channel to v2? Confirm whether the in-app push
   pipeline even exists (else hide the Notif chip).
