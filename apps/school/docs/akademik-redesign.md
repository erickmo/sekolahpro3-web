# Redesain Modul Akademik

Dokumen ini merangkum redesain modul **Akademik** pada aplikasi `apps/school`.
Tujuan redesain: membuat modul akademik lebih mudah dipahami oleh tiga peran
pengguna utama, menambah panduan (tutorial) kontekstual di setiap halaman, dan
menyajikan data lewat visualisasi yang ringkas.

- Branch: `feat/akademik-redesign`
- Worktree: `/Users/erickmo/Desktop/akademik-redesign-wt`
- Lokasi kode: `apps/school/src` (rute akademik di `src/routes/.../akademik`)

---

## 1. Kerangka Tiga Peran (3-Role Framing)

Seluruh halaman akademik kini dibingkai untuk tiga peran pengguna, sehingga
setiap pengguna langsung melihat aksi dan informasi yang relevan dengan dirinya:

1. **Admin / Operator Akademik** — mengelola data master akademik
   (mata pelajaran, jadwal, rombel, kurikulum), memantau kelengkapan dan
   progres pengisian secara menyeluruh.
2. **Guru / Wali Kelas** — fokus pada kelas/rombel yang diampu: input nilai,
   absensi, asesmen, dan rekap untuk siswa di kelasnya.
3. **Kepala Sekolah / Pimpinan** — tampilan ringkas berbasis ringkasan dan
   visualisasi untuk memantau capaian akademik tanpa masuk ke detail entri.

Pembedaan peran dikerjakan lewat **helper peran** terpusat (lihat bagian
Foundation), bukan pengecekan peran yang tersebar di tiap halaman. Dengan
begitu logika "siapa boleh melihat/melakukan apa" konsisten di seluruh modul.

---

## 2. Komponen Foundation Baru

Tiga fondasi baru dipakai ulang oleh halaman-halaman akademik:

### a. Komponen Visualisasi (`viz`)
Kumpulan komponen visual reusable di `src/components/viz/`. Dipakai untuk
menyajikan ringkasan akademik (distribusi nilai, tren, progres pengisian,
perbandingan antar-kelas/mata pelajaran) tanpa mengulang kode chart di tiap
halaman. Komponen viz menerima data yang sudah dirapikan dari halaman dan
fokus hanya pada presentasi (presentational components).

### b. PageGuide (Panduan Per-Halaman)
Komponen **PageGuide** menampilkan tutorial / panduan kontekstual pada setiap
halaman akademik: menjelaskan tujuan halaman, langkah pemakaian, dan tips
sesuai peran pengguna. Tujuannya menurunkan kurva belajar bagi guru/operator
baru. Panduan ditempatkan konsisten di tiap halaman sehingga pola interaksinya
seragam.

### c. Helper Peran (role helper)
Modul helper peran (`roles`) memusatkan penentuan peran pengguna dan kapabilitas
turunannya. Halaman memanggil helper ini untuk memutuskan elemen UI mana yang
ditampilkan (mis. tombol aksi admin, ringkasan pimpinan, atau panel input guru),
sehingga tidak ada duplikasi pengecekan peran di banyak tempat.

---

## 3. Perubahan Per-Halaman

> Catatan: rute akademik berada di bawah folder rute akademik di `apps/school`.
> Ringkasan berikut menggambarkan perubahan pada halaman-halaman utama modul.

- **Beranda / Dashboard Akademik**
  Halaman ringkasan diberi PageGuide pengantar dan visualisasi capaian
  akademik (ringkasan progres dan tren) agar pimpinan dan operator cepat
  membaca kondisi akademik. Aksi dan kartu disesuaikan dengan peran.

- **Mata Pelajaran / Kurikulum**
  Penataan ulang tampilan daftar dan form, ditambah PageGuide yang menjelaskan
  alur pengelolaan mata pelajaran/kurikulum. Aksi pengelolaan (tambah/ubah)
  hanya tampil untuk peran yang berwenang via helper peran.

- **Jadwal**
  Tampilan jadwal dirapikan dan dilengkapi panduan pemakaian. Guru melihat
  jadwal yang relevan dengan dirinya; operator melihat tampilan pengelolaan.

- **Rombel / Kelas**
  Daftar rombel diberi konteks peran dan ringkasan visual (mis. jumlah siswa
  dan status pengisian). PageGuide menjelaskan langkah pengelolaan rombel.

- **Asesmen / Input Nilai**
  Alur input nilai/asesmen difokuskan untuk guru: PageGuide menuntun langkah
  pengisian, dan visualisasi membantu melihat distribusi nilai setelah input.
  Pintu masuk pengisian disaring berdasarkan peran.

- **Rekap / Laporan Nilai**
  Rekap nilai disajikan dengan visualisasi (distribusi & perbandingan) untuk
  memudahkan pembacaan, dilengkapi panduan cara membaca rekap.

---

## 4. Visualisasi yang Ditambahkan

Visualisasi yang diperkenalkan lewat komponen `viz` mencakup, antara lain:

- **Ringkasan progres pengisian** — seberapa lengkap data akademik telah diisi.
- **Distribusi nilai** — sebaran nilai siswa untuk membaca capaian kelas.
- **Tren / perkembangan** — perbandingan antar periode untuk memantau arah capaian.
- **Perbandingan antar-kelas / mata pelajaran** — membantu pimpinan dan operator
  membandingkan unit dengan cepat.

Seluruh visualisasi bersifat presentational dan menerima data yang sudah diproses
oleh halaman, sehingga mudah diuji dan dipakai ulang.

---

## 5. Cara Mereview

1. Gunakan branch redesain:
   - Branch: `feat/akademik-redesign`
   - Worktree: `/Users/erickmo/Desktop/akademik-redesign-wt`
2. Masuk ke aplikasi sekolah lalu jalankan dev server:
   - Direktori: `apps/school`
   - Perintah: `pnpm dev`
3. Telusuri rute akademik di aplikasi dan periksa pada tiga peran:
   - Admin/operator, guru/wali kelas, dan kepala sekolah/pimpinan.
4. Hal yang perlu diperiksa saat review:
   - PageGuide muncul dan relevan di tiap halaman akademik.
   - Elemen UI tampil/tersembunyi sesuai peran (lewat helper peran).
   - Visualisasi `viz` menampilkan data dengan benar dan responsif.

---

## 6. Catatan Teknis

- Komponen foundation (`viz`, `PageGuide`, helper peran) sengaja dibuat reusable
  agar perubahan tampilan/logika peran cukup dilakukan di satu tempat.
- Logika peran dipusatkan di helper peran untuk menghindari duplikasi pengecekan
  di tiap halaman.
- Halaman tetap bertanggung jawab menyiapkan/merapikan data; komponen `viz`
  hanya menyajikan, menjaga pemisahan tanggung jawab tetap bersih.
