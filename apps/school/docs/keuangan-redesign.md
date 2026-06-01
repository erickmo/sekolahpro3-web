# Redesain Modul Keuangan & Akuntansi — Hub Terpadu

Status: in-progress · Branch: `feat/keuangan-accounting-redesign` · POV: staf operasional harian

## 1. Tujuan

Menyatukan dua menu lama (**Keuangan** operasional + **Akuntansi**) menjadi **satu hub "Keuangan"**
yang:

- **Mudah dipakai** staf harian (Bendahara, Kasir, Akuntan, Kepala Sekolah).
- **Mudah di-onboard** staf baru: tiap halaman punya panduan (`PageGuide`) bertingkat-peran.
- **Visualisasi maksimal**: dashboard penuh chart (tren kas, AR aging, budget vs actual,
  komposisi pengeluaran, ringkasan pajak).
- Menghilangkan duplikasi (Jurnal muncul di Keuangan lama *dan* Akuntansi).

Pola acuan: redesain Akademik (`useAkademikRole` + `PageGuide` + `viz/charts`).

## 2. Stakeholder & Peran Presentasi

Mirror `akademikRole.ts`. Peran = **petunjuk presentasi, bukan gerbang akses** (backend Frappe
yang menjaga akses; UI tak pernah menyembunyikan fitur, hanya menyorot).

| Peran presentasi | Frappe role match | Fokus harian |
|---|---|---|
| `bendahara` | bendahara, treasurer | Tagihan, arus kas, persetujuan pengeluaran |
| `kasir` | kasir, cashier, tata_usaha, operator | Terima pembayaran, buku kas harian |
| `akuntan` | akuntan, accounts, akunting | Jurnal, buku besar, pajak, anggaran |
| `kepala` | kepala_sekolah, kepala, principal | Pantau dashboard, setujui, audit |

Prioritas primary: `kepala` > `bendahara` > `akuntan` > `kasir`. Fallback permisif: tanpa sesi /
tak ada match → semua peran aktif (sama seperti Akademik).

`lib/keuanganRole.ts` mengekspor: `KeuanganRole`, `ROLE_LABEL`, `mapFrappeRolesToKeuangan()`,
`pickPrimaryRole()`, hook `useKeuanganRole()`.

## 3. Information Architecture — Satu Hub

Sidebar utama: **satu** entri "Keuangan" (`IconWallet`). Entri "Akuntansi" lama dihapus dari
sidebar; jadi sub-bagian di dalam hub.

Hub nav (komponen `KeuanganHubNav`, dipakai layout Keuangan **dan** Akuntansi agar terasa satu
modul) — grup:

```
Ringkasan
  └─ Dashboard            /keuangan                     (semua peran)
Operasional               (Bendahara, Kasir)
  ├─ Tagihan              /keuangan/tagihan
  ├─ Pembayaran           /keuangan/pembayaran
  ├─ Pengeluaran          /keuangan/pengeluaran
  └─ Buku Kas             /keuangan/kas
Akuntansi                 (Akuntan, Kepala)
  ├─ Buku Besar           /akuntansi/buku-besar         (akun, jurnal, pembayaran, GL)
  ├─ Anggaran             /akuntansi/anggaran
  ├─ Pajak                /akuntansi/pajak
  └─ Referensi            /akuntansi/referensi
```

**Keputusan IA:** URL Akuntansi (`/akuntansi/*`, 35 rute) **tidak dipindah** ke `/keuangan/akuntansi/*`.
Alasan: TanStack file-based routing → rename 35 file + 100+ referensi `to=` rapuh & memecah deep-link/test.
Penyatuan dilakukan di **shell + nav + sidebar** (satu entri, satu hub-nav lintas kedua route-tree,
cross-link). Hasil: terasa satu hub tanpa migrasi URL berisiko. "Jurnal" operasional lama dihapus →
diarahkan ke Akuntansi › Buku Besar › Jurnal (sumber tunggal).

## 4. Visualisasi (extend `viz/charts.tsx`, tetap pure-SVG, a11y `role=img`)

Reuse: DonutChart, ProgressRing, BarChart, HBarChart, DistributionBar, Sparkline.
Tambah (TDD):

- `LineChart` — tren multi-seri (kas masuk vs keluar 12 bulan).
- `StackedBarChart` — pemasukan/pengeluaran bertumpuk per bulan; AR aging buckets.
- `GaugeChart` — % serapan anggaran (budget vs actual).
- `WaterfallChart` — pergerakan saldo kas (saldo awal → masuk → keluar → akhir).

## 5. Layout halaman (pola seragam, semua modul)

`PageHeader` → `KeuanganRoleChips` (sorot peran) → `PageGuide` (langkah per-peran) →
`StatCard` KPI → seksi `SectionCard` berisi chart → `FilterBar`+`DataTable` → modal CRUD.

## 6. Backend (vernon_accounting) — doctype Keuangan baru

Pola: Frappe doctype standar (`vernon_accounting/accounting/doctype/`), controller
`class X(Document)` (validate/on_submit/on_cancel), GL via `utils.gl.make_gl_entries`,
naming series `*-.YYYY.-`, role `Accounts Manager`/`Accounts User`. TDD: stub-pytest (tanpa docker).

Doctype baru:
- **School Fee Invoice** (Tagihan) — siswa, kelas, judul, jatuh_tempo, jumlah, dibayar, status; submittable; on_submit → GL (Dr Piutang, Cr Pendapatan).
- **School Fee Payment** (Pembayaran) — atau reuse Payment Entry (party=Student) + referensi Tagihan.
- **School Expense** (Pengeluaran) — kategori, deskripsi, jumlah, penerima, metode, approver, status; on_submit → GL.
- **Cash Book Entry / saldo** (Buku Kas) — turunan dari GL (report), bukan input manual ganda.

Wiring frontend: `data/keuangan.ts` pindah dari mock → `useResourceList`/`useResourceCreate`
dengan fallback `VITE_USE_MOCKS`.

## 7. TDD & Verifikasi

- Frontend: vitest+RTL. Tiap lib/komponen baru → test gagal dulu → hijau. `pnpm typecheck` + `pnpm test` + `pnpm build` hijau. Dev smoke + `openwolf designqc`.
- Backend: stub-pytest hijau; migrate via `docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate` (verifikasi opsional).

## 8. Urutan kerja (foundation-first)

1. `keuanganRole.ts` (TDD) → 2. `keuanganHub.ts` IA (TDD) → 3. viz baru (TDD) →
4. `KeuanganHubNav` + `KeuanganRoleChips` + sidebar (TDD) → 5. Dashboard hub (viz berat) →
6. Operasional 4 halaman → 7. Akuntansi 35 halaman (fan-out per sub-modul) →
8. Backend doctype (TDD stub) + wiring → 9. Verifikasi penuh.
