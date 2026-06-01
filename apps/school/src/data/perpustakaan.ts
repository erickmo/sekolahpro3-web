// Mock data fixture untuk modul Perpustakaan.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

import { pickSchoolSlug, type MockSchoolSlug } from "./school-scope";

export type StatusBuku = "Tersedia" | "Dipinjam" | "Dipesan" | "Rusak" | "Hilang" | "Arsip";
export type Kategori =
  | "Fiksi"
  | "Non-Fiksi"
  | "Pelajaran"
  | "Referensi"
  | "Majalah"
  | "Komik"
  | "Biografi"
  | "Sejarah"
  | "Sains"
  | "Agama";
export type Bahasa = "Indonesia" | "Inggris" | "Arab" | "Jepang" | "Mandarin";

export interface PeminjamanRow {
  id: string;
  peminjam: string;
  nis?: string | undefined;
  tanggalPinjam: string;
  tanggalKembali: string;
  status: "Aktif" | "Dikembalikan" | "Terlambat" | "Hilang";
  denda?: number | undefined;
  petugas: string;
}

export interface ReviewRow {
  peresensi: string;
  rating: number;
  tanggal: string;
  isi: string;
}

export interface KopiRow {
  kodeKopi: string;
  kondisi: "Baik" | "Rusak Ringan" | "Rusak Berat" | "Hilang";
  lokasi: "Rak A" | "Rak B" | "Rak C" | "Rak D" | "Arsip";
  status: StatusBuku;
}

export interface StokTransaksiRow {
  tanggal: string;
  tipe: "Masuk" | "Keluar" | "Hilang" | "Rusak";
  jumlah: number;
  sumber?: "Pembelian" | "Hibah" | "Tukar" | "Pengembalian" | undefined;
  catatan?: string | undefined;
}

export interface AktivitasRow {
  waktu: string;
  aktor: string;
  aksi: string;
  tone: "neutral" | "brand" | "success" | "warning" | "danger";
}

export interface Buku {
  sekolah: MockSchoolSlug;
  isbn: string;
  kodeBuku: string;
  judul: string;
  penulis: string[];
  penerbit: string;
  tahunTerbit: number;
  edisi?: string | undefined;
  kategori: Kategori;
  bahasa: Bahasa;
  jumlahHalaman: number;
  deskripsi: string;
  jumlahKopi: number;
  kopiTersedia: number;
  kopiDipinjam: number;
  lokasi: string;
  hargaPerolehan?: number | undefined;
  ratingRata: number;
  jumlahReview: number;
  jumlahDipinjam: number;
  ditambahkan: string;
  coverUrl?: string | undefined;
  status: StatusBuku;
  // Relasi
  kopi: KopiRow[];
  peminjaman: PeminjamanRow[];
  review: ReviewRow[];
  stokTransaksi: StokTransaksiRow[];
  aktivitas: AktivitasRow[];
}

const judulList: { judul: string; penulis: string[]; kategori: Kategori; bahasa: Bahasa }[] = [
  { judul: "Laskar Pelangi", penulis: ["Andrea Hirata"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Bumi Manusia", penulis: ["Pramoedya Ananta Toer"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Sang Pemimpi", penulis: ["Andrea Hirata"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Edensor", penulis: ["Andrea Hirata"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Anak Semua Bangsa", penulis: ["Pramoedya Ananta Toer"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Negeri 5 Menara", penulis: ["Ahmad Fuadi"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Ayat-Ayat Cinta", penulis: ["Habiburrahman El Shirazy"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Perahu Kertas", penulis: ["Dee Lestari"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Supernova: Akar", penulis: ["Dee Lestari"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Filosofi Teras", penulis: ["Henry Manampiring"], kategori: "Non-Fiksi", bahasa: "Indonesia" },
  { judul: "Atomic Habits", penulis: ["James Clear"], kategori: "Non-Fiksi", bahasa: "Inggris" },
  { judul: "Sapiens: A Brief History of Humankind", penulis: ["Yuval Noah Harari"], kategori: "Sejarah", bahasa: "Inggris" },
  { judul: "Homo Deus", penulis: ["Yuval Noah Harari"], kategori: "Sejarah", bahasa: "Inggris" },
  { judul: "Thinking, Fast and Slow", penulis: ["Daniel Kahneman"], kategori: "Non-Fiksi", bahasa: "Inggris" },
  { judul: "The 7 Habits of Highly Effective People", penulis: ["Stephen R. Covey"], kategori: "Non-Fiksi", bahasa: "Inggris" },
  { judul: "Matematika untuk SMA Kelas X", penulis: ["B. K. Noormandiri"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Matematika untuk SMA Kelas XI", penulis: ["B. K. Noormandiri"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Matematika untuk SMA Kelas XII", penulis: ["B. K. Noormandiri"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Fisika SMA Kelas XI", penulis: ["Marthen Kanginan"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Fisika SMA Kelas XII", penulis: ["Marthen Kanginan"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Kimia SMA Kelas XI", penulis: ["Unggul Sudarmo"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Biologi SMA Kelas X", penulis: ["Irnaningtyas"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Bahasa Indonesia SMA Kelas X", penulis: ["Engkos Kosasih"], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Sejarah Indonesia SMA Kelas XI", penulis: ["Sardiman A.M."], kategori: "Pelajaran", bahasa: "Indonesia" },
  { judul: "Kamus Besar Bahasa Indonesia", penulis: ["Badan Bahasa"], kategori: "Referensi", bahasa: "Indonesia" },
  { judul: "Oxford Advanced Learner's Dictionary", penulis: ["A. S. Hornby"], kategori: "Referensi", bahasa: "Inggris" },
  { judul: "Ensiklopedia Sains untuk Pelajar", penulis: ["Tim Penyusun"], kategori: "Referensi", bahasa: "Indonesia" },
  { judul: "Atlas Dunia Lengkap", penulis: ["Tim Geografi"], kategori: "Referensi", bahasa: "Indonesia" },
  { judul: "Tetralogi Buru: Jejak Langkah", penulis: ["Pramoedya Ananta Toer"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Cantik Itu Luka", penulis: ["Eka Kurniawan"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Pulang", penulis: ["Tere Liye"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Hujan", penulis: ["Tere Liye"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Bumi", penulis: ["Tere Liye"], kategori: "Fiksi", bahasa: "Indonesia" },
  { judul: "Doraemon Petualangan", penulis: ["Fujiko F. Fujio"], kategori: "Komik", bahasa: "Jepang" },
  { judul: "Naruto Volume 1", penulis: ["Masashi Kishimoto"], kategori: "Komik", bahasa: "Jepang" },
  { judul: "Tan Malaka: Bapak Republik Yang Dilupakan", penulis: ["Anhar Gonggong"], kategori: "Biografi", bahasa: "Indonesia" },
  { judul: "Soekarno: Bung Karno Penyambung Lidah Rakyat", penulis: ["Cindy Adams"], kategori: "Biografi", bahasa: "Indonesia" },
  { judul: "Tafsir Al-Misbah Jilid 1", penulis: ["M. Quraish Shihab"], kategori: "Agama", bahasa: "Indonesia" },
  { judul: "A Brief History of Time", penulis: ["Stephen Hawking"], kategori: "Sains", bahasa: "Inggris" },
  { judul: "Majalah Bobo Edisi Khusus", penulis: ["Redaksi Bobo"], kategori: "Majalah", bahasa: "Indonesia" },
];

const penerbitList = [
  "Bentang Pustaka",
  "Hasta Mitra",
  "Gramedia Pustaka Utama",
  "Mizan",
  "Republika",
  "Erlangga",
  "Yudhistira",
  "Tiga Serangkai",
  "Pustaka Jaya",
  "Lentera Dipantara",
];

const lokasiList = ["Rak A", "Rak B", "Rak C", "Rak D"];
const statusList: StatusBuku[] = ["Tersedia","Tersedia","Tersedia","Dipinjam","Dipinjam","Dipesan","Rusak","Hilang","Arsip"];
const petugasList = ["Pustakawan Sari", "Pustakawan Joko", "Pustakawan Maya", "Pustakawan Andi"];
const peminjamList = [
  "Budi Santoso", "Rina Anggraini", "Dewi Lestari", "Ahmad Fauzi", "Siti Nurhaliza",
  "Andi Pratama", "Maya Sari", "Reza Maulana", "Nia Ramadhani", "Bagas Wicaksono",
];

/**
 * Deterministic pseudo-random in [0,1) from an integer seed (fractional part of
 * sin(seed)*10000). WHY deterministic (not Math.random): demo fixtures must be
 * stable across renders/reloads so the same book always shows the same numbers.
 */
function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(rand(seed) * arr.length)]!;
}
function pad(n: number, w: number) {
  return String(n).padStart(w, "0");
}

function buildBuku(idx: number): Buku {
  const meta = judulList[idx % judulList.length]!;
  const isbn = `978${pad(1000000000 + idx * 7919, 10)}`;
  const kodeBuku = `BUK-${pad(idx + 1, 6)}`;
  const penerbit = pick(penerbitList, idx + 3);
  const tahunTerbit = 2005 + (idx % 20);
  const jumlahHalaman = 120 + Math.floor(rand(idx + 5) * 380);
  const jumlahKopi = 2 + Math.floor(rand(idx + 7) * 8);
  const kopiDipinjam = Math.floor(rand(idx + 11) * (jumlahKopi - 1));
  const kopiTersedia = Math.max(0, jumlahKopi - kopiDipinjam);
  const lokasi = pick(lokasiList, idx + 13);
  const harga = 35000 + Math.floor(rand(idx + 17) * 165) * 1000;
  const ratingRata = Math.round((35 + rand(idx + 19) * 15) * 10) / 100; // 3.5 - 5.0
  const jumlahReview = Math.floor(rand(idx + 23) * 24);
  const jumlahDipinjam = Math.floor(rand(idx + 29) * 80) + 5;
  const status: StatusBuku =
    kopiTersedia === 0 && kopiDipinjam > 0 ? "Dipinjam" :
    pick(statusList, idx + 31);
  const tahunMasuk = 2022 + (idx % 4);
  const ditambahkan = `${tahunMasuk}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;

  const kopi: KopiRow[] = Array.from({ length: jumlahKopi }).map((_, i) => {
    const r = rand(idx + i + 41);
    const kondisi: KopiRow["kondisi"] =
      r < 0.75 ? "Baik" : r < 0.9 ? "Rusak Ringan" : r < 0.97 ? "Rusak Berat" : "Hilang";
    const st: StatusBuku =
      kondisi === "Hilang" ? "Hilang" :
      kondisi === "Rusak Berat" ? "Rusak" :
      i < kopiDipinjam ? "Dipinjam" : "Tersedia";
    return {
      kodeKopi: `${kodeBuku}-${pad(i + 1, 2)}`,
      kondisi,
      lokasi: (kondisi === "Hilang" ? "Arsip" : lokasi) as KopiRow["lokasi"],
      status: st,
    };
  });

  const peminjaman: PeminjamanRow[] = Array.from({ length: 8 }).map((_, i) => {
    const day = 24 - i * 2;
    const r = rand(idx + i + 53);
    const st: PeminjamanRow["status"] =
      i < kopiDipinjam ? (r < 0.85 ? "Aktif" : "Terlambat") :
      r < 0.92 ? "Dikembalikan" : r < 0.97 ? "Terlambat" : "Hilang";
    const denda = st === "Terlambat" ? Math.floor(rand(idx + i + 61) * 10) * 5000 + 5000 :
                  st === "Hilang" ? harga : undefined;
    const row: PeminjamanRow = {
      id: `PJM-${kodeBuku}-${pad(i + 1, 3)}`,
      peminjam: pick(peminjamList, idx + i + 7),
      tanggalPinjam: `2026-05-${pad(Math.max(1, day - 7), 2)}`,
      tanggalKembali: `2026-05-${pad(Math.max(2, day), 2)}`,
      status: st,
      petugas: pick(petugasList, idx + i + 11),
    };
    row.nis = `${2024}${pad((idx + i) * 13 + 1, 4)}`;
    if (denda !== undefined) row.denda = denda;
    return row;
  });

  const review: ReviewRow[] = Array.from({ length: Math.min(5, jumlahReview) }).map((_, i) => ({
    peresensi: pick(peminjamList, idx + i + 71),
    rating: 3 + Math.floor(rand(idx + i + 73) * 3),
    tanggal: `2026-0${(i % 4) + 1}-${pad((idx + i) % 27 + 1, 2)}`,
    isi: pick([
      "Buku yang sangat menarik dan menginspirasi.",
      "Penjelasan jelas, cocok untuk pelajar.",
      "Bahasa mudah dipahami, alur cerita menarik.",
      "Referensi yang sangat berguna untuk tugas sekolah.",
      "Cover dan ilustrasi bagus, isi padat informasi.",
    ], idx + i + 77),
  }));

  const stokTransaksi: StokTransaksiRow[] = [
    { tanggal: ditambahkan, tipe: "Masuk", jumlah: jumlahKopi, sumber: "Pembelian", catatan: `Pengadaan awal ${jumlahKopi} kopi` },
    { tanggal: `2026-02-${pad((idx % 27) + 1, 2)}`, tipe: "Masuk", jumlah: 1, sumber: "Hibah", catatan: "Donasi alumni" },
    { tanggal: `2026-03-${pad((idx % 27) + 1, 2)}`, tipe: "Keluar", jumlah: 1, sumber: "Pengembalian", catatan: "Kembali dari peminjam" },
    { tanggal: `2026-04-${pad((idx % 27) + 1, 2)}`, tipe: "Rusak", jumlah: 1, catatan: "Sampul rusak akibat kelembaban" },
  ];

  const aktivitas: AktivitasRow[] = [
    { waktu: "Hari ini, 09:24", aktor: pick(petugasList, idx), aksi: "Memperbarui lokasi rak", tone: "neutral" },
    { waktu: "Kemarin, 15:10", aktor: pick(peminjamList, idx + 2), aksi: "Meminjam buku", tone: "brand" },
    { waktu: "2 hari lalu", aktor: pick(peminjamList, idx + 4), aksi: "Mengembalikan buku", tone: "success" },
    { waktu: "4 hari lalu", aktor: "Sistem", aksi: "Mengirim notifikasi keterlambatan", tone: "warning" },
  ];

  return {
    sekolah: pickSchoolSlug(idx),
    isbn,
    kodeBuku,
    judul: meta.judul,
    penulis: meta.penulis,
    penerbit,
    tahunTerbit,
    edisi: `Edisi ${(idx % 4) + 1}`,
    kategori: meta.kategori,
    bahasa: meta.bahasa,
    jumlahHalaman,
    deskripsi:
      `${meta.judul} merupakan koleksi ${meta.kategori.toLowerCase()} berbahasa ${meta.bahasa} ` +
      `karya ${meta.penulis.join(", ")} yang diterbitkan oleh ${penerbit} pada tahun ${tahunTerbit}. ` +
      `Buku ini terdiri dari ${jumlahHalaman} halaman dan menjadi salah satu referensi populer di perpustakaan sekolah.`,
    jumlahKopi,
    kopiTersedia,
    kopiDipinjam,
    lokasi,
    hargaPerolehan: harga,
    ratingRata,
    jumlahReview,
    jumlahDipinjam,
    ditambahkan,
    status,
    kopi,
    peminjaman,
    review,
    stokTransaksi,
    aktivitas,
  };
}

export const BUKU_LIST: Buku[] = Array.from({ length: 40 }, (_, i) => buildBuku(i));

export function findBuku(isbn: string, sekolah?: MockSchoolSlug | string): Buku | undefined {
  const b = BUKU_LIST.find((row) => row.isbn === isbn);
  if (!b) return undefined;
  if (sekolah && b.sekolah !== sekolah) return undefined;
  return b;
}

export function listBukuForSekolah(sekolah: MockSchoolSlug | string): Buku[] {
  return BUKU_LIST.filter((b) => b.sekolah === sekolah);
}

export const FILTER_OPTIONS = {
  status: ["Semua","Tersedia","Dipinjam","Dipesan","Rusak","Hilang","Arsip"] as const,
  kategori: ["Semua","Fiksi","Non-Fiksi","Pelajaran","Referensi","Majalah","Komik","Biografi","Sejarah","Sains","Agama"] as const,
  bahasa: ["Semua","Indonesia","Inggris","Arab","Jepang","Mandarin"] as const,
  tahunTerbit: ["Semua","2024","2023","2022","2021","2020","2019","2018","2017","2016","2015"] as const,
  lokasi: ["Semua","Rak A","Rak B","Rak C","Rak D","Arsip"] as const,
};

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
