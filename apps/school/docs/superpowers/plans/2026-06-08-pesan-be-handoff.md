# Pesan — Handoff ke sesi Backend (repo Frappe `sekolahpro`)

> Kontrak FE↔BE **EKSAK** yang sudah di-hardcode di web Fase 1 (PR #73, main). BE HARUS match
> persis ini — beda satu field/string = rework (gotcha OCR/absensi memory). Self-contained:
> sesi BE tak perlu buka repo web, semua nilai ada di sini.
> Companion: `2026-06-08-pesan-backend-fase2.md` (spec lengkap) · §0 sudah terkunci.

## 1. Yang sudah di-set & TAK BOLEH berubah (dari kode FE live)

Sumber: `apps/school/src/lib/pesan/compose.ts`, `lib/pesanApproval.ts`, `lib/pesanSla.ts` (web repo).

### 1a. Op + envelope `Mobile Outbox Entry` (worker gateway konsumsi ini)
FE menulis row Outbox dengan `op` + `response` (JSON string). BE worker HARUS kenal 3 op:

| op | response JSON (keys persis) | dari |
|---|---|---|
| `reply_contact_inbox` | `{to, inbox, body}` | balas inbox publik (SUDAH live) |
| `send_broadcast` | `{to, broadcast, body}` | 1 row/penerima broadcast TU & Kepsek |
| `send_pesan_wali` | `{to, siswa, body, pesan_wali}` | guru → 1 wali |

Row dibuat status `received`, `request_hash="n/a"`, `idempotency_key` unik (`outbox-<ts>-<rand>`).
**Catatan:** FE TIDAK pakai `send_announcement` terpisah — broadcast resmi Kepsek juga `send_broadcast`.
`idempotency_key` = kunci dedup resend-failed; worker WAJIB idempotent per key.

### 1b. State Workflow `Pesan Broadcast` (string PERSIS — FE gate baca ini)
Sumber `lib/pesanApproval.ts` `PESAN_WORKFLOW_STATE`:
```
"Draf"  →  "Menunggu Kepsek"  →  "Disetujui" | "Ditolak"
```
- Approve gate di-role ke **`Kepala Sekolah`** (+ `System Manager`). apply_workflow = otoritas tunggal.
- Field doc HARUS `workflow_state` (default Frappe). FE `pesanStateBadgeTone` map: Disetujui→success,
  Ditolak→danger, Draf→neutral, lainnya→warning.

### 1c. `Pengaturan Pesan` Single (field + default — FE fallback baca ini)
Sumber `lib/pesanSla.ts` `DEFAULT_SLA_JAM=24`:
```
sla_jam_balas           Int   default 24
wajib_persetujuan_resmi Check default 1   (fail-safe)
ambang_persetujuan      Int   default 100
```

### 1d. `pesan_comm_health` return shape (FE Panel Kepsek konsumsi — ganti hitung client-side)
Sumber `lib/pesanSla.ts` `deriveCommHealth`. Method whitelisted BE kembalikan **persis**:
```json
{ "belumDibalas": int, "terlamaMenungguJam": int, "lewatSla": int,
  "verdict": "SEHAT" | "PERLU PERHATIAN" | "TERLAMBAT" }
```
Aturan: `belumDibalas` = count status `Baru`; `terlamaMenungguJam` = usia (jam) tertua `Baru`;
`lewatSla` = count `Baru` usia > `sla_jam_balas`; verdict: ada lewatSla→TERLAMBAT, else ada
belumDibalas→PERLU PERHATIAN, else SEHAT. BE hitung **full-table** (FE kini hanya ~loaded rows).

### 1e. Inbox existing (JANGAN ubah)
`Contact Inbox SekolahPro`: `nama,email,telepon,pesan(HTML),status(Baru|Dibalas|Selesai),submitted_at,creation`.
Status flow Baru→Dibalas→Selesai. Parent `/pesan` render row `nis=null` sebagai broadcast.

## 2. §0 terkunci (recap)
Gateway **live di BE** · tenancy **shared row-level** (⇒ `permission_query_conditions` WAJIB tiap
doctype + `Pesan Template` tenant-scoped) · status **per-channel** (WA hand-off ≠ Email/InApp
terkonfirmasi) · guru **homeroom-only** Fase 1.

## 3. Sisa §0 untuk diputus saat build (default aman tercatat)
- Nama doctype/method: pakai persis `Pesan Broadcast`/`Pesan Wali`/`Pengaturan Pesan`/`Pesan Template`/
  `resolve_pesan_audience`/`pesan_comm_health` (FE seam akan pakai ini).
- `ambang_persetujuan` N: default 100 (routine TU skip approval).
- SLA: default 24 jam — putuskan wall-clock vs jam-kerja (FE pakai angka apa adanya).
- Reply parent app: nambah input balasan ke app read-only — konfirmasi scope, else Guru F1 outbound-only.

## 4. Langkah konkret sesi BE (dari §7 plan)
```
1. Pengaturan Pesan Single + register tenant_registry + permission_query + FrappeTestCase
2. Pesan Template (sekolah-anchored) + register + permission_query + fixture seed + test
3. resolve_pesan_audience + pesan_comm_health (filter sekolah WAJIB) + test
4. Pesan Broadcast + Workflow fixture (state §1b) + on_submit fan-out (op §1a, status per-channel)
   + register + permission_query + test
5. Pesan Wali + on_insert→Outbox (op send_pesan_wali) + permission_query homeroom + register + test
6. parent.list_pesan 2-arah + jembatan broadcast→Contact Inbox nis=null + test
7. bench migrate + restart; verifikasi worker kenal 3 op + status balik per-channel
```

## 5. Gate WAJIB (jangan kelewat)
- **Test = `FrappeTestCase`**, jalan via `bench --site … run-tests` (unittest). **pytest absen di
  container** — jangan tulis pytest (gotcha absensi memory).
- Tiap doctype baru: **register `tenant_registry.py DOCTYPES['SCHOOL']` + `permission_query_conditions`**
  — pada shared-row-level, registry saja TIDAK mengisolasi; uji user sekolah A tak lihat data B.
- Deploy: BE bind-mounted dari **MAIN checkout** → docker bench TAK lihat worktree; commit ke branch
  ter-mount / koordinasi sesi (gotcha OCR memory). `bench migrate` + `bench restart` setelah doctype.
- `@frappe.whitelist()` ≤10 baris, delegate ke controller. No raw SQL bypass frappe.db. Hooks-first.

## 6. Setelah BE landing → FE flip (repo web, §8 plan)
Buka seam: `lib/pesan/broadcast.ts` (mirror `lib/ppdbApi.ts`) → composer TU + Meja Kepsek
(apply_workflow, mirror `MejaPersetujuanKelas`) + thread Guru di `StudentSheet`/`kelas.saya`. Ganti
stub "menunggu aktivasi server" + label "Antre"→status per-channel. Re-verify tsc/eslint/vitest/build.
