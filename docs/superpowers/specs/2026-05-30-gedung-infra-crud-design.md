# Desain: Manajemen Inline Lantai / Ruangan / Fasilitas / Utilitas di Detail Gedung

- **Tanggal:** 2026-05-30
- **Repo:** `sekolahpro-web` (FE), app `apps/school`
- **Status:** Draft — menunggu review user
- **Branch FE (rencana):** `feat/gedung-infra-crud`

## 1. Latar Belakang & Masalah

Halaman detail Gedung
(`apps/school/src/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx`)
saat ini menampilkan Lantai, Ruangan, Fasilitas, dan Utilitas sebagai tab
**read-only**. Comment di file menyatakan pembuatan data "dilakukan di modul
masing-masing". User ingin mengelola (Tambah/Edit/Hapus) keempat entitas
langsung dari halaman detail Gedung — sesuai URL yang dipakai:
`/{sekolah}/infrastruktur/daftar-gedung/{gedungId}`.

Backend sudah lengkap — tidak ada doctype baru yang perlu dibuat:

```
Gedung
├── Lantai            (Link: gedung; reqd: nama, nomor_lantai, gedung, sekolah)
│   └── Ruangan       (Link: lantai; denorm gedung+sekolah read-only)
│       └── Fasilitas Ruangan   (child table di Ruangan.fasilitas)
└── Utilitas Gedung   (Link: gedung; denorm sekolah read-only)
    └── Riwayat Utilitas        (child table di Utilitas Gedung.riwayat)
```

## 2. Tujuan & Non-Tujuan

**Tujuan**
- Tab Lantai/Ruangan/Utilitas jadi CRUD penuh dari halaman detail Gedung.
- Fasilitas dikelola sbg grid baris di dalam modal Ruangan (child table).
- Riwayat Utilitas dikelola sbg grid baris di dalam modal Utilitas (child table).
- Konfirmasi hapus untuk semua delete.
- Konsisten dgn pola FE existing (`GedungFormModal`, hooks `useResource*`,
  komponen `@sekolahpro/ui`).

**Non-Tujuan**
- Tidak membuat/mengubah doctype backend.
- Tidak mengubah halaman modul terpisah (`infrastruktur.lantai`, `.ruangan`, dll).
- Tidak mengubah perm doctype backend (lihat Risiko R1).
- Tidak mengelompokkan Ruangan per-Lantai (tetap list datar dgn kolom Lantai).

## 3. Asumsi & Risiko

- **R1 (perm backend) — PENTING.** Semua doctype infrastruktur
  (Gedung, Lantai, Ruangan, Utilitas Gedung) hanya memiliki permission untuk
  role **System Manager**. Jika user FE login dengan role sekolah
  (`Sekolah Admin`, `Tata Usaha`, dst), REST `create/update/delete` akan
  mengembalikan **403**. UI tetap dibangun, tapi agar fitur benar-benar
  berfungsi untuk admin sekolah dibutuhkan perubahan perm backend di repo
  `sekolahpro` (di luar scope ini). **Keputusan ditunggu di gate review:**
  (a) biarkan System Manager saja, atau (b) buat follow-up task perm BE.
- **R2 (autoname).** `Ruangan` = `format:{lantai}-{kode}`,
  `Utilitas Gedung` = `format:{gedung}-{jenis}`, `Lantai` = `{gedung}-L{nomor_lantai}`.
  Duplikat → DuplicateEntryError dari Frappe. UI menampilkan pesan error mentah
  dari backend di banner modal (cukup untuk v1).
- **R3 (child-table update).** Frappe REST mengganti seluruh isi child table
  saat field tabel dikirim pada update. Maka modal Ruangan/Utilitas selalu
  mengirim array `fasilitas`/`riwayat` lengkap (full replace), bukan patch baris.

## 4. Arsitektur

Tetap satu route file. Tambah komponen modal + state CRUD per tab. Pola =
`MasterCRUD` (state `editName` + `open`) yang sudah dipakai di koperasi.

```
$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx   (route — diubah)
  ├─ state: tab, modal open + editName per entitas
  ├─ tombol "Tambah" di header tiap SectionCard
  ├─ aksi row (Edit/Hapus) di kolom aksi DataTable
  └─ render modal:
       components/infrastruktur/
         ├─ LantaiFormModal.tsx        (baru)
         ├─ RuanganFormModal.tsx       (baru; berisi grid Fasilitas)
         ├─ UtilitasFormModal.tsx      (baru; berisi grid Riwayat)
         ├─ ChildRowsEditor.tsx        (baru; grid baris generik child table)
         └─ GedungFormModal.tsx        (existing — referensi pola)
```

**Komponen baru reusable:**
- `ChildRowsEditor<T>` — grid baris generik: render daftar input per baris,
  tombol "+ Tambah baris" dan "hapus" per baris. Dikonfigurasi via deskripsi
  kolom (key, label, type, options). Dipakai utk Fasilitas & Riwayat.
- `ConfirmDialog` — jika belum ada di `@sekolahpro/ui`, pakai `Modal` tone
  danger inline (cek dulu; reuse bila ada).

## 5. Detail Per Entitas

### 5.1 Lantai (`LantaiFormModal`)
- Field: `nama` (Data, reqd), `nomor_lantai` (Int, reqd).
- Saat create: set `gedung = gedungId`, `sekolah = activeSekolah` (auto, tdk dipilih).
- Edit: muat doc via `useResourceDoc`, update via `useResourceUpdate`.
- Hapus: konfirmasi → `useResourceDelete`. Catatan: Lantai dipakai Ruangan;
  jika ada Ruangan anak, Frappe akan menolak delete (LinkExistsError) →
  tampilkan pesan error.

### 5.2 Ruangan (`RuanganFormModal`)
- Field: `nama`, `kode` (reqd), `lantai` (Select — opsi = Lantai dlm gedung ini),
  `jenis_ruangan` (Select reqd), `kapasitas` (Int), `luas_m2` (Float),
  `status` (Select, default "Tersedia").
- `gedung` & `sekolah` denorm otomatis dari `lantai` (read-only di BE) — tdk dikirim.
- Grid **Fasilitas** (`ChildRowsEditor`): kolom `nama_fasilitas` (Data, reqd),
  `jumlah` (Int, default 1), `kondisi` (Select Baik/Rusak, default Baik).
- Submit kirim `fasilitas: [...]` (full replace).
- Lantai picker kosong → arahkan user buat Lantai dulu (disable submit + hint).

### 5.3 Utilitas (`UtilitasFormModal`)
- Field: `jenis` (Select reqd), `provider`, `kapasitas`, `satuan`,
  `nomor_pelanggan` (Data), `status` (Select, default "Aktif").
- Create set `gedung = gedungId`; `sekolah` denorm otomatis.
- Grid **Riwayat** (`ChildRowsEditor`): `tanggal_catat` (Date, reqd),
  `nilai_meteran` (Float), `keterangan` (Small Text).
- Submit kirim `riwayat: [...]` (full replace).

### 5.4 Fasilitas & Riwayat
- Tidak ada modal/list mandiri. Dikelola hanya via grid dalam modal induk.
- Tab "Ruangan & Fasilitas": tabel Ruangan dapat aksi CRUD; tabel Fasilitas
  tetap tampil gabungan **read-only** (turunan dari Ruangan) sebagai ringkasan.

## 6. Data Flow

1. List: `useResourceList` (existing) — sudah filter `gedung = gedungId`,
   auto-inject `sekolah`.
2. Create/Update/Delete: `useResourceCreate/Update/Delete` dari
   `@sekolahpro/api-client`.
3. Setelah mutasi sukses: `queryClient.invalidateQueries` utk list terkait
   (mengikuti pola `GedungFormModal` baris 76) → tabel refresh.
4. Error: tangkap di modal, tampilkan banner (pola existing baris 80-82).

## 7. Penanganan Error

- Validasi client: tombol Simpan disable sampai field wajib terisi.
- Error backend (duplikat, link exists, 403 perm): banner merah di modal /
  toast pada delete. Pesan diambil dari `(e as Error).message`.
- Delete dgn dependensi (Lantai punya Ruangan) → pesan jelas "tidak bisa hapus,
  masih ada data turunan".

## 8. Rencana Test (Vitest + Testing Library)

Per modal (mock hooks `@sekolahpro/api-client` + session store):
- `LantaiFormModal`: render, validasi reqd, submit memanggil create dgn
  `gedung`+`sekolah`, mode edit memuat & update.
- `RuanganFormModal`: idem + tambah/hapus baris Fasilitas, payload `fasilitas`
  terkirim benar, disable saat tdk ada Lantai.
- `UtilitasFormModal`: idem + grid Riwayat.
- `ChildRowsEditor`: tambah baris, hapus baris, edit nilai, callback onChange.
- Route detail: tombol Tambah membuka modal; konfirmasi hapus memanggil delete.

## 9. Langkah Implementasi (ringkas)

1. Branch `feat/gedung-infra-crud`.
2. `ChildRowsEditor` + test.
3. `LantaiFormModal` + test.
4. `RuanganFormModal` (+ grid Fasilitas) + test.
5. `UtilitasFormModal` (+ grid Riwayat) + test.
6. Integrasi ke route detail: tombol Tambah, kolom aksi, konfirmasi hapus.
7. Jalankan vitest + lint, perbaiki semua.
8. Update `.wolf/anatomy.md` + `.wolf/memory.md`.

## 10. Keputusan Terbuka untuk Review
- **R1**: cukup System Manager, atau buka follow-up perm BE untuk role sekolah?
- Perlukah toast global (cek apakah ada sistem toast di `@sekolahpro/ui`) atau
  cukup banner in-modal + dialog konfirmasi?
