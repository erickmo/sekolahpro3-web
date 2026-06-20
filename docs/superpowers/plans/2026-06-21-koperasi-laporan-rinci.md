# Plan — Koperasi Laporan Rinci

**Date:** 2026-06-21
**Branch:** `feat/koperasi-laporan-rinci`
**Task size:** L (new pure-aggregation lib + report components + route rewrite + tests)

## Problem

`kop.$sekolah.laporan.tsx` shows 4 summary StatCards then a dead placeholder:
> "Neraca syariah (PSAK 101-110), laporan SHU, mutasi kas teller, & rekonsiliasi akan tersedia pada Phase 3."

No detailed reports exist. Goal: make koperasi feature-complete by shipping real,
data-backed detail reports — FE-only, from existing verified doctypes.

## Verified data contracts (read from live routes, not guessed)

| Doctype | Fields used | Source route |
|---|---|---|
| Transaksi Simpanan | rekening_simpanan, jenis, jumlah, tanggal | transaksi.tsx |
| Sesi Kas Teller | teller, tanggal, shift, modal_kas, total_denominasi_tutup, selisih, status | kas-teller.tsx |
| Rekening Simpanan | name, saldo, status | laporan.tsx |
| Akad Pembiayaan | name, jumlah_pokok, status | laporan.tsx |
| Pembagian SHU | periode, shu_total, pct_cadangan | shu.tsx |
| Anggota Koperasi | name, status | laporan.tsx |

`jenis` ∈ {Setoran, Penarikan, Bagi Hasil, Bunga, Biaya Admin Dormant, Pelunasan Denda Perpus}.
`useResourceList(doctype,{filters:[["tanggal",">=",from],["tanggal","<=",to]],...})` bounds queries server-side (FilterTuple3 supported).

## Design (SOLID — pure core, thin shell)

### 1. `src/lib/koperasi/laporan.ts` — PURE aggregation (no React, no fetch)
Constants (no magic strings):
- `ARUS_MASUK = ["Setoran","Bagi Hasil","Bunga"]`
- `ARUS_KELUAR = ["Penarikan","Biaya Admin Dormant"]` (Pelunasan Denda Perpus = masuk)
- `STATUS_MACET = "Macet"`

Functions (each < 40 lines, doc-commented, cites this plan):
- `rekapMutasiSimpanan(rows): { perJenis:{jenis,count,total}[], totalMasuk, totalKeluar, net }`
- `rekapKasTeller(rows): { perTeller:{teller,sesi,modal,fisik,selisih}[], totalSelisih, sesiBermasalah }`
- `rekapKomposisiSimpanan(rows): { perStatus:{status,count,saldo}[], totalSaldo }`
- `rekapKualitasPembiayaan(rows): { perStatus:{status,count,pokok}[], totalPokok, npfRatio }`

### 2. `src/lib/koperasi/laporan.test.ts` — unit tests FIRST (TDD red→green)
Covers: empty input, classification masuk/keluar, net sign, per-teller grouping,
selisih flag, npf ratio (macet/total), status grouping, rounding.

### 3. `src/lib/koperasi/laporanCsv.ts` (+ test)
`toCsv(headers: string[], rows: (string|number)[][]): string` — quote-escape, join.
`unduhCsv(filename, csv)` reuses `saveBlob` from `lib/laporan/download.ts`.

### 4. `src/components/koperasi-laporan/RekapSection.tsx`
Generic presentational section: `{ title, columns, rows, rowKey, footer?, onUnduh? }`
→ `<SectionCard>` + `<DataTable>` + optional "Unduh CSV" Button. DI: data passed in,
no fetch inside. Keeps route thin and each report identical-shaped.

### 5. `src/routes/kop.$sekolah.laporan.tsx` — rewrite
- Keep 4 StatCards (existing).
- Add date-range filter (Dari/Sampai, default = 1st-of-month → today).
- Fetch Transaksi Simpanan + Sesi Kas Teller with date filters; Rekening + Akad as snapshot.
- Feed each useResourceList result → aggregation fn → `<RekapSection>`.
- Replace Phase-3 placeholder: Mutasi Simpanan, Mutasi Kas Teller, Komposisi Simpanan, Kualitas Pembiayaan sections + per-section CSV export.
- Neraca PSAK: honest note "bersumber dari modul Akuntansi (vernon_accounting)" — NOT faked.

## Out of scope (honest)
- Neraca PSAK 101-110 — needs GL backend (vernon_accounting), cross-repo. Noted, not faked.
- No new BE endpoints. No URL/route changes. No nav changes.

## Quality gates
tsc 0 · eslint 0 · vitest green (existing + new) · build ok. Self-review + 1 agent auditor (L).
