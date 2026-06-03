# Shared Regulations — Regulasi Indonesia

Aturan regulasi yang dimiliki terpusat di sini dan dirujuk oleh banyak domain,
agar logika pajak/kepatuhan tidak terduplikasi antar-domain.

## Status saat ini

Domain yang sudah didokumentasikan (ads, perpustakaan, ekstrakurikuler, koperasi,
situs, aset, akademik) belum membawa logika regulasi terpusat. Perhitungan pajak
nyata berada di domain **akuntansi** (lihat rute `sch.$sekolah.akuntansi.pajak.*`:
e-Faktur, SPT PPN, withholding/PPh, TER) yang **belum** masuk cakupan restrukturisasi
dokumentasi ini. Berkas regulasi di bawah ditambahkan saat domain tersebut
didokumentasikan.

## Regulasi yang direncanakan (placeholder)

| Topik | Domain pengguna | Catatan |
|-------|-----------------|---------|
| PPN | akuntansi (SPT PPN, e-Faktur) | Tarif & aturan faktur pajak |
| PPh 21 / TER | akuntansi (withholding), staff (payroll) | Tarif Efektif Rata-rata |
| UU PDP | semua domain (data siswa/wali) | Perlindungan data pribadi; lihat juga GLOBAL-ADR-0001 (isolasi tenant) |
| PPATK | koperasi | Pelaporan transaksi — lihat `docs/domains/koperasi/` |

## Konvensi
- Satu berkas per regulasi: `{topik}.md` (mis. `ppn.md`, `pph21.md`, `uu-pdp.md`).
- Domain merujuk regulasi, tidak menyalin angkanya — sumber kebenaran tunggal di sini.
