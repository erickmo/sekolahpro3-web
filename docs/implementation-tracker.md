# Implementation Tracker — SekolahPro Web

Status implementasi per-domain (tampilan CTO). Sumber kebenaran detail ada di
`docs/domains/{domain}/README.html` dan ADR masing-masing.

> **Snapshot: 2026-06-07.** Angka uji diambil dari dokumentasi domain & berkas test
> sisi web yang diverifikasi ada di repo ini; test backend (`vernon_*`/`sekolahpro`)
> berada di repo terpisah dan ditandai _(BE, repo terpisah)_ — umumnya tidak dijalankan
> ulang. Pengecualian 2026-06-07: BE Ekstrakurikuler (EKS-003) & Situs (SIT-003)
> di-bench-run lewat `bench --site sekolahpro.localhost run-tests` (34 + 25 hijau).
> Status: **Done** = dirilis (merged), **Partial** = sebagian (mis. BE belum di-bench-run),
> **Pending** = belum dikerjakan, **Ditunda** = sengaja ditunda ke fase berikut (lihat ADR).

## Ringkasan (CTO view)

| Domain | Item | Done | Partial | Pending/Ditunda | Dok |
|--------|-----:|-----:|--------:|----------------:|-----|
| Ads Manager | 4 | 4 | 0 | 0 | [ads](domains/ads/README.html) |
| Perpustakaan | 4 | 4 | 0 | 0 | [perpustakaan](domains/perpustakaan/README.html) |
| Ekstrakurikuler | 4 | 4 | 0 | 0 | [ekstrakurikuler](domains/ekstrakurikuler/README.html) |
| Koperasi | 4 | 4 | 0 | 0 | [koperasi](domains/koperasi/README.html) |
| Situs Sekolah | 4 | 4 | 0 | 0 | [situs](domains/situs/README.html) |
| Manajemen Aset | 4 | 4 | 0 | 0 | [aset](domains/aset/README.html) |
| Akademik | 5 | 5 | 0 | 0 | [akademik](domains/akademik/README.html) |
| Akuntansi | 4 | 4 | 0 | 0 | [akuntansi](domains/akuntansi/README.html) |
| Keuangan | 4 | 4 | 0 | 0 | [keuangan](domains/keuangan/README.html) |
| PPDB | 4 | 4 | 0 | 0 | [ppdb](domains/ppdb/README.html) |
| Siswa | 4 | 4 | 0 | 0 | [siswa](domains/siswa/README.html) |
| Guru & Staf | 4 | 4 | 0 | 0 | [staff](domains/staff/README.html) |
| Jadwal | 4 | 4 | 0 | 0 | [jadwal](domains/jadwal/README.html) |
| Infrastruktur | 4 | 4 | 0 | 0 | [infrastruktur](domains/infrastruktur/README.html) |
| Absensi | 4 | 4 | 0 | 0 | [absensi](domains/absensi/README.html) |
| Kelas & Rombel | 4 | 4 | 0 | 0 | [kelas](domains/kelas/README.html) |
| Pengaturan | 4 | 4 | 0 | 0 | [pengaturan](domains/pengaturan/README.html) |
| Pesan | 4 | 4 | 0 | 0 | [pesan](domains/pesan/README.html) |
| Audit Log | 4 | 4 | 0 | 0 | [audit](domains/audit/README.html) |
| Verifikasi Penjemputan | 4 | 4 | 0 | 0 | [pickup-verify](domains/pickup-verify/README.html) |
| OCR Identitas | 4 | 4 | 0 | 0 | [ocr](domains/ocr/README.html) |
| **Total** | **84** | **84** | **0** | **0** | |

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
| EKS-003 | Backend doctype + validasi (kuota FOR UPDATE, lazy GROUP BY recap, predikat) | Feature | Done | _(BE, repo terpisah; 34 test bench-run hijau 2026-06-07: ekstrakurikuler 7, mitra 3, pendaftaran 7, raport 9, sesi 8)_ |
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
| SIT-003 | Backend module `website_sekolah` (host resolution, tenant isolation) | Feature | Done | _(BE, repo terpisah; `test_situs.py` bench-run hijau 2026-06-07: 25 test — host resolution, isolasi tenant, anti-tamper PPDB)_ |
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
| AKA-FEAT-05 | Navigasi period-first: hub Tahun Ajaran (berjalan + arsip, auto-redirect) → workspace per-TA (`/akademik/$ta`) submenu datar + breadcrumb | Feature | Done | `akademikNav.test.ts`, `akademik-layout.test.ts`, `AkademikContextBar.test.tsx` |

ADR: [AKA-ADR-0001 — Periode aktif default + predikat dari kehadiran](domains/akademik/ADR/AKA-ADR-0001-periode-default-predikat.md)

## Akuntansi

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| AKU-001 | Chart of Accounts (`Account`) — hierarki CoA | Feature | Done | rute web + _(BE `vernon_accounting`, repo terpisah)_ |
| AKU-002 | Journal Entry + GL (posting jurnal manual, balanced) | Feature | Done | _(BE, repo terpisah)_ |
| AKU-003 | Anggaran (Budget) + amandemen (approval workflow) | Feature | Done | rute web + _(BE)_ |
| AKU-004 | Pajak Indonesia (SPT PPN, e-Faktur, TER, withholding) | Feature | Done | rute web + _(BE)_ |

ADR: [AKU-ADR-0001 — Scoping per-company + pajak](domains/akuntansi/ADR/AKU-ADR-0001-company-scope-pajak.md) · catatan: lihat [shared/regulations](shared/regulations/README.md)

## Keuangan

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| KEU-001 | Hub terpadu (Ringkasan + operasi, role-adaptive) | Feature | Done | `keuanganHub.test.ts`, `keuanganRole.test.ts` |
| KEU-002 | Tagihan & Pengeluaran operasional | Feature | Done | rute web |
| KEU-003 | Pembayaran & Buku Kas (wiring `vernon_accounting` Invoice/Expense/Payment) | Feature | Done | rute web + _(BE)_ |
| KEU-004 | Visualisasi hub (LineChart, StatCard) | Feature | Done | vitest hub |

ADR: [KEU-ADR-0001 — Unifikasi hub Keuangan+Akuntansi](domains/keuangan/ADR/KEU-ADR-0001-hub-terpadu.md)

## PPDB

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| PPDB-001 | Beranda role-adaptive (ringkasan + aksi) | Feature | Done | `ppdbRole.test.ts` |
| PPDB-002 | Antrian kerja staf (4 grup: dokumen, seleksi, pembayaran, daftar-ulang) | Feature | Done | `ppdbQueue.test.ts` |
| PPDB-003 | Analytics (funnel, jalur distribusi, pembayaran) | Feature | Done | `ppdbAnalytics.test.ts` |
| PPDB-004 | 9 halaman redesain (gelombang, seleksi, daftar-ulang, dst) | Feature | Done | `routes/__tests__/ppdb.*` |

ADR: [PPDB-ADR-0001 — Lapisan API whitelisted di atas CRUD doctype](domains/ppdb/ADR/PPDB-ADR-0001-whitelisted-api-layer.md)

## Siswa (Data Induk)

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| SIS-001 | Daftar Siswa — list, search, filter | Feature | Done | `lib/orang/siswaStats.test.ts`, `nav.test.ts` |
| SIS-002 | Kelulusan Siswa — workflow multi-step | Feature | Done | rute web |
| SIS-003 | Mutasi Siswa (keluar + masuk) — state machine | Feature | Done | rute web |
| SIS-004 | Dashboard siswa — agregasi stats | Feature | Done | `siswaStats.test.ts` |

ADR: [SIS-ADR-0001 — Workflow mutasi/kelulusan + approval state machine](domains/siswa/ADR/SIS-ADR-0001-siswa-workflow-approval-statemachine.md)

## Guru & Staf

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| STF-001 | Staff Dashboard — role donut, stats | Feature | Done | `lib/orang/staffStats.test.ts` |
| STF-002 | Daftar Pegawai — list + filter | Feature | Done | rute web |
| STF-003 | SK Mengajar / SK Jabatan — workflow penugasan | Feature | Done | rute web |
| STF-004 | Berkas Guru — alert kedaluwarsa (scheduler) | Feature | Done | _(BE scheduler, repo terpisah)_ |

ADR: [STF-ADR-0001 — SK sebagai dokumen penugasan ber-periode](domains/staff/ADR/STF-ADR-0001-sk-penugasan.md)

## Jadwal Pelajaran

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| JDW-001 | Jadwal Pelajaran (master jadwal + slot waktu) | Feature | Done | _(BE, repo terpisah)_ |
| JDW-002 | Jadwal Override (penggantian per-tanggal) | Feature | Done | _(BE, repo terpisah)_ |
| JDW-003 | UI: daftar jadwal + slot | Feature | Done | rute web |
| JDW-004 | UI: override + slot-override | Feature | Done | rute web |

ADR: [JDW-ADR-0001 — Override tanpa mengubah master jadwal](domains/jadwal/ADR/JDW-ADR-0001-slot-override.md)

## Infrastruktur / Sarpras

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| INF-001 | CRUD Lantai | Feature | Done | rute web + _(BE)_ |
| INF-002 | CRUD Ruangan (+ Fasilitas Ruangan, child istable) | Feature | Done | rute web + _(BE)_ |
| INF-003 | CRUD Utilitas Gedung | Feature | Done | rute web |
| INF-004 | Konfirmasi hapus gedung (dialog) | Feature | Done | `gedungDetailDelete.test.tsx` |

ADR: [INF-ADR-0001 — Fasilitas Ruangan child istable (tenanted via parent)](domains/infrastruktur/ADR/INF-ADR-0001-fasilitas-child-tenancy.md)

## Absensi

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| ABS-001 | Backend Foundation (Phase 1: doctype, JWT, pairing, tap) | Feature | Done | _(BE: 22 pytest, repo terpisah)_ |
| ABS-002 | PWA Core (Phase 2: `apps/attendance_station` — layar pair/station/login, HID reader adapter, tap online, cache kartu) | Feature | Done | vitest attendance_station (tapHandler/jwt/time/api/cardCache/pairing) + layar pair/station/login |
| ABS-003 | QR Flow (Phase 3: `apps/student` `/qr` Show-QR + scanner kamera PWA, verifikasi Ed25519) | Feature | Done | vitest qr.tsx (student) + scanner/jwt (station) |
| ABS-004 | Derivasi + Rekonsiliasi (Phase 4/7: `Attendance Event.after_insert` → `derive_summaries` ke akademik Absensi Harian/Pelajaran; cron `reconcile_daily`) | Feature | Done | _(BE, repo terpisah; 17 pytest derivasi: status gate, gate/class, idempotensi, guard manual, rekonsiliasi)_ |

ADR: [ABS-ADR-0001 — Attendance Station multi-mode terpadu](domains/absensi/ADR/ABS-ADR-0001-attendance-station.md)

> Catatan: fase 2 (PWA core), 3 (QR), dan 4 (derivasi) sudah diimplementasikan
> (web: `apps/attendance_station` + `apps/student` `/qr`; BE: derivasi ke akademik
> `Absensi Harian`/`Absensi Pelajaran`, keputusan D1). Mode offline (IndexedDB queue),
> Web NFC, jembatan reader eksternal, dan notifikasi wali tetap ditunda.

## Kelas & Rombel

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| KLS-001 | CRUD Rombongan Belajar | Feature | Done | rute web |
| KLS-002 | CRUD Anggota Rombel | Feature | Done | rute web |
| KLS-003 | Dashboard Kelas (stat cards) | Feature | Done | rute web |
| KLS-004 | Detail Kelas (ringkasan, siswa) | Feature | Done | rute web |

Catatan: data master akademik (kurikulum, mapel, KKM, tahun-ajaran) didokumentasikan di domain [akademik](domains/akademik/README.html). ADR: tidak ada (CRUD murni).

## Pengaturan

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| PGT-001 | Dashboard Pengaturan (health + onboarding, role-adaptive) | Feature | Done | rute web |
| PGT-002 | Feature Flag — master list + inline toggle | Feature | Done | `InlineToggle.test.tsx` |
| PGT-003 | Modul Aktif — master list + detail | Feature | Done | rute web |
| PGT-004 | Backend Feature Flag evaluation (`is_enabled`, rollout) | Feature | Done | _(BE, repo terpisah)_ |

ADR: [PGT-ADR-0001 — Gating fitur via Feature Flag + Modul (doctype global)](domains/pengaturan/ADR/PGT-ADR-0001-feature-flag-modul-gating.md)

## Pesan

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| MSG-001 | Inbox staf sekolah — list + reply | Feature | Done | rute web |
| MSG-002 | Compose pesan baru (modal) | Feature | Done | rute web |
| MSG-003 | List pesan parent/student | Feature | Done | _(app parent/student)_ |
| MSG-004 | Outbox queue (submit reply) | Feature | Done | _(BE, repo terpisah)_ |

ADR: tidak ada (komunikasi sederhana).

## Audit Log

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| AUDIT-001 | Audit Log doctype + enforce immutability | Feature | Done | _(BE, repo terpisah)_ |
| AUDIT-002 | Audit hooks (`doc_events`, on_login/logout) | Feature | Done | _(BE, repo terpisah)_ |
| AUDIT-003 | UI Audit Log (filter severity/action) | Feature | Done | rute `audit.tsx` |
| AUDIT-004 | Arsip entri lama ke S3 + retention purge | Feature | Done | _(BE, repo terpisah)_ |

ADR: tidak ada (mekanisme audit standar Frappe).

## Verifikasi Penjemputan

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| PCK-001 | Parent app: `/pickup` + tampil QR + delegasi | Feature | Done | _(app parent: QR tests)_ |
| PCK-002 | School app: `/pickup-verify` + scanner QR + PIN | Feature | Done | _(app school: PIN tests)_ |
| PCK-003 | Backend kontrak: `sekolahpro.api.pickup.*` (HMAC, jti anti-replay) | Feature | Done | _(BE, repo terpisah)_ |
| PCK-004 | Parent app: polling event pending + banner + approval | Feature | Done | `PickupEventBanner` integration test |

ADR: [PCK-ADR-0001 — Mekanisme verifikasi penjemput](domains/pickup-verify/ADR/PCK-ADR-0001-pickup-verification.md)

## OCR Identitas

| ID | Item | Tipe | Status | Uji |
|----|------|------|--------|-----|
| OCR-001 | Doctype `Pindai Identitas` (consent + retensi + tenant-scoped) + controller `proses_ocr()` + scheduler `purge_kadaluarsa` | Feature | Done | _(BE, repo terpisah; ~30 pytest: MIME/size reject, rate-limit, Turnstile, guest vs authed, tenant scoping, consent-required, purge)_ |
| OCR-002 | Engine on-prem: `preprocess.py` (Pillow) + `tesseract.py` (pytesseract lang=ind) + `parser.py` (KTP/KK/SIM, NIK 16-digit, date norm) | Feature | Done | _(BE: parser unit tests — fixture raw-text sintetis KTP/KK/SIM, multi-anggota KK)_ |
| OCR-003 | Shared `<IdScanField>` + `<Turnstile>` di `@sekolahpro/ui`; wiring ke Siswa/Wali/Pegawai/Staf (authed) + PPDB landing + situs PpdbForm (guest) + PickupPerson | Feature | Done | vitest: `IdScanField` (mock onScan, consent-gate RTL), mapping fn per-form (siswa/wali/pegawai/ppdb/pickup) |
| OCR-004 | Privasi UU PDP: private file + permlevel-2 fields + consent checkbox + auto-purge 30 hari + on-prem only | PRD | Done | — (lihat README + spec design) |

ADR: tidak ada (keputusan arsitektur tercakup dalam [spesifikasi desain](superpowers/specs/2026-06-05-ocr-identitas-ktp-kk-sim-design.md)).

## Cakupan & sisa

Seluruh domain bisnis aplikasi **school** (rute `sch.$sekolah.*` + `kop.$sekolah.*`)
kini terdokumentasi (21 domain). Di luar cakupan dokumentasi domain (bukan domain bisnis):
aplikasi konsumen **parent / student / merchant / landing** dan konsol **saas**
(admin) — masing-masing mengonsumsi domain di atas, didokumentasikan via README app bila perlu.
