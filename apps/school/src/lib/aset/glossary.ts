/**
 * Domain glossary for Manajemen Aset — plain-language definitions surfaced in
 * page guides and tooltips so non-technical staff understand the terms. Pure
 * data; no React.
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const ASET_GLOSSARY: readonly GlossaryTerm[] = [
  { term: "Aset", definition: "Barang inventaris sekolah yang dikelola jumlah, kondisi, dan lokasinya." },
  { term: "Jumlah Tersedia", definition: "Unit aset yang sedang bebas (tidak sedang dipinjam)." },
  { term: "Kategori", definition: "Pengelompokan aset, mis. Alat Olahraga, Elektronik, Furnitur." },
  { term: "Lokasi", definition: "Tempat penyimpanan aset (gudang/ruang). Bisa ditautkan ke ruangan fisik." },
  { term: "Peminjaman", definition: "Permintaan pinjam aset oleh guru/siswa/staff; perlu disetujui sebelum dipinjamkan." },
  { term: "Maintenance", definition: "Tiket perbaikan/servis aset. Saat dikerjakan, aset terkunci dari peminjaman." },
  { term: "Transfer", definition: "Pemindahan aset antar lokasi penyimpanan (mutasi gudang)." },
  { term: "Terlambat", definition: "Peminjaman yang melewati tanggal kembali rencana." },
];
