# Shared Events — Skema Event Lintas-Domain

Skema payload kanonik untuk event yang dipancarkan satu domain dan didengarkan
domain lain, beserta versinya. Setiap domain mendaftarkan event-nya di bagian
**Cross-Domain Events** pada `docs/domains/{domain}/README.html`; berkas di sini
adalah kontrak payload bersama yang dirujuk kedua sisi.

## Status saat ini

Belum ada event lintas-domain terpublikasi. Domain-domain yang sudah
didokumentasikan (ads, perpustakaan, ekstrakurikuler, koperasi, situs, aset,
akademik) saat ini **self-contained** — koordinasi antar-doctype dilakukan via
Frappe `doc_events`/controller di dalam app yang sama, bukan event bus lintas-domain.

## Konvensi (saat event pertama ditambahkan)

- Nama event: `{domain}.{entitas}.{past_tense}` — mis. `koperasi.pembiayaan.disetujui`.
- Satu berkas skema per event: `{domain}.{entitas}.{aksi}.v{N}.md` berisi
  tabel field payload + tipe + contoh JSON.
- Versi payload eksplisit (`vN`); perubahan breaking → naikkan versi, jangan ubah di tempat.
- Field payload `snake_case` (konsisten dengan konvensi penamaan Vernon).

## Referensi
- `docs/domains/{domain}/README.html` → bagian "Cross-Domain Events"
- Vernon-dev `references/event-schema.md` (penamaan, struktur, versi)
