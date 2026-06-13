# Plan 2026-06-13 — Koperasi: Nasabah feature + BE-gap close + contract fixes

> STATUS: TERIMPLEMENTASI 2026-06-13. WS0 = PR BE sekolahpro3 #53;
> sisa wave di PR web ini. Verify: tsc 0 / vitest school 1428 / api-client 44 /
> auth 5 / eslint 0 error / build OK / smoke REST live (derivasi tenant) OK.

Goal: implement Nasabah (+ ZIS penyaluran/program, E-Money Wallet) in FE `/kop/**`,
fix EVERY FE↔BE contract mismatch so all pages/forms work. Reviewed by SA agent
(aafc9990) + CR agent (a2e0bda) — both APPROVE with changes, incorporated below.

Root cause systemic: KOPERASI-tier doctypes never get `sekolah` auto-set
(tenant_scope only fills `koperasi`, and FE never sends X-Active-Koperasi) →
every koperasi insert dies with MandatoryError. Fix = BE derivation + FE header.

## WS0 — BE PR (repo sekolahpro, separate)
- [x] tenant_scope: KOPERASI branch — after koperasi resolved, derive missing
      `sekolah` from Koperasi.sekolah_utama → first Koperasi Sekolah child.
- [x] e_money_wallet._debit_rekening/_credit_rekening: propagate sekolah+koperasi
      from the Rekening Simpanan row (fixes web + scheduler paths).
- [x] FrappeTestCase both. Log follow-up: sanctions.py "Guru" dead branch.

## Wave A — plumbing (FE)
- [x] packages/auth: ActiveSekolah.kind?: "sekolah"|"koperasi".
- [x] packages/api-client: ACTIVE_KOPERASI_HEADER + cfg.getActiveKoperasi (frappeResource + frappeFetch).
- [x] api-client: generic runDocMethod + useDocMethod (move from features/pegawai, re-export there).
- [x] school main.tsx getActiveKoperasi; kop.$sekolah.tsx + pilih.tsx set kind:"koperasi".
- [x] components/shared/searchLink.ts + FormSection extract (4 copies → 1); humanizeFrappeError in touched modals.

## Wave B — WS1 contract fixes (audit table aee08b99, ~60 issues)
zis, wakaf(+nazhir reqd, drop keterangan), emoney+$name, daftar, index tone,
rekening(+Diblokir)+$name, transaksi+$name (rekening_simpanan/jumlah/approval_status),
kartu+$name (uid_nfc, lowercase status, blokir/aktifkan doc-methods, tipe_kartu),
pembiayaan+$name (nasabah/produk_pembiayaan/jumlah_pokok/tenor; status Aktif/Lunas/Macet;
jadwal child via parent doc), angsuran+$name (child scoping; Terlambat;
Pembayaran Angsuran akad_pembiayaan/angsuran_ke/jumlah_bayar), shu dead cols,
laporan Berjalan→Aktif, persetujuan (per-doctype fields; approve/reject doc-methods),
period-close (create minus RO; tutup/reopen doc-methods), ppatk (drop RO writes),
SesiKasForm (denominasi {denominasi,jumlah_lembar}; +tanggal+supervisor_buka;
tutup_kas/approve_tutup doc-methods), transaksiForm (Setoran/Penarikan/Bagi Hasil;
rekening_simpanan; jumlah; drop Transfer/Koreksi/rekening_tujuan) + transaksiGuard +
sesiKas CASH_SIGN + QuickActionGrid + onboarding defaultJenis,
permohonanForms (nasabah picker NSB; produk_simpanan; rekening_simpanan;
alasan_blokir; tanggal_buka; drop catatan/akad/setoran_awal),
pembayaranForm (akad-scoped angsuran picker), EmoneyModals rewrite,
KartuCreateModal (uid_nfc/tipe_kartu/status/tanggal_expired), TellerWorkspace rek.name,
masterConfigs (Fatwa DSN MUI; Merchant real link fields; Denominasi jenis reqd),
DashboardWorklist (Terlambat; Calon Anggota jenis-vs-status; Setoran/Penarikan).
Update breaking tests: akadContract, masterConfigs, filterKoperasiNav, KoperasiPageGuide EXPECTED_IDS.

## Wave C — Nasabah
- [x] lib/koperasi/nasabahKyc.ts (mirror nasabah.py + kyc_review.py: both elevation
      flags; source reqd Medium/High; overdue Low-never/null-date/365-180d) + tests.
- [x] components/shared/DynamicLinkPicker.tsx (pihak_tipe allowlist Siswa|Pegawai|User,
      label nama_lengkap/nama_lengkap/full_name) — shared w/ Penyaluran penerima.
- [x] components/koperasi-nasabah/{NasabahFormModal,KycPanel,NasabahRelatedLists}.tsx
      (duplicate-pihak pre-check; pihak sekolah sent when known; refetch after save).
- [x] routes nasabah (list, ?overdue=1 via exported Search + validateSearch + baseFilters,
      worklist tile filters kyc_review_overdue=1 server-side) + nasabah.$name (<300 lines).
- [x] nav "Anggota & Rekening"; guide id nasabah; onboarding step-1 create button.

## Wave D — ZIS
- [x] zis.tsx fix + dynamic jenis_dana filter options; PENERIMAAN_ZIS_FIELDS →
      link jenis_dana + program optional, drop status.
- [x] route zis-penyaluran + bespoke PenyaluranZisModal (program Aktif-only +
      saldo hint; asnaf reqd iff kategori Zakat; penerima DynamicLinkPicker optional).
- [x] route zis-program + PROGRAM_PENYALURAN_FIELDS (terkumpul/tersalurkan list-only).
- [x] masterConfigs + Jenis Dana ZIS (kategori exact: Zakat|Infaq Sedekah|Wakaf).
- [x] guides zis-penyaluran/zis-program; nav Baitul Maal (mode syariah).

## Wave E — Wallet
- [x] route wallet + wallet.$name (config + riwayat Top Up sorted by creation).
- [x] WalletFormModal (kartu emoney-only create-only; batas>0; auto_topup ⇒
      threshold+nominal(1k..10jt)+rekening_sumber reqd; never send saldo).
- [x] TopUpModal rewrite (kartu→wallet resolve; sumber explicit Tunai|Rekening;
      no-wallet CTA); nav Operasional; guide wallet.

## Wave F — verify
pnpm generate → tsc 0 → eslint 0 → vitest all → build; re-run contract audit script = 0.

## Wave G — docs (koperasi README cross-check), commits (id), PR web + PR BE.
