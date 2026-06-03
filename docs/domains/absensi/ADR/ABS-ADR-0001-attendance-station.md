# ABS-ADR-0001: Attendance Station sebagai antarmuka tap multi-mode terpadu

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: absensi

## Konteks

Absensi melayani tiga alur berbeda: **gerbang** (semua personel tap saat masuk —
kehadiran harian), **pelajaran** (guru catat kehadiran siswa per `Jadwal Pelajaran`),
dan **event** (ekskul/ujian). Sebelumnya kehadiran dicatat manual per kelas lalu
direkap — lambat dan rawan salah pada skala ratusan siswa × puluhan pelajaran/hari.

Kebutuhan: terima tap dari banyak kanal (kartu RFID/NFC, QR dari app siswa, manual),
beroperasi offline di level perangkat, simpan log mentah setiap tap (audit), dan
turunkan ringkasan (kehadiran harian, roll kelas, kode status) untuk laporan.

Spec: `docs/superpowers/specs/2026-05-29-attendance-station-design.md`.
Rute saat ini (`absensi.index/guru/pelajaran`) masih form rekap; station adalah
arsitektur target yang dijalankan bertahap (Phase 1: `…/plans/2026-05-29-attendance-station-phase1.md`).

## Keputusan

Terapkan model **Attendance Station** — perangkat terdaftar (kiosk/tablet/HP guru)
menjalankan PWA, menerima tap dari banyak sumber, mencatat semua ke log audit pusat.

1. **Tiga mode station** (ditetapkan saat pairing): `gate` (kiosk gerbang),
   `classroom` (perangkat guru, ter-scope ke `Jadwal Pelajaran` aktif), `event`.
2. **Satu handler tap** (`record_tap`) — input kartu/QR/manual semua menuju logika
   penyisipan event yang sama; tak ada endpoint per-jenis-input.
3. **Log event mentah = sumber kebenaran** (doctype `Attendance Event`) — tiap tap
   (diterima/ditolak) jadi baris immutable (station, method, direction, subjek,
   tapped_at, received_at, status, reject_reason) → jejak audit.
4. **Ringkasan turunan idempoten** — `Daily Attendance` & `Class Attendance` dihitung
   ulang dari `Attendance Event` (after_insert / terjadwal); edit manual set `source=manual`
   sehingga tak ditimpa otomasi.
5. **Pairing via device-code** — admin terbitkan kode; perangkat klaim dgn fingerprint +
   public key, terima `api_key` (di-hash); revoke via `status=revoked`.
6. **Offline + verifikasi tanda tangan** — QR = JWT Ed25519 (umur 30s, jti single-use,
   verifikasi lokal via JWKS); antrian tap di IndexedDB, di-flush saat reconnect.

## Konsekuensi

### Positif
- Satu titik masuk + satu log audit untuk semua data kehadiran → lebih sedikit jalur kode.
- Jejak audit default; input fleksibel (kartu/QR/manual, adapter baru tanpa ubah handler/storage).
- Operasi offline; ringkasan idempoten (aman di-recompute, override manual terjaga).

### Negatif
- Beban backend tinggi (tiap tap = insert); log event tumbuh → butuh kebijakan retensi/arsip.
- Kompleksitas derivasi dua ringkasan (harian + kelas); rawan clock-skew (dimitigasi window ±skew).
- Mode classroom bergantung `Jadwal Pelajaran` akurat; QR butuh refresh berkala di app siswa.

### Trade-off ditunda (YAGNI)
- Absensi tamu/visitor, geo-fencing, face recognition — ditunda (Phase N).
- Notifikasi wali real-time — setelah logika kehadiran stabil; di-gate per tier langganan.

## Referensi
- `docs/superpowers/specs/2026-05-29-attendance-station-design.md` — spec lengkap (data model, API, keamanan, fase)
- `docs/superpowers/plans/2026-05-29-attendance-station-phase1.md` — rencana Phase 1
- `apps/school/src/routes/sch.$sekolah.absensi.index.tsx` — dashboard (ringkasan harian)
- `apps/school/src/routes/sch.$sekolah.absensi.guru.tsx` — absensi guru (rekap + form)
- `apps/school/src/routes/sch.$sekolah.absensi.pelajaran.tsx` — absensi per pelajaran
