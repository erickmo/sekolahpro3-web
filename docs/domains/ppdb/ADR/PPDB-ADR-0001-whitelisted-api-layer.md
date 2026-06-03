# PPDB-ADR-0001: Lapisan API whitelisted di atas CRUD doctype mentah

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: ppdb

## Konteks

Modul PPDB (Penerimaan Peserta Didik Baru) mengelola alur admisi multi-tahap:
pendaftaran → verifikasi dokumen → seleksi → pengumuman → pembayaran → daftar ulang.
Tiap tahap butuh validasi bisnis, transisi status terkoordinasi, dan invalidasi cache
lintas-resource (Pendaftaran PPDB, Seleksi PPDB, Pembayaran PPDB, Daftar Ulang PPDB).

Redesain PPDB (`docs/superpowers/specs/2026-06-01-redesain-ppdb-design.md`) menegaskan
*presentation layer only* — endpoint data, nama doctype/field, dan business rule backend
dipertahankan verbatim. Frontend butuh permukaan API stabil, type-safe, dan terpisah
concern, tanpa akses langsung ke CRUD doctype.

## Keputusan

Alur PPDB didorong oleh **dedicated whitelisted `@frappe.whitelist()` method** (backend
`sekolahpro.ppdb.api.ppdb`), bukan operasi `insert`/`update` doctype mentah. Frontend
mengonsumsinya lewat TanStack Query mutation dengan tipe terstruktur (`apps/school/src/lib/ppdbApi.ts`).

Lima mutasi utama mendefinisikan tahapan:

1. `verifikasi_pendaftaran` — set status Diverifikasi + catatan pada Pendaftaran PPDB
2. `set_hasil_seleksi` — set hasil (Lulus/Tidak Lulus) pada Seleksi PPDB
3. `umumkan_hasil` — transisi massal pengumuman untuk gelombang aktif
4. `finalisasi_pendaftaran` — selesaikan Pendaftaran → buat doctype Siswa bila lulus
5. `create_payment_order` — inisiasi order pembayaran (Pembayaran PPDB)

Tiap mutasi menerima payload typed, menjalankan validasi + transisi state di backend
(access control, kuota, jatuh tempo), dan menginvalidasi seluruh cache tree PPDB
(`invalidatePpdbCaches()`) supaya list + halaman dokumen refresh atomik.

Keputusan paralel: **antrian kerja sisi-frontend** (`apps/school/src/lib/ppdbQueue.ts`)
adalah pure function `buildWorkQueue(pendaftar[], todayIso)` yang men-segmen action item
staf (dokumen, seleksi, pembayaran, daftar-ulang) tanpa I/O — bukan push dari backend.

## Konsekuensi

### Positif
- **Separation of concerns** — frontend tak pernah mengimplementasi business logic PPDB; backend memegang invariant.
- **Type safety** — tipe mutasi (`VerifikasiStatus`, `HasilSeleksi`, `PaymentOrderResult`) memvalidasi kontrak saat kompilasi.
- **Invalidasi cache atomik** — satu `invalidatePpdbCaches()` menyinkronkan semua resource terdampak.
- **Batas peran jelas** — framing UI per peran (`ppdbRole.ts`) tak menyembunyikan fungsi; access control tetap di backend.
- **Testable** — aggregator + queue builder murni (`ppdbAnalytics.ts`, `ppdbQueue.ts`) diuji penuh tanpa I/O.

### Negatif
- **Latensi per langkah** — tiap tahap adalah round-trip terpisah; optimistic/offline sulit tanpa dukungan backend.
- **Pertumbuhan API surface** — variasi alur baru menambah method di `ppdb.py`; tanpa command pattern generik.
- **Friksi migrasi** — kode lama yang pakai CRUD doctype langsung harus di-refactor ke whitelisted call.

### Trade-off ditunda (YAGNI)
- **Workflow engine polimorfik** (state machine DSL) — belum perlu (pipeline tunggal tetap).
- **Offline queue** untuk mutasi gagal — belum ada use case admisi offline.
- **Webhook → push notification** real-time — polling React Query sudah cukup.

## Referensi
- `apps/school/src/lib/ppdbApi.ts` — mutation TanStack Query + spec invalidasi
- `apps/school/src/lib/ppdbQueue.ts` — derivator antrian kerja murni (inbox staf)
- `apps/school/src/lib/ppdbRole.ts` — framing UI adaptif-peran
- `docs/superpowers/specs/2026-06-01-redesain-ppdb-design.md` — spec presentation-layer-only
- `sekolahpro/ppdb/api/ppdb.py` — endpoint whitelisted backend (repo terpisah, source of truth)
