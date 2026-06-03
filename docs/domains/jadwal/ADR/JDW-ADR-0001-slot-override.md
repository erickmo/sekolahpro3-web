# JDW-ADR-0001: Mekanisme Override Slot vs Override Jadwal Tanpa Mengubah Master

- **Status:** Accepted
- **Tanggal:** 2026-06-03
- **Domain:** Jadwal Pelajaran

## Konteks

Sistem penjadwalan pelajaran di SekolahPro menghadapi kebutuhan fleksibilitas harian yang berlawanan dengan konsistensi data master:

1. **Master (Jadwal Pelajaran)** — jadwal mingguan tetap per rombel, semester, tahun ajaran. Stabil, dipakai untuk rencana jangka panjang dan analisis.
2. **Variasi Harian** — hari libur mendadak, penggantian guru, tambahan kelas, ujian dadakan, dll. Harus mudah diatur tanpa merekah master.

Opsi desain tersedia:
- **Opsi A (Pilihan):** Dua doctype terpisah — `Jadwal Pelajaran` (master) + `Jadwal Override` (per-tanggal), di-resolve harian saat fetch. Override prioritas tinggi, master fallback.
- **Opsi B (Rejected):** Edit langsung master slot. Masalah: tidak terbayar untuk revert/lihat history, conflict dengan audit, dan tidak bisa lihat "apa kata master vs apa kenyataan hari ini".
- **Opsi C (Rejected):** Duplikasi slot ke tabel `Jadwal Harian` untuk tiap hari (365 × n-rombel = ledakan data, O(n) insert/copy, rumit sinkronisasi).

## Keputusan

**Pilih Opsi A.** Dua doctype master terpisah dengan resolver harian:

1. **`Jadwal Pelajaran`** — jadwal mingguan tetap, tidak pernah diedit langsung setelah aktif. Isinya slot mingguan (hari + jam).
2. **`Jadwal Override`** — per rombel per tanggal, tipe:
   - **Libur:** Tanpa slot (tidak ada KBM). Hari tersebut skip semua pelajaran.
   - **Pengganti/Tambahan:** Dengan child `Slot Override` (slot pengganti, bisa beda guru/jam/mapel). Tetap ancor ke rombel yang sama.

3. **Resolver Harian** (backend, TBD fase 2):
   ```
   get_jadwal_hari(rombel, tanggal):
       if Jadwal Override(rombel, tanggal) exists:
           return override.slots (atau "kosong" jika Libur)
       else:
           hari_minggu = weekday(tanggal)
           return Jadwal Pelajaran(rombel, aktif).slots where hari == hari_minggu
   ```

## Konsekuensi

### Positif
- **Clarity:** Master tetap clean; variasi harian terpisah jelas.
- **Non-destructive:** Override tidak mengubah master, bisa dilihat history "apa yang direncanakan vs apa yang terjadi".
- **Revert mudah:** Hapus override → fallback otomatis ke jadwal normal minggu depan.
- **Audit trail:** Frappe track_changes di override, master stable.
- **Role separation:** Wali kelas bisa edit override (libur/penggantian), tapi jadwal mingguan hanya Kepala Akademik.

### Negatif
- **Resolver dependency:** Frontend/backend harus aware resolver logic. Jika resolver tidak diimplementasi atau salah, KBM display salah.
- **Double-booking risk (pre-v1):** Jika Jadwal Override tidak cek konflik silang guru dengan Jadwal Pelajaran hari itu, guru bisa overlap. **Mitigasi:** Validasi `Jadwal Override._validasi_konflik_silang()` yang mendeteksi guru bentrok vs jadwal aktif + override lain pada tanggal sama.
- **Data consistency sync:** Jika guru di master berubah after override created, child slot override tidak auto-update. Biarkan manual atau trigger update non-breaking saat guru di-unassign.

### Trade-off Ditunda (YAGNI)
- **Template copy slot:** Copy-paste slot dari master ke override (untuk penggantian cepat) ditangguhkan post-v1 berdasarkan feedback user.
- **Jadwal per guru:** Jadwal by-guru (guru mengambil kelas ad-hoc tanpa formal SK) ditangguhkan; 2026-06-03 asumsi semua via Penugasan Guru.
- **Ruangan conflict:** Overlap ruangan tidak dicek 2026-06-03; v2 rencanakan dengan infrastruktur/ruangan.

## Referensi

- `apps/school/src/routes/sch.$sekolah.jadwal.daftar.tsx` — UI list Jadwal Pelajaran
- `apps/school/src/routes/sch.$sekolah.jadwal.override.tsx` — UI list Jadwal Override
- `sekolahpro/akademik/doctype/jadwal_pelajaran/jadwal_pelajaran.py` — validasi master, conflict detection
- `sekolahpro/akademik/doctype/jadwal_override/jadwal_override.py` — validasi override per-hari, conflict detection
- `sekolahpro/akademik/doctype/jadwal_pelajaran/test_jadwal_pelajaran.py` — test suite (428 lines, multi-scenario)
- `sekolahpro/akademik/doctype/jadwal_override/test_jadwal_override.py` — test suite (159 lines, per-tipe validation)
