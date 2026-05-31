# Design — Default & Hardening Periode Akademik (Tahun Ajaran + Semester)

**Date:** 2026-05-31
**Module:** Akademik (`/sch/$sekolah/akademik`)
**Scope:** Full (auto-default + persistence + scope pill + wrong-period safety)
**Status:** Draft — awaiting user review

## Problem

Halaman operasional Akademik (Input Nilai Test / Entri Nilai / Raport) menyaring
data per **periode** = Tahun Ajaran (TA) + Semester. Mekanisme sudah ada:
`AkademikContextBar` (dua `SearchableSelect`, sticky) + state di URL search params
(`?ta=&semester=`) yang dibagi via React context (`useAkademikContext`).

Masalah: bar **default kosong**. User wajib pilih TA tiap kunjungan sebelum data
muncul — friksi tinggi dan layar kosong membingungkan — padahal model data punya
penanda TA aktif (`is_current`) dan window tanggal semester untuk dipakai default.

UX verdict (konsultasi spesialis): pertahankan pola **context bar di header**
(periode = filter atas task, bukan tujuan navigasi → JANGAN pindah ke sidebar).
Perbaiki defaulting, kejelasan scope, persistensi, dan proteksi salah-periode.

## Data model (Tahun Ajaran)

| Field | Tipe | Peran di desain ini |
|-------|------|---------------------|
| `is_current` | Check | Penanda utama TA aktif (per sekolah) |
| `status` | Select (Draft / Aktif / Closed) | Lifecycle; `Closed` punya `tanggal_closed`, `closed_by` |
| `tanggal_mulai`, `tanggal_selesai` | Date | Window TA — dipakai fallback aktif & trigger warning |
| `semester_ganjil_mulai/akhir` | Date | Window semester Ganjil → hitung semester dari tanggal |
| `semester_genap_mulai/akhir` | Date | Window semester Genap |
| `sekolah` | Link | Tenant scope (resolusi & localStorage di-scope per sekolah) |

> Catatan data saat ini: **tidak ada** TA dengan `is_current=1`. Resolution chain
> wajib robust terhadap kondisi ini.

## Decisions (dikonfirmasi user)

- **Sinyal TA aktif:** chain bertingkat — `is_current` dulu, lalu `status=Aktif`
  + hari ini dalam window, lalu TA terbaru.
- **Trigger banner "periode lampau":** `status=Closed` ATAU hari ini di luar
  `tanggal_mulai..tanggal_selesai`.

## Design

### 1. Resolusi periode (modul pure `lib/akademikPeriode.ts`)

Fungsi murni (tanpa DB/session) yang menerima daftar TA + tanggal acuan + nilai
URL + nilai localStorage, mengembalikan `{ ta, semester }` terpilih. Dipakai ≥2
tempat (layout + bar) → justifikasi modul terpisah.

Resolusi **Tahun Ajaran** (urutan berhenti di match pertama):
1. URL `?ta=` (jika valid & ada di daftar)
2. localStorage last-used (key `akademik:periode:<sekolah>`)
3. TA dengan `is_current = 1`
4. TA `status = "Aktif"` dan acuan ∈ `[tanggal_mulai, tanggal_selesai]`
5. TA dengan `tanggal_mulai` terbaru (fallback terakhir)

Resolusi **Semester**:
1. URL `?semester=`
2. localStorage last-used
3. Hitung dari acuan vs window TA terpilih: ∈ ganjil-window → `Ganjil`,
   ∈ genap-window → `Genap`
4. Fallback bulan: Jul–Des → `Ganjil`, Jan–Jun → `Genap`

### 2. Scope pill (ganti dua select kosong)

`AkademikContextBar` menampilkan pernyataan scope, bukan form kosong:
`Tahun Ajaran 2024/2025 · Ganjil ▾`. Klik membuka picker (search TA + pilih
semester). Tetap sticky, tetap hanya di halaman operasional (perilaku
`showContextBar` tidak berubah).

### 3. Persistence

URL search params tetap **source of truth** (sudah ada — survive nav,
shareable, bookmarkable). Tiap perubahan periode disinkron ke `localStorage`
(`akademik:periode:<sekolah>` → `{ ta, semester }`) supaya sesi berikutnya
langsung benar. Saat masuk tanpa URL param, layout meng-redirect (`replace`) ke
URL dengan periode hasil resolusi → satu sumber kebenaran, tidak ada state ganda.

### 4. Wrong-period safety

- **Echo periode** di H1 tiap halaman operasional + di toast simpan
  (cth: "Nilai tersimpan · 2024/2025 Ganjil").
- **Banner peringatan** (kuning) saat TA terpilih `status=Closed` ATAU acuan di
  luar `[tanggal_mulai, tanggal_selesai]`: "Anda mengedit periode lampau/ditutup."
- **Guard ganti periode** saat ada edit belum tersimpan → konfirmasi
  ("Pindah periode? Perubahan belum disimpan akan hilang"). Sumber status
  "dirty" diberikan halaman entri (mis. grid Entri Nilai) ke bar via context.

### 5. No active TA

Tidak pernah bar kosong. Bila chain hanya sampai langkah 5 (tak ada is_current /
Aktif), tetap pilih TA terbaru + tampilkan nudge inline di bar: "Belum ada
Tahun Ajaran aktif — atur di Master Data" (link ke list TA). Bila **nol** TA,
halaman operasional menampilkan empty-state setup yang menunjuk ke Master Data,
bukan filter kosong.

## Components & boundaries

| Unit | Tanggung jawab | Depends on |
|------|----------------|-----------|
| `lib/akademikPeriode.ts` (baru) | Resolusi TA+semester, hitung semester dari tanggal, baca/tulis localStorage. Pure + testable. | — |
| `lib/akademikContext.tsx` | Bawa nilai periode + meta (TA terpilih, flag `isPastPeriod`) + `dirty`/`setDirty`. | React |
| `routes/sch.$sekolah.akademik.tsx` | Fetch daftar TA, jalankan resolusi, redirect ke URL ter-resolve, sediakan provider. | api-client, akademikPeriode |
| `components/akademik/AkademikContextBar.tsx` | Render pill + picker + banner + nudge + guard switch. | context, ui |
| Halaman operasional (asesmen/entri-nilai/raport) | Echo periode di H1, toast simpan, lapor `dirty`. | context |

## Error handling

- Daftar TA gagal load → bar tampil state "memuat/gagal", halaman operasional
  tahan render tabel sampai TA ter-resolve (hindari query dengan TA kosong).
- localStorage tak tersedia / korup → abaikan, lanjut ke langkah resolusi
  berikutnya (jangan throw).
- URL `?ta=` menunjuk TA yang tak ada di daftar (mis. ganti sekolah) → buang,
  resolusi ulang.

## Testing

- `akademikPeriode.test.ts` (pure): tiap langkah chain TA; hitung semester dari
  window & fallback bulan; acuan 2026-05-31 → Genap; localStorage round-trip;
  input korup/kosong.
- `AkademikContextBar.test.tsx`: render pill dari nilai resolved; banner muncul
  saat Closed / di luar window; nudge saat tak ada TA aktif; guard switch saat
  dirty.
- Resolusi di layout: redirect ke URL ter-resolve saat masuk tanpa param.

## Out of scope (YAGNI)

- Mengubah doctype / menambah field backend.
- Mengelola `is_current` dari UI web (tetap di Master Data).
- Periode default di modul non-Akademik.
