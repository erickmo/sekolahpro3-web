# Implementation Tracker — SekolahPro Web

Status implementasi per-domain (tampilan CTO). Sumber kebenaran detail ada di
`docs/domains/{domain}/README.html` dan ADR masing-masing.

> **Snapshot: 2026-06-03.** Angka uji diambil dari dokumentasi domain & berkas test
> sisi web yang diverifikasi ada di repo ini; test backend (`vernon_*`) berada di
> repo terpisah dan ditandai _(BE, repo terpisah)_ — tidak dijalankan ulang di sesi ini.
> Status: **Done** = fitur dirilis (merged), **Partial** = sebagian (mis. BE belum di-bench-run),
> **Pending** = belum dikerjakan.

## Ringkasan (CTO view)

| Domain | Item | Done | Partial | Pending | Dok |
|--------|-----:|-----:|--------:|--------:|-----|
| Ads Manager | 4 | 4 | 0 | 0 | [domains/ads](domains/ads/README.html) |
| Perpustakaan | 4 | 4 | 0 | 0 | [domains/perpustakaan](domains/perpustakaan/README.html) |
| Ekstrakurikuler | 4 | 3 | 0 | 1 | [domains/ekstrakurikuler](domains/ekstrakurikuler/README.html) |
| Koperasi | 4 | 4 | 0 | 0 | [domains/koperasi](domains/koperasi/README.html) |
| Situs Sekolah | 4 | 3 | 1 | 0 | [domains/situs](domains/situs/README.html) |
| Manajemen Aset | 4 | 4 | 0 | 0 | [domains/aset](domains/aset/README.html) |
| Akademik | 4 | 4 | 0 | 0 | [domains/akademik](domains/akademik/README.html) |
| **Total** | **28** | **26** | **1** | **1** | |

## Ads Manager

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| ADS-1 | Paket `@sekolahpro/ads` (AdsProvider, AdBanner, useAd, client) | Feature | Done | `AdBanner.test.tsx` (8) + `client.test.ts` (5) = 13 vitest |
| ADS-2 | Admin SaaS: dashboard analitik + CRUD (customer/property/group/slot/campaign/creative) | Feature | Done | manual + typecheck |
| ADS-3 | Token HMAC (TTL 24j) + CORS terbatas + guard `window.open` skema http(s) | Feature | Done | `AdBanner.test.tsx` (XSS guard), `client.test.ts` |
| ADS-4 | Backend `vernon_ads` (7 doctype, API guest, `stats.overview`) | Feature | Done | _(BE, repo terpisah)_ |

ADR: [ADS-ADR-0001 — Token HMAC + CORS + seleksi acak](domains/ads/ADR/ADS-ADR-0001-token-cors-seleksi.md)

## Perpustakaan

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| PERP-0001 | Sirkulasi Hub terpadu (Peminjaman + Pengembalian + Denda) | Feature | Done | vitest sirkulasi/denda + _(BE, repo terpisah)_ |
| PERP-0002 | Dashboard & visualisasi (stats, viz, PageGuide, role framing) | Feature | Done | vitest `perpustakaanRole` + dashboard viz |
| PERP-0003 | Terminal sirkulasi (scan panel, session state, activity log) | Feature | Done | vitest opname/terminal |
| PERP-0004 | Inventaris & berita acara (opname + incident report) | Feature | Done | vitest inventaris + _(BE, repo terpisah)_ |

ADR: [PERP-ADR-0001 — Merge sirkulasi (peminjaman+pengembalian)](domains/perpustakaan/ADR/PERP-ADR-0001-sirkulasi-merge.md)

## Ekstrakurikuler

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| EKS-001 | Pustaka frontend murni + uji (role, recap, context, predikat) | Feature | Done | `ekskulRole/ekskulRecap/ekskulContext` + `predikatFromKehadiran` vitest (~36 it) |
| EKS-002 | Rute web (8 halaman: dashboard, program, pendaftaran, sesi, raport, mitra) | Feature | Done | typecheck/build |
| EKS-003 | Backend doctype + validasi (kuota FOR UPDATE, lazy GROUP BY recap, predikat) | Feature | Pending | _(BE, repo terpisah; ~34 pytest direncanakan)_ |
| EKS-004 | Keputusan lazy recap (tanpa feeder Sesi→Raport) | PRD | Done | — (lihat ADR) |

ADR: [EKS-ADR-0001 — Lazy recap kehadiran (tanpa feeder)](domains/ekstrakurikuler/ADR/EKS-ADR-0001-lazy-recap.md)

## Koperasi

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| KOP-001 | Menu adaptif per jenis koperasi (`filterKoperasiNav` + `useKoperasiMode`) | Feature | Done | `filterKoperasiNav.test.ts` + `useKoperasiMode.test.ts` |
| KOP-002 | Halaman Suku Bunga read-only (khusus konvensional) | Feature | Done | typecheck/build |
| KOP-003 | Transaksi simpanan (setor/tarik/transfer) + guard + sesi kas | Feature | Done | `transaksiGuard.test.ts`, `sesiKas.test.ts` |
| KOP-004 | Persetujuan (buka/tutup/blokir/aktivasi rekening dormant) | Feature | Done | `worklist.test.ts` + render |

ADR: [KOP-ADR-0001 — Mode menu per jenis koperasi](domains/koperasi/ADR/KOP-ADR-0001-mode-menu-per-jenis.md)

## Situs Sekolah

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| SIT-001 | Sistem template block-driven (composer + block renderer di `apps/situs`) | Feature | Done | ~17 vitest (hero/content/theme/render/ppdb/demoSwitcher) |
| SIT-002 | CMS tata letak + sorotan + tampilan (rute `sch.$sekolah.situs.*`) | Feature | Done | vitest `situs.*` (school) + block schemas |
| SIT-003 | Backend module `website_sekolah` (7 doctype, host resolution, tenant isolation) | Feature | Partial | _(BE, repo terpisah; `test_situs.py` ditulis, bench-run tertunda)_ |
| SIT-004 | Demo SPA offline (`apps/situs` :5184, switcher klasik/modern/ceria/aurora) | Feature | Done | `demoSwitcher.test.tsx` + walkthrough manual |

ADR: [SIT-ADR-0001 — Template block-driven + CMS block no-code](domains/situs/ADR/SIT-ADR-0001-block-driven-templates.md)

## Manajemen Aset

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| ASE-001 | Registry aset master (CRUD) | Feature | Done | _(BE, repo terpisah)_ + vitest `aset` |
| ASE-002 | Workflow peminjaman (diajukan→setujui/tolak→dipinjam→kembalikan) | Feature | Done | vitest `role/stats/nav/badges` + _(BE)_ |
| ASE-003 | Workflow maintenance (dilaporkan→dijadwalkan→dikerjakan→selesai) + lock aset | Feature | Done | _(BE, repo terpisah)_ |
| ASE-004 | Isolasi tenant (registrasi doctype, tolak cross-tenant) | PRD | Done | _(BE: 34 + 4 isolasi)_ — lihat [GLOBAL-ADR-0001](shared/ADR/GLOBAL-ADR-0001-tenant-scoping.md) |

ADR: [ASE-ADR-0001 — Tenant registry + isolasi transfer](domains/aset/ADR/ASE-ADR-0001-tenant-registry-transfer.md)

## Akademik

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| AKA-FEAT-01 | Periode default & hardening (Tahun Ajaran + Semester) | Feature | Done | `akademikPeriode.test.ts`, `AkademikContextBar.test.tsx`, `akademik-layout.test.ts` |
| AKA-FEAT-02 | Input asesmen (test per kelas) — grid autosave + validasi | Feature | Done | `AsesmenInput.test.ts`, `asesmen-tenant.test.ts` |
| AKA-FEAT-03 | Entri nilai — editor grid per komponen | Feature | Done | `EntriNilaiGrid.test.ts` |
| AKA-FEAT-04 | Raport — susun, review, submit, cetak (workflow) | Feature | Done | `GenerateRaportModal.test.tsx` |

ADR: [AKA-ADR-0001 — Periode aktif default + predikat dari kehadiran](domains/akademik/ADR/AKA-ADR-0001-periode-default-predikat.md)

## Domain belum didokumentasikan (docs Pending)

Modul berikut ada di kode (rute `sch.$sekolah.*`) tetapi belum punya
`docs/domains/{domain}/README.html` — kandidat ronde dokumentasi berikutnya:

| Domain | Rute | Catatan |
|--------|------|---------|
| Akuntansi | `akuntansi.*` (anggaran, buku-besar, pajak, referensi) | Besar; pemilik regulasi PPN/PPh — lihat `shared/regulations/` |
| Keuangan | `keuangan.*` (kas, pembayaran, pengeluaran, tagihan) | Hub keuangan sekolah |
| PPDB | `ppdb.*` (gelombang, seleksi, daftar-ulang, pembayaran) | Penerimaan siswa baru |
| Siswa | `siswa.*` (mutasi, kelulusan, ijazah, wali, persetujuan) | Data induk siswa |
| Staff | `staff.*` (jabatan, penugasan, SK) | Guru & tendik |
| Jadwal | `jadwal.*` (slot, override) | Penjadwalan |
| Infrastruktur | `infrastruktur.*` (gedung, lantai, ruangan, utilitas) | Sarpras |
| Absensi | `absensi.*` (guru, pelajaran) | Kehadiran |
| Kelas/Master | `kelas.*`, `master.*` (kurikulum, mapel, KKM, unit-jenjang) | Data induk akademik |
| Pengaturan | `pengaturan.*` (feature-flag, modul) | Setelan tenant |
