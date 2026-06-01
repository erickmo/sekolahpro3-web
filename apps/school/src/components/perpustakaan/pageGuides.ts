/**
 * Per-page onboarding content for the Perpustakaan module, written from the
 * circulation desk's point of view. Centralized so the copy is consistent and
 * editable in one place; each page renders it via <PerpPageGuide id=... />.
 *
 * Steps are role-tagged (petugas / pustakawan / admin) to FRAME who each step
 * speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { PerpustakaanRole } from "../../lib/perpustakaanRole";

/**
 * Guide step whose role tags are constrained to the library role union, so a
 * typo like `petgas` fails to compile instead of silently rendering no badge.
 * Assignable to {@link PageGuideStep} since PerpustakaanRole[] ⊆ string[]. (PERP-GAP-24)
 */
export type PerpGuideStep = Omit<PageGuideStep, "roles"> & { roles?: PerpustakaanRole[] };

/** Identifier for each guided Perpustakaan page. */
export type PerpGuideId =
  | "terminal"
  | "peminjaman"
  | "daftar"
  | "kategori"
  | "reservasi"
  | "pengadaan"
  | "anggota"
  | "laporan"
  | "inventaris";

/** Full guide content for a single page. */
export interface PerpGuideContent {
  title: string;
  intro: string;
  steps: PerpGuideStep[];
  tips: string[];
}

export const PERP_PAGE_GUIDES: Record<PerpGuideId, PerpGuideContent> = {
  terminal: {
    title: "Cara pakai Terminal Sirkulasi",
    intro: "Mode kios cepat untuk meminjamkan & menerima buku lewat scan kartu dan eksemplar.",
    steps: [
      {
        title: "Scan kartu anggota",
        detail: "Tempelkan kartu RFID atau ketik nomor anggota untuk memulai transaksi.",
        roles: ["petugas"],
      },
      {
        title: "Scan eksemplar buku",
        detail: "Scan barcode/RFID tiap eksemplar. Sistem menentukan otomatis pinjam atau kembali.",
        roles: ["petugas"],
      },
      {
        title: "Konfirmasi & selesai",
        detail: "Periksa daftar, lalu konfirmasi. Denda keterlambatan dihitung otomatis saat pengembalian.",
        roles: ["petugas"],
      },
    ],
    tips: [
      "Tanpa alat RFID? Ketik manual nomor anggota & kode eksemplar.",
      "Satu sesi bisa memproses banyak buku sekaligus untuk satu anggota.",
    ],
  },
  peminjaman: {
    title: "Cara pakai Peminjaman & Sirkulasi",
    intro: "Satu tempat untuk pinjam baru, pengembalian, dan denda — diatur lewat filter status.",
    steps: [
      {
        title: "Pinjam baru",
        detail: "Klik 'Pinjam Baru' untuk peminjaman individu, atau buka 'Kolektif Kelas' untuk banyak siswa.",
        roles: ["petugas"],
      },
      {
        title: "Lihat pengembalian & denda",
        detail: "Gunakan filter Status (mis. Selesai) atau tautan dari dashboard untuk fokus ke pengembalian dan denda.",
        roles: ["petugas"],
      },
      {
        title: "Buka detail transaksi",
        detail: "Klik baris untuk memperpanjang, menerima pengembalian, atau menagih denda.",
        roles: ["petugas", "pustakawan"],
      },
    ],
    tips: [
      "Pengembalian & denda bukan menu terpisah — keduanya bagian dari hub ini.",
      "Kolom denda terisi otomatis dari keterlambatan.",
    ],
  },
  daftar: {
    title: "Cara pakai Katalog Buku",
    intro: "Cari, tambah, dan kelola koleksi. Klik judul untuk mengatur eksemplar & detailnya.",
    steps: [
      {
        title: "Cari koleksi",
        detail: "Ketik judul, ISBN, atau pengarang di kotak pencarian.",
        roles: ["petugas", "admin"],
      },
      {
        title: "Tambah buku",
        detail: "Klik 'Tambah Buku' untuk mencatat judul baru, lalu tambahkan eksemplar di halaman detail.",
        roles: ["admin"],
      },
      {
        title: "Buka detail",
        detail: "Klik baris untuk melihat eksemplar, kondisi, lokasi rak, dan riwayat sirkulasi.",
        roles: ["petugas", "admin"],
      },
    ],
    tips: [
      "Satu judul bisa punya banyak eksemplar dengan kode & lokasi berbeda.",
      "Gunakan ISBN agar pencarian & scan lebih akurat.",
    ],
  },
  kategori: {
    title: "Cara pakai Kategori",
    intro: "Kelola kategori koleksi agar katalog rapi dan mudah ditelusuri.",
    steps: [
      {
        title: "Tinjau kategori",
        detail: "Lihat daftar kategori yang dipakai pada koleksi.",
        roles: ["admin"],
      },
      {
        title: "Tambah / ubah kategori",
        detail: "Buat kategori baru atau sesuaikan yang ada sesuai kebutuhan klasifikasi.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Kategori dipakai pada filter katalog dan grafik 'Koleksi per Kategori' di dashboard.",
    ],
  },
  reservasi: {
    title: "Cara pakai Reservasi",
    intro: "Kelola antrian anggota yang menunggu buku yang sedang dipinjam.",
    steps: [
      {
        title: "Pantau antrian",
        detail: "Lihat reservasi aktif beserta posisi antrian per judul.",
        roles: ["petugas"],
      },
      {
        title: "Proses saat tersedia",
        detail: "Begitu eksemplar kembali, ubah reservasi menjadi peminjaman untuk anggota berikutnya.",
        roles: ["petugas"],
      },
    ],
    tips: [
      "Beri tahu anggota saat reservasinya siap diambil sebelum kedaluwarsa.",
    ],
  },
  pengadaan: {
    title: "Cara pakai Pengadaan",
    intro: "Catat koleksi baru dari pembelian, hibah, atau sumbangan, lalu masukkan eksemplarnya.",
    steps: [
      {
        title: "Buat pengadaan",
        detail: "Catat sumber (pembelian/hibah), pemasok, dan daftar judul yang masuk.",
        roles: ["admin", "pustakawan"],
      },
      {
        title: "Tambah eksemplar",
        detail: "Setiap judul yang masuk menambah eksemplar ke katalog dan stok inventaris.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Eksemplar baru bulan ini muncul di kartu dashboard 'Eksemplar Baru Bulan Ini'.",
    ],
  },
  anggota: {
    title: "Cara pakai Anggota",
    intro: "Kelola data anggota perpustakaan yang berhak meminjam.",
    steps: [
      {
        title: "Cari anggota",
        detail: "Temukan anggota berdasarkan nama atau nomor untuk verifikasi cepat di meja sirkulasi.",
        roles: ["petugas"],
      },
      {
        title: "Kelola data",
        detail: "Tambah anggota baru atau perbarui status keanggotaan.",
        roles: ["petugas", "admin"],
      },
    ],
    tips: [
      "Nomor anggota dipakai saat scan kartu di Terminal Sirkulasi.",
    ],
  },
  laporan: {
    title: "Cara pakai Laporan",
    intro: "Ringkasan sirkulasi, koleksi, dan denda untuk pengawasan dan evaluasi.",
    steps: [
      {
        title: "Tinjau ringkasan",
        detail: "Lihat indikator sirkulasi & denda untuk periode berjalan.",
        roles: ["pustakawan"],
      },
      {
        title: "Tindak lanjuti temuan",
        detail: "Gunakan angka keterlambatan & denda untuk menentukan kebijakan dan pengingat.",
        roles: ["pustakawan", "admin"],
      },
    ],
    tips: [
      "Untuk angka real-time harian gunakan Dashboard; Laporan untuk rekap.",
    ],
  },
  inventaris: {
    title: "Cara pakai Inventaris",
    intro: "Audit koleksi: Stock Opname terjadwal dan Berita Acara untuk kerusakan/kehilangan.",
    steps: [
      {
        title: "Stock Opname",
        detail: "Jalankan audit eksemplar via scan; sistem menandai selisih stok.",
        roles: ["admin", "pustakawan"],
      },
      {
        title: "Berita Acara Kerusakan",
        detail: "Catat insiden buku rusak/hilang per eksemplar untuk approval Kepala Perpustakaan.",
        roles: ["petugas", "pustakawan"],
      },
    ],
    tips: [
      "Draft opname yang belum disubmit & BA menunggu approval muncul di 'Perlu Perhatian' dashboard.",
    ],
  },
};
