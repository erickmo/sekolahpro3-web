# Perpustakaan — Sirkulasi Merged Interface

**Date:** 2026-05-25
**Scope:** apps/school (frontend) + apps/sekolahpro/docs (docs only)
**Status:** Design approved, ready for plan

## Problem

Perpustakaan saat ini terpisah jadi tiga rute paralel:

- `/perpustakaan/peminjaman` — daftar transaksi pinjam
- `/perpustakaan/pengembalian` — daftar pengembalian (mirror peminjaman selesai)
- `/perpustakaan/denda` — daftar denda

Akibatnya:

1. Petugas harus pindah tab untuk satu alur kerja (pinjam → kembali → bayar denda).
2. Action **Kembalikan** di detail peminjaman saat ini hanya `db.set_value(status="Selesai")` — **bypass** doctype `Pengembalian Buku` sehingga `on_submit` tidak dipanggil → eksemplar tidak dilepas, denda tidak ter-generate, reservasi berikutnya tidak diaktivasi.
3. Pembuatan pengembalian/denda manual via "Create" modal mengundang inkonsistensi dengan backend.

## Goal

Satu antarmuka **Peminjaman** sebagai pusat sirkulasi:

- List peminjaman dengan filter status (default: belum kembali).
- Return flow lewat doctype `Pengembalian Buku` (submit) → backend auto-generate `Denda Perpustakaan` lewat hook eksisting.
- Denda dilihat & dilunasi inline dari konteks peminjaman, tanpa rute terpisah.
- Trigger pengembalian dapat diakses dari detail anggota dan detail buku.

## Non-Goals

- Tidak menambah doctype baru.
- Tidak mengubah skema `Peminjaman Buku`, `Pengembalian Buku`, atau `Denda Perpustakaan` kecuali satu field denormalized opsional (lihat §6).
- Tidak menyentuh `/perpustakaan/reservasi`, `/perpustakaan/anggota`, `/perpustakaan/daftar`, `/perpustakaan/laporan`.
- Tidak mendesain payment multi-method/cicilan untuk denda — hanya toggle Lunas / Diputihkan.

## Backend confirmation (eksisting, tidak diubah)

`apps/sekolahpro/sekolahpro/perpustakaan/doctype/pengembalian_buku/pengembalian_buku.py`:

```python
def on_submit(self):
    self._kembalikan_eksemplar()
    self._buat_denda_jika_terlambat()
    self._update_status_peminjaman()
```

- `_hitung_total_denda` dipanggil di `validate`, pakai `Pengaturan Perpustakaan.denda_per_hari` (Single doctype, fields: `denda_per_hari`, `maks_eksemplar_pinjam`, `maks_durasi_pinjam`, `maks_reservasi_aktif`, `blokir_pinjam_ada_denda`).
- `_buat_denda_jika_terlambat` membuat `Denda Perpustakaan` dengan link `pengembalian` (bukan langsung `peminjaman`).

## Design

### 1. Routes

Hapus:

- `apps/school/src/routes/perpustakaan.pengembalian.tsx`
- `apps/school/src/routes/perpustakaan.pengembalian.$name.tsx`
- `apps/school/src/routes/perpustakaan.denda.tsx`
- `apps/school/src/routes/perpustakaan.denda.$name.tsx`

Pertahankan & perluas:

- `apps/school/src/routes/perpustakaan.peminjaman.tsx`
- `apps/school/src/routes/perpustakaan.peminjaman.$name.tsx`

Tab di `perpustakaan.tsx` jadi:

```
Dashboard | Katalog Buku | Peminjaman | Reservasi | Anggota | Laporan
```

### 2. List page — Peminjaman

Kolom:

- `name` (No. Peminjaman, monospace)
- `anggota`
- `buku` (judul; ambil dari first item)
- `tanggal_pinjam`
- `tanggal_kembali_rencana`
- `status` (badge)
- `total_denda` (Currency; tampil "—" jika 0)
- `_actions` (per row): tombol kondisional:
  - status ∈ {Aktif, Terlambat} → **Kembalikan** (buka modal §3)
  - ada denda Belum Lunas → **Bayar Denda** (buka drawer §4)

Filter:

- `selectFilter` status: `Semua | Aktif | Terlambat | Selesai | Hilang | Batal`
- Default URL param: `?status=BelumKembali` → server-side filter `["status", "in", ["Aktif", "Terlambat"]]`
- Quick chips di header: **Belum Kembali** (default), **Ada Denda**, **Semua**
  - "Ada Denda" → query peminjaman yang punya denda Belum Lunas (lihat §6 untuk strategi query)
- Search fields: `name`, `anggota`, `buku`

Sort default: `tanggal_pinjam desc`.

### 3. Return modal

Trigger: tombol **Kembalikan** dari row list, dari detail peminjaman, dari section "Peminjaman Aktif" di detail anggota, dan dari section "Sedang Dipinjam" di detail buku.

Field:

- `tanggal_kembali_aktual` (date, default today)
- `kondisi_kembali` (select: Baik / Rusak Ringan / Rusak Berat / Hilang)
- `catatan` (textarea, opsional)
- `petugas` (text, prefill dari session user kalau tersedia)

Submit:

1. `POST /api/method/frappe.client.insert` payload `Pengembalian Buku` (docstatus=0)
2. `POST /api/method/frappe.client.submit` doc tersebut → memicu `on_submit` (denda + eksemplar + status)
3. Invalidate queries: `["resource:list", "Peminjaman Buku"]`, `["resource:doc", "Peminjaman Buku", name]`, `["resource:list", "Denda Perpustakaan"]`
4. Toast: `"Pengembalian tercatat."` + suffix `" Denda: Rp {total}"` jika `total_denda > 0` (refetch peminjaman untuk dapatkan nilai)

Error handling: tampilkan pesan dari Frappe (mis. peminjaman sudah selesai → "Peminjaman X sudah selesai.").

### 4. Denda payment drawer

Trigger: tombol **Bayar Denda** dari row, atau section Denda di detail peminjaman.

Konten drawer (atau Modal `size=sm`):

- Daftar denda terkait (umumnya 1 row, tapi support N):
  - `name`, `hari_terlambat`, `denda_per_hari`, `total_denda`, `status_bayar`
- Action per denda:
  - **Tandai Lunas** → PATCH `Denda Perpustakaan` `{status_bayar: "Lunas", tanggal_lunas: today}`
  - **Putihkan** (visible bila session user punya role `Sekolah Manager`/admin) → PATCH `{status_bayar: "Diputihkan"}`

Query denda untuk satu peminjaman: lihat §6.

### 5. Detail peminjaman

Section baru pada `perpustakaan.peminjaman.$name.tsx`, di bawah `primaryInfo`:

- **Pengembalian** (jika ada doc `Pengembalian Buku` dengan `peminjaman={name}`):
  - `tanggal_kembali_aktual`, `kondisi_kembali`, `petugas`, `catatan`
  - Link ke doc Pengembalian (atau read-only inline; rute detail pengembalian sudah dihapus, jadi inline)
- **Denda** (jika ada): reuse drawer content §4 inline.

Action bar:

- Hapus tombol "Kembalikan" lama yang `set_value` status. Ganti tombol baru yang membuka modal §3.
- Pertahankan: **Perpanjang**, **Batalkan**.
- Tambah: **Bayar Denda** (jika ada denda Belum Lunas).

### 6. Data access strategy

`Denda Perpustakaan` saat ini link ke `pengembalian` (bukan langsung `peminjaman`). Dua opsi:

**Opsi A (preferred): tambah field denormalized `peminjaman` di `Denda Perpustakaan`.**

- Migration: tambah Link field `peminjaman` (target `Peminjaman Buku`), populated di `_buat_denda_jika_terlambat` dari `peminjaman.name`.
- Backfill patch untuk data lama: query semua denda, isi dari `Pengembalian Buku.peminjaman`.
- Query FE jadi 1-hop: `Denda Perpustakaan` filter `peminjaman in [...]`.

**Opsi B: 2-hop query.**

- FE list peminjaman → query `Pengembalian Buku` filter `peminjaman in [...]` → query `Denda Perpustakaan` filter `pengembalian in [...]`.
- Tidak perlu migration. Latency 3 request bertingkat untuk halaman list.

**Rekomendasi:** Opsi A. Migration kecil dan menyederhanakan semua query denda lain di masa depan. Backfill patch idempotent (skip kalau field sudah terisi).

Untuk `total_denda` per-row di list peminjaman: tambah whitelisted method ringan `sekolahpro.perpustakaan.api.get_denda_summary(peminjaman_names: list[str])` yang return `dict[peminjaman_name, {total, status_bayar}]`. Hindari N+1.

### 7. Cross-context return triggers

- `apps/school/src/routes/perpustakaan.anggota.$name.tsx`: tambah section "Peminjaman Aktif" → list peminjaman `anggota={name}` `status in [Aktif, Terlambat]` → action **Kembalikan** per row (buka modal §3 dengan peminjaman preselected).
- `apps/school/src/routes/perpustakaan.$isbn.tsx` (detail buku): tambah section "Sedang Dipinjam" → list peminjaman aktif yang punya item dengan buku ini → action **Kembalikan**.

Modal §3 menerima prop `peminjaman: name` (preselected, field disabled).

### 8. Redirects (kompatibilitas bookmark)

Tambah route handler redirect (TanStack Router `beforeLoad` → throw `redirect()`):

- `/perpustakaan/pengembalian` → `/perpustakaan/peminjaman?status=Selesai`
- `/perpustakaan/pengembalian/$name` → resolve `Pengembalian Buku.peminjaman`, redirect ke `/perpustakaan/peminjaman/{peminjaman}`; fallback `/perpustakaan/peminjaman?status=Selesai` jika gagal
- `/perpustakaan/denda` → `/perpustakaan/peminjaman?denda=ada`
- `/perpustakaan/denda/$name` → resolve `Denda Perpustakaan.peminjaman` (setelah Opsi A), redirect ke detail peminjaman; fallback list

Redirect routes adalah file route minimal — bukan halaman, hanya forwarding.

### 9. Komponen yang dihapus / disusutkan

- `apps/school/src/components/perpustakaan/PerpCreateModal.tsx`: tetap dipakai untuk **Peminjaman** (Pinjam Baru). Hapus pemakaian untuk Pengembalian & Denda.
- Form Pengembalian: dipindah ke komponen baru `ReturnModal` (khusus, karena ada submit + post-action invalidate).
- Form Denda manual create: dihapus seluruhnya (denda hanya lahir dari hook).

### 10. Docs

- Update `apps/sekolahpro/docs/domains/perpustakaan/spec.html` dan `README.html`:
  - Tambahkan section "Alur Sirkulasi" yang menggambarkan: Pinjam → Kembalikan (modal) → backend `Pengembalian Buku.on_submit` → Denda otomatis → Bayar/Putihkan.
  - Hapus referensi ke rute web `/perpustakaan/pengembalian` dan `/perpustakaan/denda`.
- Update `apps/sekolahpro/docs/domains/perpustakaan/entities/*.html` jika ada diagram relasi (verifikasi saat implementasi).
- Spec ini (file saat ini) jadi sumber kebenaran untuk perubahan FE.

## Testing

- Vitest: unit untuk `ReturnModal` (submit payload, error mapping), unit untuk filter URL param (`status=BelumKembali`, `denda=ada`).
- Manual via Playwright: alur Pinjam → Kembalikan dengan keterlambatan → verifikasi denda muncul di drawer → Tandai Lunas → row tidak lagi punya badge "Ada Denda". (Catatan: blocker pre-existing "Rendered more hooks" perlu di-resolve dulu di rute peminjaman untuk e2e penuh.)
- Backend: pengembalian doctype sudah punya tests existing (verifikasi tidak break).

## Migration & rollout

1. Backend: tambah field `peminjaman` di `Denda Perpustakaan` + patch backfill + update `_buat_denda_jika_terlambat` untuk isi field tersebut.
2. Backend: whitelisted method `get_denda_summary`.
3. FE: tambah `ReturnModal`, `DendaDrawer`, ubah `peminjaman.tsx` list & `$name.tsx` detail.
4. FE: tambah redirect routes untuk URL lama.
5. FE: hapus rute Pengembalian & Denda + komponen mati.
6. Docs: update HTML domain docs.
7. PR satu paket (FE + BE field/method + docs).

## Risiko

- **Bookmark eksternal** ke `/perpustakaan/denda/$name`: ter-cover oleh redirect §8, tapi user perlu re-bookmark.
- **Migrasi backfill**: aman karena field baru opsional, default null. Patch idempotent.
- **`get_denda_summary` performance**: query satu request per page render. Tidak ada loop N+1 karena batch via list peminjaman id. Cap di 100 peminjaman per request (sesuai page size).
- **Race condition** klik "Kembalikan" ganda: backend `_validasi_peminjaman_aktif` throw `"Peminjaman X sudah selesai."` — error muncul di toast, list invalidated.
