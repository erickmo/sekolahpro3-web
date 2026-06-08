# Pesan — Backend Fase 2 (unblock FE depth)

> Plan untuk **repo Frappe terpisah** (`sekolahpro` app), BUKAN checkout web ini. Mengaktifkan
> permukaan yang di-seam jujur "menunggu aktivasi server" di Fase 1 (PR #73 web).
> Date: 2026-06-08 · Companion: `2026-06-08-pesan-tournament-reconcile.md`
> Status: NOT implemented — proposal. Pre-flight contract HARUS disepakati dulu (§0).

## Konteks dari Fase 1 (sudah live di web main `a9ccdd5`)

FE role-sliced sudah jalan: `MasukDesk` (TU/fallback, inbox nyata), `PanelKepsek` (SLA dari
Contact Inbox nyata, client-side), `PesanWaliSaya` (guru entry). Envelope dispatch siap di
`lib/pesan/compose.ts` dengan op `send_broadcast` / `send_pesan_wali` / `send_announcement` +
`buildBroadcastPayload`/`buildPesanWaliPayload`. Yang DI-STUB (disabled, label "menunggu aktivasi
server"): composer broadcast 3-langkah (TU), Meja Persetujuan + Workflow (Kepsek), composer
roster-inline + thread 2-arah (Guru). Semua butuh doctype backend di bawah.

## §0 — Pre-flight (BLOCKING — sepakati SEBELUM tulis kode)

Cross-repo contract; bila salah → rework field-contract (gotcha OCR/absensi memory).

1. **Gateway live?** Apakah worker WA/Email yang konsumsi `Mobile Outbox Entry` benar-benar
   jalan + akan kenal op baru (`send_broadcast`/`send_pesan_wali`/`send_announcement`)? Bila
   belum → semua "Terkirim" aspiratif; FE tetap label "Antre". **Jawaban menentukan apakah
   Fase 2 layak dikerjakan sekarang.**
2. **Model multi-tenant**: 1 site per sekolah, atau shared site + scoping baris `sekolah`?
   Menentukan apakah native `Email Template` bisa bocor antar sekolah → apakah perlu
   `Pesan Wali Template` doctype atau cukup Link `sekolah` tipis.
3. **Nama doctype + op + signature** dikunci: `Pesan Broadcast`, `Pesan Wali`, `Pengaturan Pesan`;
   3 op outbox; `resolve_pesan_audience(audiens_type, audiens_filter)`; kontrak `parent.list_pesan` 2-arah.
4. **Scope guru mapel**: guru non-wali-kelas boleh kirim ke siswa yang DIA ajar (Anggota Rombel ∩
   mapel-saya) atau hanya homeroom? Menentukan query izin + sumber roster. (Fase 1 FE: homeroom-only.)
5. **Ambang persetujuan N** (`ambang_persetujuan`) ≈ 100 penerima? + peran staf mana yang boleh
   buat+submit draft broadcast vs hanya Kepsek yang approve.
6. **SLA window**: 1×24 jam KERJA vs 24h wall-clock (default `sla_jam_balas`).
7. **Scope reply parent app**: `parent.list_pesan` 2-arah menambah input balasan ke app
   parent/student yang kini read-only — disetujui iterasi ini, atau Guru Fase 1 outbound-only?
8. **Jembatan broadcast→parent**: broadcast Kepsek/TU harus materialisasi sebagai row Contact
   Inbox `nis=null` yang sudah dirender `/pesan` read-only parent — konfirmasi doc_event menulis row itu.

## §1 — Doctype `Pesan Broadcast` (MERGE TU + Kepsek)

Satu entitas "kampanye outbound resmi dengan audiens + lifecycle persetujuan". Menggabung
`Pesan Broadcast` (TU) + `Pengumuman Sekolah` (Kepsek) — sama, beda altitude.

```
Fields:
  judul                Data, reqd
  audiens_type         Select: semua_wali | per_rombel | per_jenjang | penunggak | manual
  audiens_filter       Long Text (JSON descriptor — BUKAN snapshot penerima)
  template             Link → Email Template (native, optional)
  isi                  Text Editor
  channels             Small Text / multi (WA | Email | Notif)
  jadwal               Datetime, nullable (null = kirim sekarang)
  status               Select: Draf | Menunggu Kepsek | Terjadwal | Terkirim | Sebagian-gagal
  total_penerima       Int (computed saat resolve)
  terkirim_count       Int
  gagal_count          Int
  workflow_state       (diisi Workflow)
  sekolah              Link → Sekolah, reqd  ← TENANT ANCHOR
```

- Controller `validate`: resolve `audiens_filter` → `total_penerima` (panggil `resolve_pesan_audience`).
- Controller `on_submit` (hooks doc_events): fan-out 1 row `Mobile Outbox Entry` per penerima
  (`op=send_broadcast`, `response={to, broadcast, body}`, `idempotency_key` unik); bila `jadwal`
  ke depan → serahkan ke scheduler native (jangan cron OS). Set counts.
- **MUST register** di `tenant_registry.py` `DOCTYPES['SCHOOL']` (else bocor antar-tenant — gotcha
  manajemen-aset memory). Anchor = `sekolah` Link.
- **Workflow fixture** `Persetujuan Pengumuman`: `Draf → Menunggu Kepsek → Disetujui/Ditolak`,
  transisi Approve di-gate ke role `Kepala Sekolah` (mirror `workflow_mutasi_siswa.json`). State
  strings HARUS sama dgn FE `lib/pesanApproval.ts` (`Draf`/`Menunggu Kepsek`/`Disetujui`/`Ditolak`).
- **Routing approval (fail-SAFE)**: bila `Pengaturan Pesan.wajib_persetujuan_resmi` ATAU
  `total_penerima ≥ ambang_persetujuan` → submit masuk `Menunggu Kepsek`; else kirim langsung.
  Default bila Single belum ada = WAJIB approval (jangan fail-open).

## §2 — Doctype `Pesan Wali` (Guru, thread 2-arah)

```
Fields:
  siswa         Link → Siswa, reqd
  rombel        Link → Rombongan Belajar
  guru          Link → User (pengirim)
  wali_phone    Data (snapshot no_hp wali primary saat kirim)
  kategori      Select: Kehadiran | Akademik | PR | Umum
  isi           Small Text
  arah          Select: keluar | masuk
  thread_key    Data (group percakapan = siswa+guru)
  status        Select: Terkirim | Menunggu Balasan | Dibalas | Selesai
  channel       Select: WA | InApp
  broadcast_key Data, optional (group fan-out 1-rombel)
  sekolah       Link → Sekolah, reqd  ← TENANT ANCHOR
```

- Controller `on_insert` (doc_events): bila `arah=keluar` enqueue `Mobile Outbox Entry`
  (`op=send_pesan_wali`, `response={to, siswa, body, pesan_wali}`) + set `status=Menunggu Balasan`.
- **Register** tenant_registry `DOCTYPES['SCHOOL']`.
- **Permission query** (hooks `permission_query_conditions`): guru hanya lihat thread siswanya
  (wali_kelas, atau mapel-saya bila §0.4 = mapel-scope).
- Justifikasi vs native: Notification = fire-and-forget tanpa capture balasan / threading; Email
  Template = konten saja. Thread+status butuh doctype nyata.

## §3 — Edit `parent.list_pesan` (2-arah) + jembatan broadcast

- `sekolahpro/api/parent.py` `list_pesan`: merge `Pesan Wali` `arah=keluar` ke inbox parent;
  terima balasan parent → buat `Pesan Wali` `arah=masuk` + set sumber `status=Dibalas`.
- `on_submit` `Pesan Broadcast`: untuk channel in-app, tulis row Contact Inbox `nis=null`
  (jembatan ke `/pesan` parent read-only existing).

## §4 — Single `Pengaturan Pesan` (config per-sekolah)

```
  sla_jam_balas         Int, default 24
  wajib_persetujuan_resmi  Check, default 1 (fail-safe)
  ambang_persetujuan    Int, default 100
```
- **Register** tenant_registry. FE `pesanSla.ts` sudah fallback ke konstanta bila Single absen.

## §5 — Whitelisted methods (HTTP entry ≤10 baris, delegate ke controller)

- `resolve_pesan_audience(audiens_type, audiens_filter)` → `{recipients:[{to,nama,...}], count}`.
  Server = sumber kebenaran (FE count badge advisory). Tenant + permission divalidasi server-side,
  jangan percaya FE. Resolusi: Anggota Rombel→wali contact; Tagihan unpaid→penunggak.
- `pesan_comm_health(sla_jam?)` → agregasi **full-table** Contact Inbox (3 sinyal + seri 7-hari).
  Promosi dari FE client-side (kini hanya ~loaded rows) ke kebenaran full-inbox untuk Panel Kepsek.

## §6 — Tests (CRITICAL: `bench run-tests` unittest, BUKAN pytest)

Gotcha (memory absensi): CI gate = `bench --site … run-tests` (unittest); pytest absen di
container. Tulis `FrappeTestCase`. Pakai `make_*_fixture` yang ada. Cakupan:
- Tenant-scope: `Pesan Broadcast`/`Pesan Wali`/`Pengaturan Pesan` tak bocor antar sekolah (registry).
- Fan-out `on_submit`: N penerima → N Mobile Outbox rows, op + idempotency_key benar.
- Workflow transitions: Draf→Menunggu Kepsek→Disetujui; hanya role Kepala Sekolah boleh Approve.
- Routing fail-safe: Single absen → wajib approval; `total_penerima ≥ N` → Menunggu Kepsek.
- `resolve_pesan_audience`: per_rombel/penunggak/manual resolve + count akurat + tenant-scoped.
- `parent.list_pesan` 2-arah: balasan → `arah=masuk` + status=Dibalas.

## §7 — Build order

```
0. Sepakati §0 (gateway + nama + signature + multi-tenant + scope). Kunci kontrak.
1. Pengaturan Pesan Single + register + tests (config dulu, dipakai routing).
2. resolve_pesan_audience + pesan_comm_health + tests (read-only, low risk).
3. Pesan Broadcast doctype + Workflow fixture + on_submit fan-out + register + tests.
4. Pesan Wali doctype + on_insert + permission_query + register + tests.
5. parent.list_pesan 2-arah + jembatan broadcast Contact Inbox nis=null + tests.
6. bench migrate + restart; verifikasi op baru dikenali gateway worker.
7. (web repo) Flip FE seams: buka composer/Meja/thread, ganti label "Antre"→status nyata
   per channel, hapus stub "menunggu aktivasi server". Re-verify tsc/eslint/vitest/build.
```

## §8 — FE re-wiring setelah BE landing (di repo web ini)

- `lib/pesan/broadcast.ts` (BARU, seam mirror `lib/ppdbApi.ts`): hooks `useResource*` /
  `useFrappeMethod` atas Pesan Broadcast + `resolve_pesan_audience`.
- TU: route `pesan.buat`/`pesan.riwayat`/`pesan.template` + `AudienceBuilder`/`TemplatePicker` +
  bulk multi-select di MasukDesk; tambah ke `PESAN_NAV_GROUPS`.
- Kepsek: `MejaPersetujuanPesan` (apply_workflow, mirror `MejaPersetujuanKelas`) +
  `KomposerPengumuman`; ganti stub di `PanelKepsek`; `pesan_comm_health` ganti SLA client-side.
- Guru: `lib/pesan/compose.buildPesanWaliPayload` (sudah ada) wire ke `StudentSheet.tsx` +
  `kelas.saya.tsx` (tombol Alpa/Antrean + Pesan Satu Kelas) + `TindakLanjutSaya` (thread 2-arah).
- Catatan deploy BE (gotcha OCR memory): BE bind-mounted dari MAIN checkout → docker bench tak
  lihat worktree; commit ke branch yang ter-mount atau koordinasi sesi.

## Open questions (turunan §0, untuk human/BE team)
Semua item §0 adalah blocker. Tambahan: snapshot `wali_phone` stale vs live re-resolve?;
channel Notif in-app — pipeline push ada? (kalau tidak, sembunyikan chip, jangan channel mati).
```
