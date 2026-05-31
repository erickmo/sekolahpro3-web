# Akademik — Penilaian Operasional

Hub: `/sch/:sekolah/akademik`. **Operasional saja** (input test → entri nilai → raport).
Setup (Tahun Ajaran, Kurikulum, Mapel, KKM, Komponen Nilai, Konfigurasi) pindah ke
modul **Master Data** (`/sch/:sekolah/master`, grup "Akademik").

## Pemisahan Akademik vs Master

| Modul | Isi | Tujuan |
|---|---|---|
| **Akademik** | Dashboard · Input Nilai Test · Entri Nilai · Raport | Kerja harian guru per periode |
| **Master Data** › Akademik | Tahun Ajaran · Kurikulum · Mapel · Komponen Nilai · KKM · Konfigurasi | Setup sekali, jarang berubah |

Dashboard Akademik `ModuleFlow` merentang dua modul: langkah setup (kurikulum→komponen)
nge-link ke Master, langkah operasional (test→entri→raport) tetap di Akademik.

## Konteks periode

`AkademikContextProvider` simpan **Tahun Ajaran + Semester** di URL search (`?ta=…&semester=…`).
`AkademikContextBar` hanya muncul di halaman operasional yang filter per periode
(`CONTEXT_BAR_PREFIXES`: asesmen, entri-nilai, raport). Setup tak butuh → bar disembunyikan.

## Alur Input Nilai Test (Asesmen)

Input nilai cepat **satu test untuk satu kelas** — alternatif ringan dari Entri Nilai
(yang rekap per siswa × komponen).

1. **Pilih kelas & mapel** — `SearchableSelect` Rombongan Belajar (status Aktif) + Mata Pelajaran.
   Keduanya wajib sebelum daftar test tampil.
2. **Daftar Test** — list `Asesmen` difilter rombel + mapel + TA aktif, urut `tanggal desc`.
3. **Test Baru** (`CreateTestModal`) — judul, tanggal, komponen, semester, TA → `createResource("Asesmen")`.
   Komponen difilter per mapel terpilih. `sekolah` diisi dari `activeSekolah` sesi.
   Sukses → navigate ke halaman input.
4. **Input nilai** (`AsesmenInput`) — grid 1 baris/siswa, ambil anggota rombel aktif
   (`Anggota Rombel`, urut `no_urut`) + info siswa (nama, NIS).

### Perilaku grid input

- Nilai **0–100**, validasi per sel (`clampNilai`); kosong = belum dinilai.
- **Autosave on-blur**: keluar dari kolom → `updateResource` kirim **seluruh** array `nilai`
  (Frappe ganti semua child rows; baris kosong di-drop).
- **Enter** = simpan baris + lompat ke siswa berikut (`focusRow`).
- Status per sel: `idle → dirty → saving → saved | error`. Badge merah saat invalid/gagal.
- StatCard ringkasan: Terisi (n/total) · Rata-rata · Tertinggi.

## Routes

| Route | DocType | Aksi |
|---|---|---|
| `…/akademik` (index) | Mata Pelajaran, KKM, Kurikulum, Komponen | Dashboard: cut-off raport, KKM belum diatur, alur, perlu perhatian |
| `…/akademik/asesmen` | Asesmen | Pilih rombel+mapel, list test, buat test baru |
| `…/akademik/asesmen/$id` | Asesmen | Input nilai per siswa (autosave) |
| `…/akademik/entri-nilai` | — | Rekap nilai per siswa × komponen |
| `…/akademik/raport` | — | Susun & cetak raport |

## DocType Asesmen

| Field | Isi |
|---|---|
| `judul` | mis. "Ulangan Harian Bab 3" |
| `komponen` | link Komponen Nilai (UH/UTS/UAS), difilter per mapel |
| `mata_pelajaran` · `rombel` | link mapel + Rombongan Belajar |
| `semester` · `tahun_ajaran` | konteks periode |
| `tanggal` | tanggal pelaksanaan |
| `nilai[]` | child rows `{ siswa, nilai }` — diganti utuh tiap autosave |

## Komponen kunci

| File | Peran |
|---|---|
| `routes/sch.$sekolah.akademik.tsx` | Layout: nav grup + context bar kondisional |
| `lib/akademikContext.tsx` | Provider TA+Semester (URL search) |
| `components/akademik/AkademikContextBar.tsx` | Selector periode |
| `components/akademik/AsesmenInput.tsx` | Grid input nilai + autosave on-blur |
| `routes/…asesmen.index.tsx` | Filter rombel/mapel + `CreateTestModal` |
| `components/akademik/EntriNilaiGrid.tsx` | Rekap nilai per komponen |

> Master Data pakai `MegaMenuNav` (dropdown); Akademik pakai `GroupedNavTabs`.
