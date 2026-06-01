/**
 * Per-page onboarding content for the Manajemen Aset module, written from the
 * asset-desk point of view. Centralized so the copy is consistent and editable
 * in one place; each page renders it via the shared <PageGuide> component.
 *
 * Steps are role-tagged (petugas / manajer / admin) to FRAME who each step
 * speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { AsetRole } from "../../lib/aset/role";

/** Guide step constrained to the asset role union so role typos fail to compile. */
export type AsetGuideStep = Omit<PageGuideStep, "roles"> & { roles?: AsetRole[] };

/** Identifier for each guided Manajemen Aset page. */
export type AsetGuideId =
  | "dashboard"
  | "daftar"
  | "peminjaman"
  | "maintenance"
  | "transfer"
  | "kategori"
  | "lokasi"
  | "laporan";

/** Full guide content for a single page. */
export interface AsetGuideContent {
  title: string;
  intro: string;
  steps: AsetGuideStep[];
  tips: string[];
}

export const ASET_PAGE_GUIDES: Record<AsetGuideId, AsetGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Aset",
    intro: "Ringkasan kesehatan inventaris: total aset, unit dipinjam, kerusakan, dan maintenance.",
    steps: [
      { title: "Pantau kartu ringkasan", detail: "Lihat total unit, unit dipinjam, dan utilisasi sekejap.", roles: ["petugas", "manajer"] },
      { title: "Cek Perlu Perhatian", detail: "Peminjaman terlambat & aset rusak muncul di sini untuk ditindak.", roles: ["petugas"] },
      { title: "Setujui peminjaman tertunda", detail: "Permintaan Diajukan menunggu persetujuan manajer.", roles: ["manajer"] },
    ],
    tips: [
      "Klik kartu untuk lompat ke daftar terfilter.",
      "Angka dihitung dari data live, bukan cache.",
    ],
  },
  daftar: {
    title: "Cara pakai Daftar Aset",
    intro: "Registry seluruh aset: cari, filter per kategori/lokasi/status, lalu buka detail.",
    steps: [
      { title: "Tambah aset baru", detail: "Tombol Tambah → isi nama, kode, kategori, jumlah.", roles: ["petugas", "manajer"] },
      { title: "Filter & cari", detail: "Pakai filter kategori/lokasi/status untuk menyaring.", roles: ["petugas"] },
      { title: "Buka detail", detail: "Klik baris untuk melihat stok, riwayat, dan aksi.", roles: ["petugas"] },
    ],
    tips: ["Kode aset harus unik per sekolah.", "Jumlah Tersedia dikelola otomatis oleh transaksi."],
  },
  peminjaman: {
    title: "Cara pakai Peminjaman",
    intro: "Catat permintaan pinjam, setujui/tolak, lalu catat pengembalian.",
    steps: [
      { title: "Buat permintaan", detail: "Isi pemohon, keperluan, dan aset yang dipinjam.", roles: ["petugas"] },
      { title: "Setujui / tolak", detail: "Manajer menyetujui — stok aset otomatis terkunci.", roles: ["manajer"] },
      { title: "Catat kembali", detail: "Saat aset dikembalikan, stok otomatis dilepas.", roles: ["petugas"] },
    ],
    tips: ["Tanggal kembali default mengikuti Pengaturan modul.", "Aset Maintenance tidak bisa dipinjam."],
  },
  maintenance: {
    title: "Cara pakai Maintenance",
    intro: "Kelola tiket perbaikan: lapor → jadwalkan → kerjakan → selesai.",
    steps: [
      { title: "Laporkan kerusakan", detail: "Pilih aset, prioritas, dan deskripsi masalah.", roles: ["petugas"] },
      { title: "Jadwalkan & kerjakan", detail: "Saat dikerjakan, aset terkunci dari peminjaman.", roles: ["manajer"] },
      { title: "Selesaikan", detail: "Catat biaya & tindakan; aset kembali Tersedia.", roles: ["manajer"] },
    ],
    tips: ["Prioritas Kritis perlu tindak cepat.", "Selesai bisa sekaligus update kondisi aset."],
  },
  transfer: {
    title: "Cara pakai Transfer",
    intro: "Pindahkan aset antar lokasi penyimpanan (mutasi gudang).",
    steps: [
      { title: "Buat transfer", detail: "Pilih aset & lokasi tujuan; lokasi asal terisi otomatis.", roles: ["petugas"] },
      { title: "Selesaikan", detail: "Lokasi master aset berpindah ke tujuan saat diselesaikan.", roles: ["manajer"] },
    ],
    tips: ["Lokasi tujuan harus berbeda dari asal.", "Hanya transfer Draft yang bisa diselesaikan."],
  },
  kategori: {
    title: "Cara pakai Kategori",
    intro: "Master pengelompokan aset. Buat sebelum mendaftar aset.",
    steps: [{ title: "Tambah kategori", detail: "Mis. Alat Olahraga, Elektronik, Furnitur.", roles: ["manajer", "admin"] }],
    tips: ["Kode kategori unik per sekolah."],
  },
  lokasi: {
    title: "Cara pakai Lokasi",
    intro: "Master gudang/ruang penyimpanan. Bisa ditautkan ke ruangan fisik.",
    steps: [{ title: "Tambah lokasi", detail: "Pilih jenis (Gudang/Lab/dll) dan penanggung jawab.", roles: ["manajer", "admin"] }],
    tips: ["Tautkan ke Ruangan Infrastruktur bila relevan."],
  },
  laporan: {
    title: "Cara pakai Laporan",
    intro: "Rekap inventaris, peminjaman, dan maintenance untuk evaluasi.",
    steps: [{ title: "Baca ringkasan", detail: "Lihat distribusi kondisi & status aset.", roles: ["manajer", "admin"] }],
    tips: ["Export tersedia dari halaman daftar."],
  },
};
