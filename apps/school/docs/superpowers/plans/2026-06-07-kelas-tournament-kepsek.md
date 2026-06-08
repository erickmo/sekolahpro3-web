# Kelas Module Redesign — Tournament Plan (POV: Kepala Sekolah)

> Design-tournament output. **Proposal only — NOT implemented.** Human approves before `implement plan`.
> Date: 2026-06-07 · Feature: Kelas module (full redesign) · POV/Judge: **Kepala Sekolah (headmaster)**
> Sibling plans: `2026-06-07-kelas-tournament-tu.md`, `2026-06-07-kelas-tournament-guru.md`,
> reconcile: `2026-06-07-kelas-tournament-reconcile.md` (read the reconcile FIRST — all three slice ONE module).

## POV brief (job-to-be-done)

OVERSIGHT + APPROVAL. Kepsek approves Mutasi Siswa (naik/tinggal/pindah/DO) at the workflow gate **Pending Kepsek**.
Monitors school-wide class health: over-capacity, rombel-tanpa-wali, student:teacher ratio, distribution per tingkat.
**Read + approve only, never edits structure.** Pain today = approving blind (no context on the student/class) +
no health overview. **GOOD = at-a-glance compliance dashboard + confident, well-contextualized approvals in few clicks.**

## Winner — C4 Reimagine: "Meja Persetujuan Kelas" (score 40/45)

The Kepsek's real job is not "manage/monitor classes" but **"clear a queue of consequential student-mutation
decisions and certify the school is compliant."** So for the Kepala Sekolah role the `/kelas` index is **role-swapped**
into a two-pane Approval Review Desk (triage inbox) — left = queue of Mutasi Siswa at `workflow_state = "Pending Kepsek"`,
right = a context-rich **Kartu Tinjau** (student + from/to rombel side-by-side + live **"Dampak Struktur"** guardrails)
where the Approve button and its decision context live in the **same pane** — instead of the TU stat-wall dashboard the
Kepsek can only Read and never act on. School-wide health collapses to one signable **"Sertifikat Kepatuhan"** strip.
TU/Guru keep today's builder index unchanged.

### Why it won (judged)

- **SF-A:** C1 (Simplest-path) 43 vs C2 (Power-user) 33 · **SF-B:** C4 43 vs C3 (Native-first) 36
- The two semifinal winners tied at 43 → **final re-run as a proper head-to-head: C4 40 vs C1 39.**
- Decisive tiebreak (headmaster-judge voice): *"My one job at this gate is to NOT sign blind. When a transfer moves
  a child INTO a rombel, I need to see the receiving class side-by-side and be told, before I press Setujui, 'this puts
  you at 33 of 32' or 'this orphans a wali'."* C4's **Dampak Struktur** block is the literal cure for "approving blind",
  and it's the only design that treats destructive jenis (**DO / Pindah-Keluar**) as danger-flagged first-class citizens.
  That carries the Fit (×3) + Edge (×2) margin.
- C1 is the calmer/cheaper desk (2-click approvals, no rewrite) — but its own tradeoff is the dagger: a self-contained
  card hands the same half-distrusted numbers and asks the Kepsek to trust them harder. *"Cheapness that leaves me signing
  blind is a false economy at my desk."*
- Load-bearing reuse is **real in the repo:** `src/routes/sch.$sekolah.siswa.mutasi.$id.tsx` already imports
  `ApprovalBar`/`WorkflowStepper`/`RejectModal`/`AuditTrailTimeline`, calls `apply_workflow`, and gates `ROLE_KEPSEK` at
  "Pending Kepsek" (lines ~156-170, ~95-99).
- Score withholds ~5 pts honestly: near-total index rewrite + a new Frappe Report on an **unproven render path**
  (`query_report.run` has ZERO existing usage in the web repo); Dampak Struktur denorm numbers can be stale → kept
  **advisory, never a hard block** (the Workflow engine stays authoritative).

## Grafted ideas (from eliminated designs + final)

1. **Inline pre-fire GUARD PREVIEW** — *from C2 Power-user (judge "best idea of the tournament").* On the Kartu Tinjau,
   before the Approve click, mirror the controller's capacity/wali/`status==Ditutup` guards → render a predictive
   "X aman / Y akan ditolak (rombel tujuan penuh / ditutup)" signal, and force destructive jenis into an explicit per-row
   confirm. Advisory UI only; the workflow stays authoritative.
2. **Verbatim-reuse discipline** — *from C3 Native-first.* Do NOT fork the proven `siswa/mutasi/$id` approval stack.
   Reuse `ApprovalBar`/`WorkflowStepper`/`RejectModal`/`AuditTrailTimeline` + `apply_workflow` as-is; extract ONLY the shared
   `canApproveKepsek` + Pending-Kepsek gate into a `lib/kelasApproval` helper both the new desk and the existing detail import.
   Keeps the rewrite from duplicating the workflow/permission/audit core.
3. **One compliance number source, behind a collapsible strip** — *from C3 Native-first.* Drive the Sertifikat Kepatuhan
   from a single native Frappe Query Report (`Kepatuhan Rombel`) so the same green/amber/red figures render in the SPA AND
   in native Desk, with no bespoke aggregation endpoint. Demote health to a ledger so the decision queue stays the surface.
4. ~~**Bounded batch-select** for bulk Naik Kelas approvals~~ — **DROPPED (audit B1).** The real workflow never routes
   `Naik Kelas` to `Pending Kepsek` (Ka-TU finalizes it); the Kepsek queue is **destructive-only** (Pindah Keluar + Drop Out),
   so there are no bulk-Naik approvals to batch. DO/Pindah stay strictly one-at-a-time with a destructive-confirm.
5. **Inline expand-in-place audit** — *from C1 (final loser-did-better).* Reveal `WorkflowStepper` + `AuditTrailTimeline`
   on the row itself without navigating, so the Kepsek self-audits what was already signed without leaving the desk.

## Bracket result

| Competitor | Angle | Eliminated | Score | Note |
|---|---|---|---|---|
| **C4 Reimagine — Meja Persetujuan Kelas** | Two-pane review desk: queue left, context-rich Kartu Tinjau + Dampak Struktur right; health → signable Sertifikat strip | **Winner** | **40** | Won SF-B 43-36 then FINAL 40-39 (tie-break re-run). Makes the decision (not the rombel) the unit of work — cures "approving blind". |
| C1 Simplest-path — Meja Kepsek | Collapse 6 routes to ONE zero-config landing: stacked inline Setujui/Tolak cards + read-only Kesehatan strip; 2-click median | Final | 39 | Strongest in the other semifinal (lowest cognitive load for a low-frequency approver). Lost final: cards carry less context than C4's dedicated review pane. Graft: inline expand-in-place audit. |
| C2 Power-user cockpit | Keyboard-first dense triage table, multi-select bulk Approve/Reject, ⌘K, rombel×tingkat health matrix | Semifinal | 33 | Strong edges + best health view, but optimized for a high-volume daily approver the Kepsek is NOT; bulk-approving DO is dangerous. Grafts: guard preview, bounded bulk. |
| C3 Native-first / low-code | Keep 4 routes + add a Kepsek lens; one Query Report drives health; thin re-export of the approval stack | Final* | 36 | Cleanest Vernon/Frappe-native build, fastest, numbers consistent with Desk. Lost SF-B: keeps the TU stat-wall as the Kepsek landing, approval as a side door. Grafts: verbatim-reuse + single-Report source. |

\* C3 was eliminated in the **Semifinal** (SF-B, 36 vs C4 43); the original synthesis mislabeled its round.

## Data model sketch (native-first — zero new business doctypes, zero new endpoints)

Reuse the proven workflow engine.

**(1) Reads (no schema change):** `Mutasi Siswa`.{workflow_state[=Pending Kepsek], jenis_mutasi, siswa, rombel_asal,
rombel_tujuan, tahun_ajaran_asal, tahun_ajaran_tujuan, tanggal_efektif, alasan, audit_log, owner, modified};
`Rombongan Belajar`.{name, nama_rombel, tingkat, jenjang, wali_kelas, kapasitas, jumlah_siswa denorm, status, tahun_ajaran,
ruangan} for Dampak Struktur headroom/over-capacity/orphan-wali; `Anggota Rombel`(child).{siswa, status} for target-rombel
live occupancy delta; `Jadwal Pelajaran`.{rombel, is_aktif} only inside the compliance Report (tanpa-jadwal count).

**(2) Mutations — all via existing native engine, NO new endpoint:**
`frappe.model.workflow.apply_workflow('Mutasi Siswa', docname, action='Approve'|'Reject')`; reject reason via the existing
`Comment(comment_type='Workflow')` pattern. On Approve the existing `on_submit` side-effects fire (anggota asal→Keluar,
tujuan→Aktif). Workflow doctype 'Mutasi Siswa' (Draft→Pending Ka-TU→Pending Kepsek→Approved/Rejected, allowed='Kepala Sekolah'
on the Kepsek transition) UNCHANGED.

**(3) NEW backend fixtures (must migrate):** Query Report **`Kepatuhan Rombel`** (low-code server-side aggregation feeding
the Sertifikat strip AND visible in Desk — replaces client-side `.filter()` loops, one source of truth) + 1 **Notification**
fixture on Mutasi entering 'Pending Kepsek'.

**(4) Guardrail policy:** Dampak Struktur / guard-preview numbers lean on `jumlah_siswa` denorm + Anggota counts that can be
stale between migrations → rendered **ADVISORY** (colored warning chip), NEVER a hard block. Perms unchanged: TU=CRUD,
Kepsek=Read+approve via workflow, Wali/Guru=Read. Every cross-module query tenant-scoped by sekolah.

## Files likely touched

**Web:**
- `src/routes/sch.$sekolah.kelas.index.tsx` — **role-branch the render**: Kepsek → `<MejaPersetujuanKelas/>`, else existing `<KelasDashboardPage/>` unchanged. **Top risk surface.** *(See reconcile — this single switch is shared with TU + Guru branches.)*
- `src/components/kelas/MejaPersetujuanKelas.tsx` *(NEW)* — two-pane container: AntreanKeputusan (left) + KartuTinjau (right) + SertifikatKepatuhan strip + RiwayatKeputusanSaya
- `src/components/kelas/AntreanKeputusan.tsx` *(NEW)* — left pane: `useResourceList('Mutasi Siswa', filters [['workflow_state','=',WORKFLOW_STATE.PENDING_KEPSEK]])`. This queue is **destructive-only** (Pindah Keluar + Drop Out — the only jenis the workflow escalates here); each row danger-flagged, strictly one-at-a-time, no batch-select (audit B1)
- `src/components/kelas/KartuTinjau.tsx` *(NEW)* — right pane Review Card: student identity, rombel_asal vs rombel_tujuan side-by-side, Dampak Struktur + inline GUARD PREVIEW; embeds reused ApprovalBar + RejectModal + WorkflowStepper
- `src/components/kelas/SertifikatKepatuhan.tsx` *(NEW)* — collapsible compliance strip backed by `Kepatuhan Rombel` Query Report; expands to per-tingkat distribution + rasio table
- `src/lib/kelasRole.ts` *(NEW, SHARED — see reconcile)* — deriveRoles helper (mirrors akademikRole.ts/ppdbRole.ts); exports `isKepsekKelas` + KELAS_ROLE labels
- `src/lib/kelasApproval.ts` *(NEW)* — extract shared `canApproveKepsek` + Pending-Kepsek gate + `apply_workflow` wrapper (lifted verbatim from mutasi.$id.tsx ~156-170, ~95-99); both the desk and the existing detail import it *(graft C3)*
- `src/lib/dampakStruktur.ts` *(NEW)* — pure helper: mutasi + target rombel → headroom / over-capacity / orphan-wali / ditutup verdicts. Advisory only; mirrors controller guards
- `src/routes/sch.$sekolah.siswa.mutasi.$id.tsx` — EDIT (refactor only): replace inline `canApproveKepsek` block with import from `lib/kelasApproval.ts`. No behavior change *(graft C3)*
- `src/routes/sch.$sekolah.kelas.$kodeKelas.tsx` — EDIT: hide Edit/CRUD Hero actions when `isKepsekKelas` (Read-only contract); entered as drill-down context only
- `src/components/kelas/pageGuides.ts` — EDIT: add Kepala-Sekolah-role-tagged guide for the desk
- `src/components/kelas/__tests__/MejaPersetujuanKelas.test.tsx` *(NEW)* — Vitest: role-slice (Kepsek desk vs TU builder), queue filter, guard-preview verdicts, Read-only. Watch RTL `afterEach(cleanup)` leak + globals:false

**Backend:**
- `fixtures/report/kesehatan_rombel/` *(NEW Query Report 'Kepatuhan Rombel')* — server-side aggregation (tanpa-wali / over-capacity / penuh / tanpa-jadwal / rasio siswa:guru per tingkat). Tenant-scoped. Must ship + migrate. *(See reconcile — unify with TU's defect reports into ONE report.)*
- `fixtures/notification.json` *(NEW Notification)* — document_type='Mutasi Siswa', trigger on workflow_state == 'Pending Kepsek' → notify Kepala Sekolah role. Config, not code.

## Open questions for the human

1. **Bulk Naik Kelas scope:** batch-select fires one `apply_workflow` per selected Mutasi client-side (non-atomic, partial-success UI), or add a minimal whitelisted `bulk_apply_workflow` wrapper (more backend surface)? Default = client-side loop, Naik-Kelas-only.
2. **Module boundary:** pulling the Mutasi queue into `/kelas` blurs the Siswa/Kelas boundary. Keep `/siswa/mutasi` as TU authoring AND surface the same queue in `/kelas` for Kepsek (two entry points to one doctype), or redirect Kepsek away from `/siswa/mutasi`? Plan = both coexist.
3. **Rasio siswa:guru source:** the report needs a guru count per tingkat/school. Authoritative active-teacher count (Pegawai role Guru, scoped per rombel/tingkat), or approximate from wali_kelas + jadwal assignments? Affects whether the rasio is trustworthy enough to sign.
4. **Notification channel:** email + in-app inbox, or in-app only? Cadence — instant on each Pending-Kepsek transition, or daily digest? Plan = instant in-app + email.
5. **"Sertifikat Kepatuhan" semantics:** a real audited acknowledgement (write a record that Kepsek certified compliance on date X), or purely a visual ledger? A persisted sign-off needs a tiny new field/record and changes the Read-only contract. Plan = visual-only unless the human wants audited certification.
6. **`query_report.run` render path** has ZERO existing usage in the web repo (unproven). Accept being the first consumer, or fall back to a whitelisted aggregate `get_list` matching the existing dashboard's client-count style?
7. **Detail Rombel drill-down:** when Kepsek opens `/kelas/$kodeKelas` from a Review Card, hide Edit/CRUD (plan) or fully route-gate it for the Kepsek role? Affects deep-link behavior if a Kepsek bookmarks the edit URL.
