# EKS-ADR-0001 — Rekap kehadiran Raport Ekstrakurikuler = snapshot lazy (tanpa feeder dari Sesi)

- **Status:** Accepted
- **Date:** 2026-06-02
- **Scope:** `apps/sekolahpro` (backend) + `apps/school` (frontend)
- **Branch:** `feat/ekstrakurikuler`
- **Spec:** [2026-06-02-ekstrakurikuler-design.md](../superpowers/specs/2026-06-02-ekstrakurikuler-design.md)
- **Plan:** [2026-06-02-ekstrakurikuler.md](../superpowers/plans/2026-06-02-ekstrakurikuler.md)

## Context

Raport Ekstrakurikuler menampilkan rekap kehadiran siswa (jumlah hadir, jumlah
pertemuan, persentase) plus predikat. Sumber data kehadiran adalah child
`Kehadiran Ekstrakurikuler` di tiap `Sesi Ekstrakurikuler`. Layar absensi adalah
permukaan mobile utama pembina dan ber-autosave (sering menulis).

Desain awal meniru feeder Asesmen→Entri Nilai: `Sesi.on_update/on_trash`
me-recompute Raport tiap kali sesi disimpan. Panel C-level menolak ini.

## Decision

`Sesi Ekstrakurikuler` **tidak** punya feeder ke Raport — tidak ada hook
`on_update`/`on_trash` yang menyentuh Raport. Rekap dihitung **lazily** saat
`Raport Ekstrakurikuler.validate()` lewat **satu** query `GROUP BY` (klon
`Raport._hitung_rekap_absensi`), lalu di-snapshot ke field read-only
`jumlah_hadir`/`jumlah_pertemuan`/`persentase_kehadiran`.

Denominator = baris `Kehadiran` milik siswa itu sendiri pada (program, semester),
bukan seluruh sesi program — benar untuk peserta yang bergabung/keluar di tengah
semester. Zero sesi → 0% (bukan NaN). `tahun_ajaran` di Sesi & Raport
`fetch_from semester.tahun_ajaran` agar pasangan (semester, TA) tak desync.

## Consequences

- **Positif:** tidak ada N+1 / lock contention pada layar absensi autosave;
  Raport kosong tidak pernah ter-spawn otomatis dari penyimpanan Sesi; satu query
  agregasi vs puluhan; kontrak `exclude_self` on-trash jadi tidak relevan.
- **Trade-off:** angka rekap pada Raport adalah snapshot saat terakhir Raport
  disimpan — bila kehadiran berubah setelahnya, Raport perlu dibuka/disimpan ulang
  untuk menyegarkan. Diterima: rekap final relevan di akhir semester saat pembina
  membuka & menilai.

## Alternatives rejected

- **Eager feeder dari Sesi (pola Asesmen):** ditolak — write-amplifying + lock
  contention di layar absensi yang paling sering ditulis.
- **Field rekap live tanpa snapshot (hitung tiap render):** ditolak untuk v1 agar
  Raport punya nilai stabil yang bisa dirujuk wali; hitung live tetap dipakai di
  layar Raport sebelum di-generate.

## Files of record

- `apps/sekolahpro/sekolahpro/ekstrakurikuler/doctype/raport_ekstrakurikuler/raport_ekstrakurikuler.py`
- `apps/sekolahpro/sekolahpro/ekstrakurikuler/doctype/sesi_ekstrakurikuler/sesi_ekstrakurikuler.py`
- `apps/sekolahpro/sekolahpro/api/tenant_registry.py` (5 doctype anchored ke tier SCHOOL)
