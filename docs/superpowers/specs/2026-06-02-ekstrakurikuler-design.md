# Ekstrakurikuler — Design Spec (WHY)

**Status:** Accepted (C-level design panel, 2026-06-02)
**Scope:** backend `apps/sekolahpro` (new module `Ekstrakurikuler`) + frontend `apps/school` (`/sch/$sekolah/ekstrakurikuler`)
**Branch:** `feat/ekstrakurikuler`
**Plan:** [2026-06-02-ekstrakurikuler.md](../plans/2026-06-02-ekstrakurikuler.md)

## Problem

Schools run extracurricular activities (ekstrakurikuler) — Pramuka, Futsal, Robotik,
partner-run dojo/music classes — but SekolahPro has no place to manage the program
catalog, third-party partnerships, student enrollment, weekly attendance, or the
end-of-semester predikat that parents expect on the K-13 rapor. This domain closes
that gap with a tight spine: **Program → Enroll → Attend → Predikat**.

## Stakeholders

| Aktor | Tanggung jawab | Kepentingan | Primary screen |
|-------|----------------|-------------|----------------|
| Pembina (coach; often a teacher or partner coach, low tech literacy, on a phone mid-session) | Run sessions, take attendance, write the semester predikat | Mark attendance in near-zero taps | **"Sesi hari ini"** one-tap landing |
| Koordinator Ekstrakurikuler (admin) | Manage programs, partnerships, enrollment, oversight | Setup once, monitor capacity | Program + Pendaftaran + dashboard |
| Kepala Sekolah (principal) | Oversight, approve partnerships | See coverage at a glance | Dashboard |
| Wali / Siswa (parent / student) | Consume participation + predikat | View on existing wali/rapor surface (v2 wiring) | — (out of app scope) |

## Decisions (from the design panel — codebase-verified)

1. **Tenant scoping is registry-driven, not field-driven.** New anchored doctypes
   MUST be added to `sekolahpro/api/tenant_registry.py DOCTYPES["SCHOOL"]`; the
   `doc_events["*"]` hook only does audit + `auto_set_tenant`, and `auto_set_tenant`
   no-ops when `tier(dt) is None`. The istable child is **not** registered.
2. **istable child carries no tenant fields.** `Kehadiran Ekstrakurikuler` has only
   `siswa/status/catatan` — tenant lives on the parent `Sesi` (mirrors
   `Detail Absensi Pelajaran`).
3. **Kuota enforcement uses a row lock**, not a racy count. `Pendaftaran.validate()`
   takes `SELECT … FOR UPDATE` on the parent `Ekstrakurikuler` (pattern from
   `konfigurasi_nomor_surat.generate_nomor`), then counts active enrollments inside
   the locked window. PPDB's `is_full()` is racy — intentionally NOT copied.
4. **KEYSTONE — Sesi has no Raport feeder.** Attendance recap is computed **lazily**
   from a single `GROUP BY` query at Raport-time and stamped as a snapshot. Sesi
   never writes/creates Raport. This kills the N+1/lock-contention on the autosave
   attendance screen and removes the "blank report cards auto-spawned" hazard.
5. **`tahun_ajaran` is `fetch_from=semester.tahun_ajaran` (read_only)** on Sesi and
   Raport so the (semester, TA) pair cannot desync the recap grouping key.
6. **Recap denominator = the student's own Kehadiran rows** (correct for mid-semester
   joiners/withdrawals), not all program sessions. `Sesi.validate` rejects a kehadiran
   row whose siswa has no Aktif Pendaftaran. Zero sessions → 0%, never NaN.
7. **TA-closed immutability** in Sesi/Pendaftaran/Raport via
   `from sekolahpro.akademik.utils.tahun_ajaran import STATUS_CLOSED`. Program and
   Mitra masters are TA-spanning → not TA-locked.
8. **Predikat timing pinned:** Raport is non-submittable with a `status` Select
   (Draft/Final). Predikat is required only when `status == "Final"`, so the auto-recap
   snapshot persists first and the pembina grades later.
9. **`predikatFromKehadiran` pure lib** (≥90 Sangat Baik / ≥75 Baik / ≥50 Cukup /
   else Kurang, named constants, unit-tested) auto-suggests an editable default —
   turns 30 grading decisions into 30 confirmations.
10. **Role framing via permissive `useEkskulRole`** (clone of akademikRole): buckets
    pembina/koordinator/kepala, permissive fallback, never hides features.

## Divergence from the panel

The panel recommended cutting the **Mitra / partnership** sub-domain for a minimal v1.
The user explicitly required "partnership with third party", so Mitra is **kept**, but
built per the panel's correctness notes: a single `penyelenggara` choice
(Internal/Mitra) instead of a checkbox; **no silent status mutation** in `validate()`
(only `tanggal_akhir_mou >= tanggal_mulai_mou` is enforced; expiry is a display/soft
concern); fees stay informational (finance hub owns money).

## Attendance vocabulary

Statuses reuse the codebase standard for recap compatibility:
**Hadir / Izin / Sakit / Alpha** (same as `Detail Absensi Pelajaran` and
`Raport._hitung_rekap_absensi`). No lesson-only "Terlambat".

## Flow

```
Koordinator: buat Program (penyelenggara Internal→pembina, atau Mitra→pilih Mitra)
        │
        ├─ (optional) catat Mitra + MOU
        ▼
Koordinator: daftarkan Siswa  ──► kuota row-lock enforced (FOR UPDATE)
        ▼
Pembina: buka "Sesi hari ini" ──► 1 tap mulai sesi (auto pertemuan_ke, semester dari konteks)
        │                          roster prefilled dari pendaftaran Aktif, default Hadir
        ▼  mark exceptions only (autosave)
recurring Sesi + Kehadiran
        ▼
Pembina (akhir semester): Generate Raport semua peserta
        │   recap kehadiran auto (lazy GROUP BY snapshot)
        │   predikat auto-suggest dari %kehadiran (editable)
        ▼
Raport Ekstrakurikuler (status Final) ──► (v2) notifikasi wali
```

## Cross-domain events

- **v1 consume:** Tahun Ajaran `Closed` status (immutability); Siswa status enum
  (eligibility).
- **v1 field-shape contract:** Raport Ekstrakurikuler exposes `persentase_kehadiran`,
  `predikat`, `deskripsi` so the future wali surface is a wiring task, not a redesign.
- **v2 emit (deferred):** `ekstrakurikuler.raport.final` → wali notifikasi;
  `ekstrakurikuler.mitra.mou_expired` → koordinator/kepala.
