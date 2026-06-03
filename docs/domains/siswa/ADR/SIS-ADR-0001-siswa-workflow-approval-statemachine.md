# SIS-ADR-0001: Siswa Multi-Step Workflow Approval via Frappe State Machine

- **Status:** Accepted
- **Tanggal:** 2026-06-03
- **Domain:** Siswa (Data Induk)

## Konteks

Kelulusan Siswa dan Mutasi Siswa (terutama jenis Pindah Keluar & DO) adalah proses perubahan status kritis yang berdampak pada data Dapodik, rombel assignment, dan track rekam akademik siswa. Perubahan Data Siswa (field identitas, NIK, alamat) juga memerlukan verifikasi sebelum diterapkan.

Awalnya, workflow approval untuk ketiga doctype ini bisa diimplementasikan dengan salah satu:
1. **FE-only state machine:** React component lokal track state, submit hanya saat final approval. Risk: state bisa out-of-sync dengan backend; multiple users editing same doc bisa conflict.
2. **Frappe Model Workflow + backend state machine:** Frappe native workflow engine (admin UI, transition rules, role guards, audit trail built-in). FE hanya call <code>frappe.model.workflow.apply_workflow</code> untuk advance state.
3. **Custom backend state machine:** Roll-out server-side, FE call custom method per transition. Most flexible, tapi paling maintenance-heavy.

## Keputusan

**Adopt Frappe Model Workflow** (option 2) untuk ketiga doctype:
- **Kelulusan Siswa:** Draft → Pending Ka-TU → Pending Kepsek → Approved | Rejected
- **Mutasi Siswa:** Draft → Pending Ka-TU → Pending Kepsek → Approved | Rejected (jenis critical); atau direct Approved (jenis Naik Kelas/internal, via conditional transitions)
- **Perubahan Data Siswa:** Draft → Pending Ka-TU → Pending Kepsek → Approved | Rejected

Frappe Workflow memberikan:
- **Built-in audit trail** (workflow_state, modified, owner dicatat otomatis di doctype history).
- **Role-based transition guards** (admin UI setup `Kepala Tata Usaha` can transition Draft→Pending Ka-TU, only `Kepala Sekolah` can Pending Kepsek→Approved).
- **State persistence** (workflow_state field pada doctype; no risk of FE state divergence).
- **Rejection flow** (Rejected state auto-revert to Draft untuk re-edit &amp; resubmit).
- **Comment integration** (reason for rejection stored as Comment child records linked to doctype).
- **Conditional transitions** (Mutasi Siswa uses `jenis_mutasi in ['Naik Kelas', 'Tinggal Kelas']` to auto-approve vs escalate to Kepsek).

FE consumes workflow via <code>useResourceDoc(...).data.workflow_state</code> + <code>useFrappeMutation("frappe.model.workflow.apply_workflow")</code> untuk approve/reject actions.

## Konsekuensi

### Positif
- **Single source of truth:** Frappe workflow state adalah authoritative; FE always reads server state, no divergence.
- **Cross-role transparency:** Kepala Sekolah &amp; Ka-TU lihat approval status &amp; history dalam audit trail tanpa custom logging code.
- **Scalable:** Adding new approval step / role hanya ubah admin setup (workflow definition), no code deploy needed.
- **Compliance:** Audit trail &amp; rejection reasons automatically stored per regulation (PII, Dapodik sync).
- **Conditional logic:** Mutasi Naik Kelas bypass Kepsek approval via conditional transition — no manual workaround needed.

### Negatif
- **Upfront backend config:** Workflow definitions (state, transitions, role guards) harus setup di backend Frappe (repo `apps/sekolahpro`); no YAML/JSON-as-code yet.
- **Transition latency:** Approve action requires Frappe RPC call; if backend slow, FE must wait. Mitigated by inline loading spinners &amp; error modal.
- **Rejection = reset to Draft:** If Kepsek rejects, record reverts to Draft; TU must re-review &amp; re-submit. No "request changes then auto-resubmit" option (future YAGNI).

### Trade-off ditunda (YAGNI)
- **Email notifications on state change:** Setup Frappe workflow hooks to send email to Ka-TU on submit, to Kepsek on Pending Kepsek, etc. Can add post-v0.1 via `on_transition_approve` hook.
- **Approval delegator / substitution:** If Ka-TU on leave, delegate approval to vice Ka-TU. Frappe workflow supports via role assignment; defer to HR/admin setup.
- **Time-based auto-escalation:** If approval pending &gt; 7 days, escalate. Custom webhook handler; defer to YAGNI.

## Referensi

- **Routes (FE):** `apps/school/src/routes/sch.$sekolah.siswa.kelulusan.$id.tsx`, `sch.$sekolah.siswa.mutasi.$id.tsx`, `sch.$sekolah.siswa.perubahan-data.$id.tsx`
- **UI Components:** `@sekolahpro/ui/components/WorkflowStepper`, `ApprovalBar`, `RejectModal` (consumed in detail pages)
- **API calls:** `useFrappeMutation("frappe.model.workflow.apply_workflow", { doctype, docname, action })` 
- **Backend doctype schemas &amp; workflows (repo `apps/sekolahpro`):** `sekolahpro/siswa/doctype/kelulusan_siswa/kelulusan_siswa.py` (on_submit guard), `mutasi_siswa.py` (conditional dispatch per jenis), `perubahan_data_siswa.py` (TBD). Workflow fixtures: `sekolahpro/fixtures/workflow_kelulusan_siswa.json`, `workflow_mutasi_siswa.json`, `workflow_perubahan_data_siswa.json` (transitions &amp; role guards defined here)
- **Documentation:** `apps/school/docs/redesign-orang.md` (redesign modul Siswa &amp; Staff), `apps/sekolahpro/docs/domains/siswa/spec.html` (key rules 5, 6, 7 re: workflow &amp; event publishing)
