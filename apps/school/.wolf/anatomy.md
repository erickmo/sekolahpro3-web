# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-05-29T23:18:03.436Z
> Files: 358 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.gitignore` — Git ignore rules (~9 tok)
- `CLAUDE.md` — OpenWolf (~1315 tok)
- `index.html` — SekolahPro (~80 tok)
- `package.json` — Node.js package manifest (~356 tok)
- `postcss.config.js` — PostCSS configuration (~20 tok)
- `tailwind.config.js` — Tailwind CSS configuration (~71 tok)
- `tsconfig.json` — TypeScript configuration (~20 tok)
- `vite.config.ts` — Vite build configuration (~312 tok)
- `vitest.config.ts` — Vitest test configuration (~80 tok)
- `vitest.setup.ts` (~13 tok)

## .claude/

- `settings.json` (~441 tok)
- `settings.local.json` (~23 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .rtk/

- `filters.toml` — Project-local RTK filters — commit this file with your repo. (~136 tok)

## docs/

- `perpustakaan.md` — Perpustakaan — Sirkulasi (v0.6.0) (~507 tok)

## src/

- `main.tsx` — env (~345 tok)
- `routeTree.gen.ts` — @ts-nocheck (~61944 tok)
- `styles.css` — Styles: 4 rules (~29 tok)
- `test-setup.ts` (~13 tok)
- `vite-env.d.ts` — / <reference types="vite/client" /> (~11 tok)

## src/components/

- `PickupReleaseCard.tsx` — PickupReleaseCard — uses useState (~846 tok)
- `PinFallbackForm.tsx` — PinFallbackForm — uses useState (~762 tok)
- `QrScanner.tsx` — QrScanner — uses useEffect (~284 tok)
- `ResourceListPage.tsx` — Controlled value. When provided, the filter operates in controlled mode and (~2594 tok)
- `SiswaForm.tsx` — STATUS_OPTIONS — renders form (~4021 tok)
- `SiswaModals.tsx` — WaliModal — renders form, modal (~8038 tok)

## src/components/__tests__/

- `PinFallbackForm.test.tsx` — wrap (~374 tok)
- `QrScanner.test.tsx` — onDecode (~251 tok)

## src/components/absensi/

- `AbsensiCreateModal.tsx` — emptyValues — renders form, modal (~1393 tok)
- `AbsensiDetailScaffold.tsx` — AbsensiDetailScaffold — uses useParams, useNavigate (~1262 tok)
- `AbsensiGuruFormModal.tsx` — AbsensiGuruFormModal — create form modal untuk doctype "Absensi Guru". (~1514 tok)
- `AbsensiHarianFormModal.tsx` — AbsensiHarianFormModal — create form modal untuk doctype "Absensi Harian". (~1022 tok)
- `AbsensiPelajaranFormModal.tsx` — AbsensiPelajaranFormModal — create form modal untuk doctype "Absensi Pelajaran". (~1776 tok)
- `absFormatters.ts` — Exports absFormatDate, absFormatTime, ABS_STATUS_OPTIONS, ABS_STATUS_TONE (~308 tok)

## src/components/akademik/

- `AkademikContextBar.tsx` — SEMESTER_OPTIONS — uses useCallback (~770 tok)
- `CreateResourceModal.tsx` — For kind="link": Frappe doctype to query. (~3640 tok)
- `EntriNilaiGrid.tsx` — ROMBEL_FIELDS_GET — renders map — uses useState, useCallback, useMemo, useEffect (~6293 tok)
- `EntriNilaiSelector.tsx` — SEMESTER_OPTIONS — uses useState (~1511 tok)
- `GenerateRaportModal.tsx` — Optional context preset (TA + semester) from akademik context bar. (~1582 tok)
- `MapelRelatedTabs.tsx` — MapelRelatedTabs — renders table (~2467 tok)
- `SimpleDetailPage.tsx` — Title accessor — picks display name from doc (~1177 tok)

## src/components/extra-shared/

- `ExtraCreateModal.tsx` — emptyValues — renders form, modal (~1429 tok)
- `ExtraDetailScaffold.tsx` — ExtraDetailScaffold — uses useNavigate (~1214 tok)
- `useWorkflow.ts` — Lightweight workflow action helper. P2 stand-in for real Frappe workflow (~218 tok)

## src/components/guru-extra/

- `guru-fields.ts` — Field schema untuk form Tambah Guru (DocType: Guru). (~449 tok)
- `GuruCreateModal.tsx` — emptyValues — renders form, modal (~1430 tok)
- `GuruDetailScaffold.tsx` — GuruDetailScaffold — uses useNavigate (~1180 tok)
- `sub-fields.ts` — Field schemas untuk sub-form modul Guru. (~1603 tok)

## src/components/infrastruktur/

- `FasilitasRuanganFormModal.tsx` — FasilitasRuanganFormModal — create modal untuk CHILD doctype "Fasilitas Ruangan". (~1214 tok)
- `GedungFormModal.tsx` — GedungFormModal — create form modal untuk doctype "Gedung". (~1734 tok)
- `InfraDetailScaffold.tsx` — InfraDetailScaffold — uses useNavigate (~1143 tok)
- `LantaiFormModal.tsx` — LantaiFormModal — renders form, modal — uses useState (~937 tok)
- `RuanganFormModal.tsx` — RuanganFormModal — create modal untuk doctype "Ruangan". (~1836 tok)
- `UtilitasGedungFormModal.tsx` — UtilitasGedungFormModal — create modal untuk doctype "Utilitas Gedung". (~1696 tok)

## src/components/jadwal-extra/

- `workflowActions.ts` — Reusable workflow helpers for Jadwal sub-domain (status transitions via updateResource). (~261 tok)

## src/components/kelas/

- `AnggotaRombelFormModal.tsx` — AnggotaRombelFormModal — create modal untuk CHILD doctype "Anggota Rombel". (~1409 tok)
- `RombelFormModal.tsx` — RombelFormModal — create form modal untuk doctype "Rombongan Belajar". (~2253 tok)

## src/components/koperasi-admin/

- `StatusActionModal.tsx` — Status target setelah confirm. (~1123 tok)

## src/components/koperasi-kartu/

- `EmoneyModals.tsx` — todayStr — renders form, modal — uses useState (~1717 tok)
- `KartuCreateModal.tsx` — KartuCreateModal — renders form, modal (~1049 tok)
- `shared.tsx` — formatRupiah — uses useNavigate (~868 tok)

## src/components/koperasi-master/

- `GenericFormModal.tsx` — Span 1 (default) atau 2 kolom dalam grid. (~1951 tok)
- `MasterCRUD.tsx` — formatCell — uses useState (~665 tok)

## src/components/koperasi-pembiayaan/

- `akadForm.tsx` — Pre-fill anggota field (e.g. when opened from a member detail page). (~1312 tok)
- `pembayaranForm.tsx` — Pre-fill jadwal (Jadwal Angsuran name). (~1459 tok)

## src/components/koperasi-simpanan/

- `permohonanForms.tsx` — Pre-fill rekening field (detail page). When omitted, user types it. (~1985 tok)
- `transaksiForm.tsx` — Pre-fill rekening (when launched from detail page). (~1355 tok)

## src/components/koperasi/

- `AnggotaContextCard.tsx` — STATUS_TONE (~726 tok)
- `QuickActionGrid.tsx` — ACTION_SETOR (~564 tok)
- `SesiKasBanner.tsx` — Banner persisten — tampil saat teller punya Sesi Kas status=Aktif. (~701 tok)
- `SesiKasForm.tsx` — Form Buka/Tutup Sesi Kas Teller. (~3023 tok)
- `ShuWizard.tsx` — SHU Wizard 4-step: (~3168 tok)
- `TellerWorkspace.tsx` — Teller Workspace — full-screen mode dengan hotkey + RFID auto-lookup. (~2470 tok)

## src/components/koperasi/__tests__/

- `QuickActionGrid.test.tsx` — onSelect (~370 tok)

## src/components/master/

- `InlineToggle.tsx` — InlineToggle (~440 tok)
- `MasterCreateModal.tsx` — emptyValues — renders form, modal — uses useEffect (~2064 tok)
- `MasterDetailPage.tsx` — MasterDetailPage — uses useNavigate, useState (~1698 tok)
- `MasterResourcePage.tsx` — Shared list page for master.* domain. Wires ResourceListPage + MasterCreateModal + (~617 tok)
- `schemas.ts` — Shared field schemas for master.* CRUD forms. Used by list (create) + detail (edit). (~1201 tok)

## src/components/perpustakaan/

- `DendaDrawer.tsx` — DendaDrawer — inline viewer for Denda Perpustakaan rows tied to one Peminjaman. (~1068 tok)
- `dendaSummary.ts` — Denda summary helper (PERP-ADR-0001). (~356 tok)
- `PerpCreateModal.tsx` — Static options for `select`. (~2046 tok)
- `PerpDetailScaffold.tsx` — PerpDetailScaffold — uses useNavigate (~1189 tok)
- `perpFormatters.ts` — Shared formatters for perpustakaan sub-routes (P2). (~138 tok)
- `ReturnModal.tsx` — ReturnModal renders a small form to capture the actual return date plus (~1089 tok)

## src/components/perpustakaan/__tests__/

- `DendaDrawer.test.tsx` — PERP-ADR-0001 — Test DendaDrawer: lists denda + mark-lunas action. (~470 tok)
- `dendaSummary.test.ts` — Declares DendaSummary (~283 tok)
- `ReturnModal.test.tsx` — Tests for ReturnModal — POST + SUBMIT Pengembalian Buku flow (PERP-ADR-0001). (~792 tok)

## src/components/pesan/

- `PesanComposeModal.tsx` — PesanComposeModal — log a new entry into "Contact Inbox SekolahPro". (~1216 tok)

## src/components/ppdb-extra/

- `PpdbActionPanel.tsx` — Status-aware action surface for a single Pendaftaran PPDB. (~2706 tok)
- `PpdbDetailModals.tsx` — Modals untuk detail Pendaftaran PPDB: (~2935 tok)
- `workflowActions.ts` — Reusable workflow helpers for PPDB sub-domain (status transitions via updateResource). (~240 tok)

## src/components/ppdb-extra/__tests__/

- `PpdbActionPanel.test.tsx` — Tests untuk PpdbActionPanel — verifikasi visibility matrix berbasis status (~1229 tok)

## src/components/shared/

- `DomainDetailScaffold.tsx` — DomainDetailScaffold — uses useParams, useNavigate (~1225 tok)
- `ResourceCreateModal.tsx` — For `link`: target DocType to query. (~2080 tok)

## src/components/siswa/

- `AnggotaRombelFormModal.tsx` — AnggotaRombelFormModal — append child row to "Rombongan Belajar".anggota. (~1773 tok)

## src/components/staff/

- `BerkasGuruFormModal.tsx` — BerkasGuruFormModal — create form for doctype "Berkas Guru". (~1820 tok)
- `JabatanFormModal.tsx` — INITIAL — renders form, modal (~965 tok)
- `SkJabatanFormModal.tsx` — SkJabatanFormModal — create form for doctype "SK Jabatan". (~1997 tok)
- `StaffFormModal.tsx` — StaffFormModal — create form modal for doctype "Guru" (staff includes guru + non-pengajar). (~2521 tok)

## src/data/

- `akuntansi.ts` — Type definitions + constants + helpers for modul Akuntansi. (~4651 tok)
- `create-schemas.ts` — Centralized create-form schemas for sub-domain "P2" routes. (~1975 tok)
- `kelas.ts` — Mock data fixture untuk modul Kelas (rombel). (~4081 tok)
- `keuangan.ts` — Mock data fixture untuk modul Keuangan Sekolah. (~3648 tok)
- `koperasi.ts` — Mock data fixture untuk modul Koperasi. (~3521 tok)
- `onboarding.ts` — Onboarding checklist source of truth — each step's `done` flag derives (~910 tok)
- `pegawai.ts` — Exports RolePegawai, StatusPegawai, JenisKelamin, Agama + 20 more (~6864 tok)
- `perpustakaan.ts` — Mock data fixture untuk modul Perpustakaan. (~4015 tok)
- `pickup-types.ts` — Exports PickupHubungan, PickupEventStatus, PickupPersonSummary, ChildSummaryForStaff + 2 more (~281 tok)
- `pickup.ts` — Exports useStaffScanToken, useStaffListPersonsForNis, useStaffVerifyPin, useStaffCompletePickup + 2 more (~1727 tok)
- `ppdb.ts` — Mock data fixture untuk modul PPDB (Penerimaan Peserta Didik Baru). (~4534 tok)
- `school-scope.ts` — Shared school-scoping helpers for mock fixtures. (~220 tok)
- `sekolah.ts` — Exports SekolahCard, SekolahGroup, MySchoolsResponse, SelectSchoolResponse + 3 more (~434 tok)
- `siswa.test.ts` — Declares ids (~313 tok)
- `siswa.ts` — NIK ayah sesuai KK (digunakan jika hubungan=Ayah). (~4260 tok)

## src/data/__tests__/

- `pegawai.test.ts` — Declares p (~413 tok)
- `sekolah.test.ts` — Declares MySchoolsResponse (~158 tok)

## src/data/mock/

- `pickup.ts` — Exports mockScanToken, mockListPersonsForNis, mockVerifyPin (~558 tok)

## src/features/pegawai/

- `AktivitasTab.tsx` — TONE_CLASS (~289 tok)
- `ApiBerkasSection.tsx` — tone — renders table (~633 tok)
- `ApiKehadiranSection.tsx` — `Detail Absensi Guru` is a child table; `tanggal` lives on the parent (~774 tok)
- `ApiMengajarTab.tsx` — ApiMengajarTab — renders table, map (~791 tok)
- `ApiPegawaiHeader.tsx` — ApiPegawaiHeader (~328 tok)
- `ApiProfilTab.tsx` — Section (~804 tok)
- `ApiStaffTab.tsx` — ApiStaffTab (~167 tok)
- `BerkasTab.tsx` — BerkasTab — renders table (~261 tok)
- `daftarColumns.tsx` — matchesRoleFilter (~400 tok)
- `docMethods.ts` — Mutation hook for a single DocType instance method. (~335 tok)
- `KehadiranTab.tsx` — KehadiranTab — renders table (~304 tok)
- `MengajarTab.tsx` — MengajarTab — renders table (~1026 tok)
- `PegawaiActions.tsx` — Per-row action: create the 1:1 SK Mengajar for an active Penugasan Guru. (~998 tok)
- `PegawaiFormModal.tsx` — PEGAWAI_DOCTYPE — renders form, modal — uses useState (~2172 tok)
- `PegawaiHeader.tsx` — STATUS_TONE (~323 tok)
- `ProfilTab.tsx` — ProfilTab (~746 tok)
- `RoleBadges.tsx` — RoleBadges (~112 tok)
- `roles.ts` — Exports PegawaiApi, apiIsGuru, apiIsStaff, apiIsDualRole, apiRoleBadges (~436 tok)
- `StaffTab.tsx` — PRIO_CLASS — renders table (~871 tok)

## src/features/pegawai/__tests__/

- `roles.test.ts` — Declares PegawaiApi (~339 tok)

## src/hooks/

- `useGlobalHotkeys.ts` — Global keydown listener untuk teller workspace. (~430 tok)
- `useRfidListener.ts` — Window-level RFID listener. (~609 tok)

## src/hooks/__tests__/

- `useGlobalHotkeys.test.tsx` — Harness (~565 tok)
- `useRfidListener.test.tsx` — Harness (~320 tok)

## src/lib/

- `akademikContext.tsx` — Ctx — uses useMemo, useContext (~262 tok)
- `akuntansi-scope.ts` — Active-sekolah → Vernon Accounting `company` scoping. (~383 tok)
- `global-search.ts` — Client-side global search across mock data fixtures. (~783 tok)
- `glossary.ts` — Exports GlossaryTerm, GLOSSARY, defOf (~250 tok)
- `ppdbApi.ts` — PPDB whitelisted API hooks (TanStack Query mutations + helpers). (~1652 tok)
- `scoped.ts` — URL scope helpers — convert bare paths into `/$sekolah/...` shaped paths (~722 tok)
- `stub.ts` — Quick acknowledgement helper for actions that need backend wiring. (~1152 tok)

## src/lib/koperasi/

- `masterConfigs.ts` — Doctype Frappe. (~1478 tok)
- `rfid.ts` — RFID HID-keyboard buffer parser. (~642 tok)
- `sesiKas.ts` — Pure helpers untuk Sesi Kas Teller. (~842 tok)
- `shuWizard.ts` — Pure helpers untuk SHU Wizard 4-step. (~882 tok)

## src/lib/koperasi/__tests__/

- `masterConfigs.test.ts` — Declares names (~370 tok)
- `rfid.test.ts` — Declares RfidKeyEvent (~772 tok)
- `sesiKas.test.ts` — Declares DenominasiItem (~1014 tok)
- `shuWizard.test.ts` — Declares out (~752 tok)

## src/routes/

- `__root.tsx` — SEARCH_MIN_QUERY — renders chart — uses useState, useEffect, useMemo, useNavigate (~5464 tok)
- `$sekolah.absensi.daftar.tsx` — COLUMNS — uses useState (~592 tok)
- `$sekolah.absensi.guru.tsx` — COLUMNS — uses useState (~506 tok)
- `$sekolah.absensi.index.tsx` — ABSENSI_FLOW_STEPS — uses useParams, useMemo (~3472 tok)
- `$sekolah.absensi.pelajaran.tsx` — COLUMNS — uses useState (~508 tok)
- `$sekolah.absensi.tsx` — TABS (~298 tok)
- `$sekolah.akademik.daftar.tsx` — KELOMPOK_OPTIONS — uses useParams, useNavigate, useState (~1069 tok)
- `$sekolah.akademik.entri-nilai.edit.tsx` — EntriNilaiEditPage — uses useParams, useNavigate, useCallback (~746 tok)
- `$sekolah.akademik.entri-nilai.tsx` — PREDIKAT_TONE — uses useParams, useNavigate, useMemo (~917 tok)
- `$sekolah.akademik.index.tsx` — MAPEL_FIELDS — renders chart, map — uses useParams, useMemo (~4111 tok)
- `$sekolah.akademik.kkm.tsx` — TINGKAT_OPTIONS — uses useState, useMemo (~1732 tok)
- `$sekolah.akademik.komponen-nilai.tsx` — COLUMNS — uses useMemo, useState (~1751 tok)
- `$sekolah.akademik.konfigurasi.tsx` — TIPE_OPTIONS — uses useState (~1212 tok)
- `$sekolah.akademik.kurikulum.$name.tsx` — KurikulumDetailPage — uses useParams (~201 tok)
- `$sekolah.akademik.kurikulum.tsx` — TIPE_OPTIONS — uses useParams, useNavigate, useState (~1015 tok)
- `$sekolah.akademik.mapel.$name.tsx` — KELOMPOK_TONE — renders map — uses useParams (~576 tok)
- `$sekolah.akademik.raport.tsx` — STATUS_OPTIONS — uses useState, useMemo (~1182 tok)
- `$sekolah.akademik.tsx` — NAV_GROUPS — uses useNavigate, useCallback (~978 tok)
- `$sekolah.akuntansi.anggaran.amandemen.tsx` — AmandemenPage — renders table — uses useState, useMemo (~647 tok)
- `$sekolah.akuntansi.anggaran.budget.$name.tsx` — BudgetDetailPage — renders table — uses useParams, useNavigate, useState (~1189 tok)
- `$sekolah.akuntansi.anggaran.budget.new.tsx` — emptyRow — renders form, table — uses useParams, useNavigate, useState, useMemo (~2023 tok)
- `$sekolah.akuntansi.anggaran.cost-center.tsx` — CostCenterPage — renders form, table, modal — uses useState, useMemo (~1490 tok)
- `$sekolah.akuntansi.anggaran.dimensi.tsx` — DimensiPage — renders form, table, modal — uses useState, useMemo (~1358 tok)
- `$sekolah.akuntansi.anggaran.index.tsx` — BudgetListPage — renders table — uses useParams, useState, useMemo (~964 tok)
- `$sekolah.akuntansi.anggaran.tsx` — SUBTABS (~314 tok)
- `$sekolah.akuntansi.buku-besar.akun.tsx` — ALL — renders form, table, chart, modal — uses useState, useMemo, useEffect (~2062 tok)
- `$sekolah.akuntansi.buku-besar.gl.tsx` — ALL — renders table — uses useState, useMemo (~1236 tok)
- `$sekolah.akuntansi.buku-besar.index.tsx` — BukuBesarRingkasan — renders chart — uses useParams (~1240 tok)
- `$sekolah.akuntansi.buku-besar.jurnal.$name.tsx` — JurnalDetailPage — renders table — uses useParams, useNavigate, useState (~1267 tok)
- `$sekolah.akuntansi.buku-besar.jurnal.index.tsx` — STATUS_OPTIONS — renders table — uses useParams, useState, useMemo (~1053 tok)
- `$sekolah.akuntansi.buku-besar.jurnal.new.tsx` — emptyRow — renders form, table — uses useParams, useNavigate, useState, useMemo (~2112 tok)
- `$sekolah.akuntansi.buku-besar.pembayaran.$name.tsx` — PembayaranDetailPage — renders table — uses useParams, useNavigate, useState (~1290 tok)
- `$sekolah.akuntansi.buku-besar.pembayaran.index.tsx` — ALL — renders table — uses useParams, useState, useMemo (~1142 tok)
- `$sekolah.akuntansi.buku-besar.pembayaran.new.tsx` — PembayaranNewPage — renders form — uses useParams, useNavigate, useState (~1439 tok)
- `$sekolah.akuntansi.buku-besar.tsx` — SUBTABS (~337 tok)
- `$sekolah.akuntansi.index.tsx` — BUKU_BESAR_LINKS — renders chart — uses useParams (~2125 tok)
- `$sekolah.akuntansi.pajak.efaktur.tsx` — EfakturPage — renders form, table, modal — uses useState, useMemo (~1341 tok)
- `$sekolah.akuntansi.pajak.index.tsx` — PajakOverview — renders chart — uses useParams (~910 tok)
- `$sekolah.akuntansi.pajak.spt-ppn.$name.tsx` — SptPpnDetailPage — uses useParams, useNavigate, useState (~835 tok)
- `$sekolah.akuntansi.pajak.spt-ppn.index.tsx` — SptPpnPage — renders form, table, modal — uses useParams, useState, useMemo (~1334 tok)
- `$sekolah.akuntansi.pajak.tax-period.tsx` — ALL — renders form, table, modal — uses useState, useMemo (~1699 tok)
- `$sekolah.akuntansi.pajak.template.tsx` — TaxTemplatePage — renders table — uses useState, useMemo (~563 tok)
- `$sekolah.akuntansi.pajak.ter.tsx` — TerPage — renders table (~717 tok)
- `$sekolah.akuntansi.pajak.tsx` — SUBTABS (~370 tok)
- `$sekolah.akuntansi.pajak.withholding.tsx` — ALL — renders form, table, modal — uses useState, useMemo (~2147 tok)
- `$sekolah.akuntansi.referensi.currency.tsx` — CurrencyPage — renders form, table, modal — uses useState, useMemo (~1118 tok)
- `$sekolah.akuntansi.referensi.fiscal-year.tsx` — FiscalYearPage — renders form, table, modal — uses useState, useMemo (~1426 tok)
- `$sekolah.akuntansi.referensi.index.tsx` — ReferensiOverview — uses useParams (~407 tok)
- `$sekolah.akuntansi.referensi.period.tsx` — PeriodPage — renders form, table, modal — uses useState, useMemo (~1529 tok)
- `$sekolah.akuntansi.referensi.settings.tsx` — SINGLE_NAME — renders form — uses useState, useEffect (~1580 tok)
- `$sekolah.akuntansi.referensi.tsx` — SUBTABS (~344 tok)
- `$sekolah.akuntansi.tsx` — TABS (~317 tok)
- `$sekolah.audit.tsx` — Wired to backend DocType: "Audit Log SekolahPro" (~822 tok)
- `$sekolah.index.tsx` — ONBOARDING_DISMISS_KEY — renders chart — uses useParams, useState (~3531 tok)
- `$sekolah.infrastruktur.daftar.tsx` — COLUMNS — uses useState (~496 tok)
- `$sekolah.infrastruktur.fasilitas.tsx` — COLUMNS — uses useState (~537 tok)
- `$sekolah.infrastruktur.index.tsx` — INFRA_FLOW_STEPS — uses useParams, useState, useMemo (~3291 tok)
- `$sekolah.infrastruktur.lantai.tsx` — COLUMNS — uses useState (~418 tok)
- `$sekolah.infrastruktur.ruangan.tsx` — COLUMNS — uses useState (~671 tok)
- `$sekolah.infrastruktur.tsx` — TABS (~338 tok)
- `$sekolah.infrastruktur.utilitas.tsx` — COLUMNS — uses useState (~643 tok)
- `$sekolah.jadwal.daftar.tsx` — TODO(/jadwal/daftar): Jadwal Pelajaran header doctype only has (~732 tok)
- `$sekolah.jadwal.index.tsx` — HARI_INI — uses useParams, useMemo (~3002 tok)
- `$sekolah.jadwal.override.tsx` — COLUMNS — uses useState (~554 tok)
- `$sekolah.jadwal.slot-override.tsx` — COLUMNS — uses useState (~502 tok)
- `$sekolah.jadwal.slot.$name.tsx` — SlotJadwalDetailPage — uses useParams (~498 tok)
- `$sekolah.jadwal.slot.tsx` — COLUMNS — uses useParams, useState, useNavigate (~828 tok)
- `$sekolah.jadwal.tsx` — TABS (~316 tok)
- `$sekolah.kelas.$kodeKelas.tsx` — ANGGOTA_STATUS_MAP — renders chart (~8532 tok)
- `$sekolah.kelas.anggota.tsx` — COLUMNS — uses useState (~549 tok)
- `$sekolah.kelas.daftar.tsx` — COLUMNS — uses useState (~593 tok)
- `$sekolah.kelas.index.tsx` — KELAS_FLOW_STEPS — renders chart — uses useParams, useMemo (~3008 tok)
- `$sekolah.kelas.rombel.tsx` — COLUMNS — uses useState (~566 tok)
- `$sekolah.kelas.tsx` — TABS (~296 tok)
- `$sekolah.keuangan.tsx` — TODO(api-migration): Backend Tagihan/Pembayaran/Pengeluaran/Jurnal/Kas doctypes (~8218 tok)
- `$sekolah.koperasi.$noAnggota.tsx` — STATUS_TONE — renders chart (~8793 tok)
- `$sekolah.koperasi.angsuran.$name.tsx` — JADWAL_DOCTYPE — renders table — uses useParams, useNavigate, useMemo, useState (~2009 tok)
- `$sekolah.koperasi.angsuran.tsx` — COLUMNS — uses useState (~728 tok)
- `$sekolah.koperasi.daftar.tsx` — Verified fields on `Anggota Koperasi` doctype: (~1148 tok)
- `$sekolah.koperasi.emoney.$name.tsx` — EmoneyDetail — uses useParams (~602 tok)
- `$sekolah.koperasi.emoney.tsx` — COLUMNS — uses useParams, useNavigate, useState (~875 tok)
- `$sekolah.koperasi.index.tsx` — Dashboard Koperasi. (~3096 tok)
- `$sekolah.koperasi.kartu.$name.tsx` — STATUS_TONE — renders form, modal — uses useParams, useNavigate, useState (~1679 tok)
- `$sekolah.koperasi.kartu.tsx` — COLUMNS — uses useParams, useState, useNavigate (~684 tok)
- `$sekolah.koperasi.kas-teller.tsx` — STATUS_TONE — uses useState (~1054 tok)
- `$sekolah.koperasi.laporan.tsx` — LaporanKoperasiPage (~673 tok)
- `$sekolah.koperasi.pembiayaan.$name.tsx` — AKAD_DOCTYPE — renders table — uses useParams, useNavigate, useMemo, useState (~3460 tok)
- `$sekolah.koperasi.pembiayaan.tsx` — COLUMNS — uses useParams, useNavigate, useState (~857 tok)
- `$sekolah.koperasi.pengaturan.tsx` — Pengaturan koperasi — 6 tab master. (~1035 tok)
- `$sekolah.koperasi.period-close.tsx` — Period Close — Supervisor tutup/reopen periode operasional. (~1415 tok)
- `$sekolah.koperasi.persetujuan.tsx` — Approval Inbox — satu pintu masuk supervisor untuk seluruh permohonan (~2205 tok)
- `$sekolah.koperasi.ppatk.tsx` — Laporan PPATK — submit ke goAML. (~1389 tok)
- `$sekolah.koperasi.rekening.$name.tsx` — STATUS_TONE — uses useParams, useNavigate, useState (~2625 tok)
- `$sekolah.koperasi.rekening.tsx` — COLUMNS — uses useParams, useNavigate, useState (~763 tok)
- `$sekolah.koperasi.shu.tsx` — COLUMNS — uses useState (~587 tok)
- `$sekolah.koperasi.transaksi.$name.tsx` — JENIS_TONE — uses useParams, useNavigate (~1576 tok)
- `$sekolah.koperasi.transaksi.tsx` — COLUMNS — uses useParams, useNavigate, useState (~683 tok)
- `$sekolah.koperasi.tsx` — Konsolidasi nav 14 tab → 6 grup + sub-tab kontekstual. (~1243 tok)
- `$sekolah.koperasi.wakaf.tsx` — COLUMNS (~499 tok)
- `$sekolah.koperasi.workspace.tsx` — WorkspaceGate — uses useParams (~525 tok)
- `$sekolah.koperasi.zis.tsx` — COLUMNS (~572 tok)
- `$sekolah.laporan.tsx` — Wired to backend DocType: "Laporan Terjadwal" (~1097 tok)
- `$sekolah.master.daftar.$name.tsx` — SekolahDetailPage — uses useParams (~390 tok)
- `$sekolah.master.daftar.tsx` — COLUMNS (~482 tok)
- `$sekolah.master.feature-flag.$name.tsx` — FeatureFlagDetailPage — uses useParams (~346 tok)
- `$sekolah.master.feature-flag.tsx` — COLUMNS (~432 tok)
- `$sekolah.master.index.tsx` — MASTER_FLOW_STEPS — uses useParams, useMemo (~3012 tok)
- `$sekolah.master.modul.$name.tsx` — ModulDetailPage — uses useParams (~324 tok)
- `$sekolah.master.modul.tsx` — COLUMNS (~421 tok)
- `$sekolah.master.organisasi.$name.tsx` — OrganisasiDetailPage — uses useParams (~331 tok)
- `$sekolah.master.organisasi.tsx` — COLUMNS (~431 tok)
- `$sekolah.master.pengguna.$name.tsx` — PenggunaDetailPage — uses useParams (~378 tok)
- `$sekolah.master.pengguna.tsx` — COLUMNS (~467 tok)
- `$sekolah.master.semester.$name.tsx` — SemesterDetailPage — uses useParams (~376 tok)
- `$sekolah.master.semester.tsx` — COLUMNS (~488 tok)
- `$sekolah.master.tahun-ajaran.$name.tsx` — TahunAjaranDetailPage — uses useParams (~346 tok)
- `$sekolah.master.tahun-ajaran.tsx` — COLUMNS (~459 tok)
- `$sekolah.master.tsx` — TABS (~384 tok)
- `$sekolah.master.unit-jenjang.$name.tsx` — UnitJenjangDetailPage — uses useParams (~354 tok)
- `$sekolah.master.unit-jenjang.tsx` — COLUMNS (~454 tok)
- `$sekolah.pengaturan.tsx` — SAAS_ROLES — renders form, modal (~16235 tok)
- `$sekolah.perpustakaan.$isbn.tsx` — PERP-ADR-0001 — Buku detail page wires the "Sedang Dipinjam" section to (~8931 tok)
- `$sekolah.perpustakaan.anggota.$name.tsx` — Anggota Perpustakaan detail page. (~1744 tok)
- `$sekolah.perpustakaan.anggota.tsx` — COLUMNS — uses useParams, useNavigate, useState (~1072 tok)
- `$sekolah.perpustakaan.daftar.tsx` — Verified fields on `Buku` doctype: (~1120 tok)
- `$sekolah.perpustakaan.denda.$name.tsx` — Redirect stub — PERP-ADR-0001. (~352 tok)
- `$sekolah.perpustakaan.denda.tsx` — Redirect stub — PERP-ADR-0001. (~154 tok)
- `$sekolah.perpustakaan.index.tsx` — PERPUS_FLOW_STEPS — renders chart — uses useParams, useMemo (~4709 tok)
- `$sekolah.perpustakaan.inventaris.berita-acara.$name.tsx` — BA Kerusakan Buku — detail (create / edit / approve). (~4165 tok)
- `$sekolah.perpustakaan.inventaris.berita-acara.tsx` — Berita Acara Kerusakan Buku — daftar insiden kerusakan / hilang per eksemplar. (~1085 tok)
- `$sekolah.perpustakaan.inventaris.opname.$name.tsx` — Stock Opname — scan mode. (~5682 tok)
- `$sekolah.perpustakaan.inventaris.opname.tsx` — Stock Opname Perpustakaan — daftar sesi audit inventaris. (~843 tok)
- `$sekolah.perpustakaan.inventaris.tsx` — Inventaris — umbrella tab untuk audit koleksi. (~499 tok)
- `$sekolah.perpustakaan.kategori.tsx` — Backend DocType: `Kategori Buku`. Minimal taxonomy used as Link target on (~621 tok)
- `$sekolah.perpustakaan.kolektif.$name.tsx` — Pinjam Kolektif Kelas — detail / create. (~4678 tok)
- `$sekolah.perpustakaan.kolektif.tsx` — Pinjam Kolektif Kelas — daftar pinjam paket bacaan rombongan. (~924 tok)
- `$sekolah.perpustakaan.laporan.tsx` — LaporanPage (~634 tok)
- `$sekolah.perpustakaan.peminjaman.$name.tsx` — Detail Peminjaman Buku — pusat sirkulasi single-doc. (~1986 tok)
- `$sekolah.perpustakaan.peminjaman.tsx` — Perpustakaan Peminjaman — unified circulation hub. (~2662 tok)
- `$sekolah.perpustakaan.pengadaan.$name.tsx` — Pengadaan Buku — detail / create. (~5136 tok)
- `$sekolah.perpustakaan.pengadaan.tsx` — Pengadaan Buku — daftar pengadaan koleksi (Pembelian / Hibah / Sumbangan). (~970 tok)
- `$sekolah.perpustakaan.pengembalian.$name.tsx` — Redirect stub — PERP-ADR-0001. (~402 tok)
- `$sekolah.perpustakaan.pengembalian.tsx` — Redirect stub — PERP-ADR-0001. (~168 tok)
- `$sekolah.perpustakaan.reservasi.$name.tsx` — DOCTYPE — uses useParams, useNavigate (~994 tok)
- `$sekolah.perpustakaan.reservasi.tsx` — COLUMNS — uses useParams, useNavigate, useState (~1004 tok)
- `$sekolah.perpustakaan.terminal.tsx` — RFID Terminal — full-screen self-service terminal untuk pustakawan. (~3740 tok)
- `$sekolah.perpustakaan.tsx` — TABS (~422 tok)
- `$sekolah.pesan.tsx` — PESAN_FLOW_STEPS — uses useState, useMemo (~3872 tok)
- `$sekolah.pickup-verify.tsx` — GATES (~1017 tok)
- `$sekolah.ppdb.$noPendaftaran.tsx` — STATUS_TONE — renders chart (~12324 tok)
- `$sekolah.ppdb.buat.tsx` — PPDB Create Flow — wizard end-to-end: (~10138 tok)
- `$sekolah.ppdb.calon-siswa.tsx` — Calon Siswa — list + form CRUD lengkap untuk biodata pendaftar. (~3139 tok)
- `$sekolah.ppdb.daftar-ulang.tsx` — Daftar Ulang PPDB — pelunasan + finalisasi ke Siswa. (~2474 tok)
- `$sekolah.ppdb.daftar.tsx` — Pendaftaran PPDB list — bulk-action capable. (~4108 tok)
- `$sekolah.ppdb.gelombang.tsx` — Gelombang PPDB — list + kuota meter + activate/close lifecycle. (~3536 tok)
- `$sekolah.ppdb.index.tsx` — KUOTA_GELOMBANG_AKTIF_STUB — uses useParams, useMemo (~4850 tok)
- `$sekolah.ppdb.pembayaran.tsx` — Pembayaran PPDB — list + create payment order via gateway. (~2090 tok)
- `$sekolah.ppdb.pengaturan.tsx` — Pengaturan PPDB — Singleton form (no list). (~2074 tok)
- `$sekolah.ppdb.seleksi.tsx` — Seleksi PPDB — batch scoring + bulk pengumuman per gelombang. (~3078 tok)
- `$sekolah.ppdb.tsx` — TABS (~375 tok)
- `$sekolah.siswa.$nis.edit.tsx` — SiswaEditPage — uses useParams, useNavigate (~769 tok)
- `$sekolah.siswa.$nis.tsx` — PII_ROLES — renders chart — uses useState (~14285 tok)
- `$sekolah.siswa.daftar.tsx` — TONE_BY_STATUS — uses useParams, useNavigate (~865 tok)
- `$sekolah.siswa.ijazah.tsx` — DOWNLOAD_REASONS — uses useState, useParams (~1845 tok)
- `$sekolah.siswa.index.tsx` — SISWA_FLOW_STEPS — uses useParams, useMemo (~3226 tok)
- `$sekolah.siswa.kelulusan.$id.tsx` — ROLE_KATU — uses useParams, useMemo, useState (~2979 tok)
- `$sekolah.siswa.kelulusan.new.tsx` — INITIAL — renders form — uses useParams, useNavigate, useCallback (~2678 tok)
- `$sekolah.siswa.kelulusan.tsx` — STATE_TONE — uses useParams, useMemo, useNavigate (~861 tok)
- `$sekolah.siswa.mutasi-masuk.new.tsx` — NPSN_REGEX — renders form — uses useParams, useNavigate, useState, useCallback (~3519 tok)
- `$sekolah.siswa.mutasi-masuk.tsx` — STATUS_TONE — uses useParams, useNavigate (~710 tok)
- `$sekolah.siswa.mutasi.$id.tsx` — ROLE_KATU — uses useParams, useNavigate, useMemo, useState (~2579 tok)
- `$sekolah.siswa.mutasi.new.tsx` — JENIS_OPTIONS — renders form — uses useParams, useNavigate, useCallback (~2424 tok)
- `$sekolah.siswa.mutasi.tsx` — STATE_TONE — uses useParams, useMemo, useNavigate (~808 tok)
- `$sekolah.siswa.new.tsx` — SiswaNewPage — uses useParams, useNavigate (~489 tok)
- `$sekolah.siswa.pendaftaran.$id.tsx` — STATUS_TONE — uses useParams (~2022 tok)
- `$sekolah.siswa.pendaftaran.new.tsx` — JENIS_OPTIONS — renders form — uses useParams, useNavigate, useCallback (~2967 tok)
- `$sekolah.siswa.pendaftaran.tsx` — STATUS_TONE — uses useParams, useMemo, useNavigate (~952 tok)
- `$sekolah.siswa.persetujuan.$id.tsx` — STATUS_TONE — uses useParams, useState (~1767 tok)
- `$sekolah.siswa.persetujuan.new.tsx` — PURPOSES — renders form — uses useParams, useNavigate, useCallback (~2375 tok)
- `$sekolah.siswa.persetujuan.tsx` — STATUS_TONE — uses useParams, useMemo, useNavigate (~875 tok)
- `$sekolah.siswa.perubahan-data.$id.tsx` — ROLE_KATU — uses useParams, useMemo, useState (~2744 tok)
- `$sekolah.siswa.perubahan-data.new.tsx` — CRITICAL_FIELDS — renders form (~2609 tok)
- `$sekolah.siswa.perubahan-data.tsx` — STATE_TONE — uses useParams, useMemo, useNavigate (~885 tok)
- `$sekolah.siswa.rombel.tsx` — COLUMNS — uses useState (~452 tok)
- `$sekolah.siswa.tsx` — TABS (~325 tok)
- `$sekolah.siswa.wali.$name.tsx` — WaliDetailPage — uses useParams, useNavigate, useEffect (~670 tok)
- `$sekolah.siswa.wali.tsx` — makeColumns — uses useParams, useMemo (~794 tok)
- `$sekolah.staff.$nip.tsx` — Route param `$nip` carries the Pegawai `name` (autoname like PEGAWAI-0001). (~950 tok)
- `$sekolah.staff.berkas.tsx` — COLUMNS — uses useState (~622 tok)
- `$sekolah.staff.daftar.tsx` — ROLE_OPTIONS — renders table — uses useParams, useState, useMemo (~1685 tok)
- `$sekolah.staff.index.tsx` — PEGAWAI_LIST_LIMIT — uses useParams, useMemo (~744 tok)
- `$sekolah.staff.jabatan.tsx` — COLUMNS — uses useState (~456 tok)
- `$sekolah.staff.mapel-pengampu.tsx` — COLUMNS — uses useState (~566 tok)
- `$sekolah.staff.penugasan.tsx` — COLUMNS — uses useState (~648 tok)
- `$sekolah.staff.sk-jabatan.tsx` — skTone — uses useState (~621 tok)
- `$sekolah.staff.sk-mengajar.tsx` — skTone — uses useState (~727 tok)
- `$sekolah.staff.tsx` — TABS (~363 tok)
- `$sekolah.tsx` — SekolahLayout — uses useParams, useEffect (~904 tok)
- `login.tsx` — LoginPage — renders form — uses useNavigate, useState (~1903 tok)
- `pilih-sekolah.tsx` — ROLE_TONE — uses useNavigate, useState, useEffect, useMemo (~4121 tok)

## src/routes/__tests__/

- `pilih-sekolah.test.tsx` — wrap (~1777 tok)
