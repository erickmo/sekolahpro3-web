# Modul Manajemen Aset (Frontend)

Antarmuka web untuk domain **Manajemen Aset** backend (`sekolahpro/manajemen_aset`).
Inventaris aset sekolah: registry, kategori, lokasi/gudang, peminjaman, maintenance, transfer.

## Rute (`/sch/$sekolah/aset/*`)

| Rute | File | Fungsi |
|------|------|--------|
| `/aset` | `sch.$sekolah.aset.tsx` | Layout: context bar peran + tab subnav |
| `/aset` (index) | `sch.$sekolah.aset.index.tsx` | Dashboard: stat, perlu-perhatian, alur, aset terbaru |
| `/aset/daftar` | `…aset.daftar.index.tsx` | Daftar aset + modal tambah + export CSV |
| `/aset/daftar/$name` | `…aset.daftar.$name.tsx` | Detail aset + lapor maintenance |
| `/aset/peminjaman` | `…aset.peminjaman.index.tsx` | Daftar peminjaman + modal ajukan |
| `/aset/peminjaman/$name` | `…aset.peminjaman.$name.tsx` | Detail + setujui/tolak/kembalikan |
| `/aset/maintenance` | `…aset.maintenance.index.tsx` | Daftar tiket + modal lapor |
| `/aset/maintenance/$name` | `…aset.maintenance.$name.tsx` | Detail + jadwalkan/mulai/selesai/batal |
| `/aset/transfer` | `…aset.transfer.index.tsx` | Daftar transfer + modal buat |
| `/aset/transfer/$name` | `…aset.transfer.$name.tsx` | Detail + selesaikan |
| `/aset/kategori` | `…aset.kategori.tsx` | Master kategori |
| `/aset/lokasi` | `…aset.lokasi.tsx` | Master lokasi/gudang |
| `/aset/laporan` | `…aset.laporan.tsx` | Distribusi kondisi & status |

> Pola list+detail memakai `*.index.tsx` (list) + `*.$name.tsx` (detail) sebagai
> sibling di bawah layout `aset.tsx` (yang punya `<Outlet/>`) — sama seperti
> Infrastruktur `daftar-gedung`. Hindari `*.tsx`+`*.$name.tsx` agar tidak ada
> ambiguitas nesting tanpa Outlet.

## Lib (`src/lib/aset/`)

- `role.ts` — derivasi peran (`petugas/manajer/admin`) via `deriveRoles`; hook `useAsetRole()`.
- `stats.ts` — agregasi murni (testable): `computeAsetStats`, `countByStatus`, `overduePeminjaman`.
- `badges.ts` — pemetaan status/kondisi → tone Badge + formatter (Rupiah, stok).
- `nav.ts` — definisi tab + `isTabActive` (murni).
- `api.ts` — hook mutasi ke endpoint whitelisted (`useFrappeMutation`), pola seperti `ppdbApi`.
- `glossary.ts` — istilah domain untuk page guide.

## Komponen (`src/components/aset/`)

- Form modal: `AsetFormModal`, `KategoriFormModal`, `LokasiFormModal`, `PeminjamanFormModal`,
  `MaintenanceFormModal`, `TransferFormModal`.
- `AsetContextBar` — banner framing peran.
- `FormSection` / `FormError` — wrapper form bersama.
- `useDoctypeOptions` — loader opsi link master untuk SearchableSelect.
- `pageGuides.ts` — konten panduan per halaman (PageGuide).

## Aksi server

Aksi lifecycle (setujui, kembalikan, mulai maintenance, selesaikan transfer, dst.)
TIDAK melakukan patch field langsung — memanggil endpoint `@frappe.whitelist()` backend
yang menjalankan logika reserve/release stok & penguncian aset. Setelah sukses, query
`resource:doc` / `resource:list` di-invalidate agar tampilan segar.

## Navigasi

Entri sidebar "Manajemen Aset" (`IconLayers`) di section "Infrastruktur & Master"
(`src/routes/__root.tsx`). `ROLE_MENU_MAP` memberi akses ke `manajer_aset`, `petugas_aset`,
`kepala_sekolah`, `operator`, dan `admin_sekolah` (wildcard).

## Verifikasi

`pnpm typecheck` · `pnpm test` (vitest, 24 test untuk lib aset) · `pnpm build`.
