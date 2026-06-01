# Redesain Modul Perpustakaan

Dokumen ini merangkum redesain modul **Perpustakaan** pada aplikasi `apps/school`.
Tujuan redesain: membuat modul perpustakaan **semudah mungkin dipakai petugas
sirkulasi untuk operasional harian**, mempercepat onboarding petugas baru lewat
panduan per-halaman, dan menyajikan data lewat visualisasi yang ringkas.

- Branch: `feat/perpustakaan-redesign`
- Worktree: `apps/sekolahpro-web/.worktrees/perpus-redesign`
- Lokasi kode: `apps/school/src` (rute perpustakaan di `src/routes/.../perpustakaan`)

---

## 1. Sudut Pandang Petugas Sirkulasi (Daily-Ops POV)

Modul dibingkai dari kacamata orang yang menjalankan meja sirkulasi setiap hari.
Tiga peran dikenali, tetapi **peran hanya membingkai UI (label, fokus, penekanan)
— tidak pernah menyembunyikan fitur**. Kontrol akses sesungguhnya tetap di backend.

1. **Petugas Sirkulasi** (`petugas`) — POV utama: pinjam, kembali, reservasi, denda
   di meja layanan. Default ketika peran tak terdeteksi.
2. **Kepala Perpustakaan** (`pustakawan`) — pengawasan koleksi, approval insiden,
   dan laporan.
3. **Administrator** (`admin`) — katalog, kategori, pengadaan, dan inventaris.

Penentuan peran dipusatkan di helper peran (lihat Foundation), bukan pengecekan
yang tersebar. Peran dipakai untuk menandai langkah panduan dan menampilkan
identitas pengguna di bar konteks.

---

## 2. Komponen Foundation

### a. Helper Peran Generik (`lib/sessionRole.ts`) + `lib/perpustakaanRole.ts`
`sessionRole.ts` adalah mesin generik (domain-agnostic) untuk menurunkan peran
kasar dari sesi Frappe: normalisasi string peran, pemetaan via tabel matcher, dan
pemilihan peran utama. `perpustakaanRole.ts` memakainya untuk memetakan peran
Frappe ke bucket perpustakaan (`petugas` / `pustakawan` / `admin`) dengan default
`petugas`. Permissive-by-design: bila tak ada peran cocok, semua bucket diberikan.

### b. Bar Konteks (`components/perpustakaan/PerpustakaanContextBar.tsx`)
Bar sticky di atas setiap halaman: menampilkan label peran aktif, fokus harian
peran tersebut, dan slot aksi utama (tombol **Buka Terminal Sirkulasi**). Tidak
bergantung router (aksi dilewatkan sebagai slot) sehingga mudah diuji.

### c. PageGuide + Konten Terpusat (`components/perpustakaan/pageGuides.ts`)
Panduan per-halaman ("Cara pakai halaman ini") yang bisa dibuka/tutup dan diingat
status­nya per halaman. Komponen `PageGuide` generik di-decouple dari modul
akademik lewat prop `roleLabels`. Konten panduan tiap halaman dipusatkan di
`pageGuides.ts` dan dirender lewat `<PerpPageGuide id="…" />` — satu tag per
halaman. Langkah panduan ditandai peran agar petugas/pustakawan/admin tahu mana
yang relevan untuk mereka.

### d. Komponen Visualisasi (`components/viz`) + `dashboardViz.ts`
Komponen chart reusable (Donut, ProgressRing, BarChart, HBarChart, DistributionBar,
Sparkline) — murni presentational, dependency-free SVG. Agregasi data untuk
dashboard dihitung oleh fungsi murni di `dashboardViz.ts` (teruji unit), dari data
yang sudah diambil halaman — tanpa query backend tambahan.

---

## 3. Navigasi Berbasis Alur Kerja

Tab datar lama (10 tab sejajar) ditata ulang menjadi grup berbasis alur kerja
harian (komponen `GroupedNavTabs`, varian inline):

- **Operasi Harian**: Dashboard, Terminal, Peminjaman, Reservasi
- **Koleksi**: Katalog Buku, Kategori, Inventaris
- **Pengadaan & Anggota**: Pengadaan, Anggota
- **Laporan**: Laporan

Pengembalian & Denda **bukan** tab terpisah — sesuai `PERP-ADR-0001` keduanya
adalah tampilan terfilter dari hub **Peminjaman**, dijangkau dari daftar
"Perlu Perhatian" di dashboard dan dari filter hub itu sendiri.

---

## 4. Perubahan Per-Halaman

- **Dashboard** — ditambah PageGuide onboarding + bagian visualisasi: Status
  Sirkulasi (donut), Kesehatan Sirkulasi (progress ring tepat-waktu vs terlambat),
  Koleksi per Kategori (horizontal bar), dan Tren Peminjaman 7 hari (bar chart).
  Kartu statistik, "Perlu Perhatian", dan alur modul dipertahankan.
- **Terminal Sirkulasi** — PageGuide menuntun alur scan kartu → scan eksemplar →
  konfirmasi untuk petugas baru.
- **Peminjaman & Sirkulasi** — PageGuide menjelaskan hub terpadu (pinjam baru,
  pengembalian & denda via filter, detail transaksi).
- **Katalog Buku, Kategori, Reservasi, Pengadaan, Anggota, Inventaris, Laporan** —
  masing-masing diberi PageGuide kontekstual ber-tag peran.

---

## 5. Visualisasi yang Ditambahkan

- **Status Sirkulasi** — sebaran status transaksi (Aktif/Terlambat/Selesai/Hilang).
- **Kesehatan Sirkulasi** — persen peminjaman aktif yang tepat waktu vs terlambat.
- **Koleksi per Kategori** — jumlah judul per kategori (8 terbanyak).
- **Tren Peminjaman 7 Hari** — jumlah transaksi pinjam per hari hingga hari ini.

Semua dihitung dari data yang sudah dimuat dashboard (tanpa beban query tambahan)
dan bersifat presentational sehingga mudah diuji & dipakai ulang.

---

## 6. Cara Mereview

1. Gunakan branch `feat/perpustakaan-redesign` (worktree `.worktrees/perpus-redesign`).
2. Jalankan dev server: direktori `apps/school`, perintah `pnpm dev`.
3. Telusuri rute perpustakaan dan periksa pada tiga peran (petugas, pustakawan, admin):
   - Bar konteks menampilkan peran & fokus yang benar, tombol Terminal berfungsi.
   - PageGuide muncul dan relevan di tiap halaman; status buka/tutup tersimpan.
   - Navigasi tergrup sesuai alur harian; Pengembalian/Denda mengarah ke hub Peminjaman.
   - Visualisasi dashboard menampilkan data dengan benar, responsif, dan aman saat kosong.

---

## 7. Pengujian (TDD)

Logika inti dikembangkan test-first. Berkas test baru:

- `lib/__tests__/sessionRole.test.ts` — derivasi peran generik.
- `lib/__tests__/perpustakaanRole.test.ts` — pemetaan peran perpustakaan + hook.
- `components/perpustakaan/__tests__/dashboardViz.test.ts` — agregasi visualisasi.
- `components/perpustakaan/__tests__/PerpustakaanContextBar.test.tsx` — bar konteks.
- `components/perpustakaan/__tests__/PerpPageGuide.test.tsx` — konten & render panduan.
- `components/guide/__tests__/PageGuide.test.tsx` — decoupling `roleLabels`.

---

## 8. Catatan Teknis

- Foundation (`viz`, `PageGuide`, helper peran, bar konteks) dibuat reusable agar
  perubahan tampilan/logika peran cukup di satu tempat.
- `PageGuide` kini netral-modul: label peran dipasok via prop `roleLabels`,
  dengan fallback ke label akademik lalu ke key mentah, sehingga pemanggil lama
  (Akademik) tetap berjalan tanpa perubahan.
- Halaman tetap menyiapkan/merapikan data; komponen `viz` hanya menyajikan,
  menjaga pemisahan tanggung jawab tetap bersih.
- Peran TIDAK menyembunyikan fitur apa pun — hanya membingkai UI. Otorisasi
  sesungguhnya tetap di backend Frappe.
