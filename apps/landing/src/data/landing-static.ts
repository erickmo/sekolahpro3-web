export interface ModuleItem {
  key: string;
  title: string;
  description: string;
}

export interface StatItem {
  label: string;
  value: string;
  unit?: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export const HERO = {
  eyebrow: "Edisi 2026 · Sistem Informasi Sekolah",
  line1: "Sekolah,",
  line2_text: "dengan",
  line2_italic: "tatanan",
  line3: "yang baru.",
  description:
    "Satu platform untuk akademik, keuangan, PPDB, koperasi siswa, dan komunikasi orangtua — dirancang khusus untuk ritme dan regulasi sekolah Indonesia.",
  cta_primary: { label: "Coba Gratis", url: "/kontak?utm=hero" },
  cta_secondary: { label: "Lihat Modul", url: "/fitur" },
};

export const MODULES: ModuleItem[] = [
  { key: "akademik", title: "Akademik", description: "Jadwal, presensi, nilai, dan rapor — terintegrasi Kurikulum Merdeka." },
  { key: "ppdb", title: "PPDB", description: "Penerimaan siswa baru online: formulir, seleksi, pembayaran, sampai daftar ulang." },
  { key: "keuangan", title: "Keuangan", description: "SPP, tagihan, kasir, dan laporan keuangan sekolah dalam satu alur." },
  { key: "koperasi", title: "Koperasi & Kantin", description: "Kartu e-money siswa, terminal kasir, dan laporan harian otomatis." },
  { key: "komunikasi", title: "Komunikasi", description: "Pengumuman, rapor, dan notifikasi langsung ke orangtua via aplikasi & WhatsApp." },
  { key: "data-induk", title: "Data Induk", description: "Siswa, guru, kelas, dan integrasi Dapodik dalam satu sumber kebenaran." },
];

export const STATS: StatItem[] = [
  { label: "Sekolah aktif", value: "120+" },
  { label: "Siswa terlayani", value: "85.000+" },
  { label: "Provinsi", value: "18" },
  { label: "Uptime layanan", value: "99,9", unit: "%" },
];

export const TESTIMONIAL = {
  quote:
    "Setelah belasan tahun mengandalkan kertas dan Excel, kami akhirnya bisa membaca sekolah ini seperti membaca neraca — dalam satu halaman, sebelum kopi habis.",
  author: "Drs. Bambang Hartono, M.Pd.",
  role: "Kepala Sekolah · SMA Cendekia Bangsa, Bandung",
};

export const PROCESS: ProcessStep[] = [
  { number: "01", title: "Demo & analisis", description: "30 menit demo daring sesuai jenjang dan jumlah siswa sekolah Anda." },
  { number: "02", title: "Migrasi data", description: "Kami impor data siswa, guru, dan riwayat dari sistem lama tanpa downtime." },
  { number: "03", title: "Pelatihan tim", description: "Sesi singkat untuk admin TU, guru, dan kepala sekolah — lengkap dengan video bantuan." },
  { number: "04", title: "Operasional", description: "Sekolah berjalan dengan satu sistem terintegrasi, dengan dukungan oncall." },
];

export const FINAL_CTA = {
  eyebrow: "— Mulai hari ini",
  title_main: "Sekolah",
  title_italic: "berikutnya.",
  body: "Jadwalkan demo 30 menit. Kami siapkan tinjauan langsung sesuai jenjang dan jumlah siswa sekolah Anda.",
  primary: { label: "Jadwalkan Demo", url: "/kontak?utm=cta" },
  secondary: { label: "Pelajari Fitur", url: "/fitur" },
};
