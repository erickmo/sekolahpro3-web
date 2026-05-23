export interface PartnerSchool {
  name: string;
  jenjang: string;
  city: string;
  province: string;
  students: number;
  since: string; // YYYY
  blurb?: string;
}

export interface PartnerOrg {
  name: string;
  role: string;        // e.g. "Mitra Pelatihan", "Mitra Pembayaran"
}

export interface CaseStudy {
  school: string;
  jenjang: string;
  challenge: string;
  outcome: string;
  metric: { value: string; label: string };
  quote: string;
  quote_author: string;
}

export const PARTNER_SCHOOLS: PartnerSchool[] = [
  { name: "SMA Cendekia Bangsa", jenjang: "SMA", city: "Bandung", province: "Jawa Barat", students: 1240, since: "2023" },
  { name: "SD Aletheia Malang", jenjang: "SD", city: "Malang", province: "Jawa Timur", students: 680, since: "2024" },
  { name: "SMP Tunas Harapan", jenjang: "SMP", city: "Semarang", province: "Jawa Tengah", students: 920, since: "2024" },
  { name: "SMA Insan Mulia", jenjang: "SMA", city: "Yogyakarta", province: "DI Yogyakarta", students: 1480, since: "2023" },
  { name: "SD Islam Al-Falah", jenjang: "SD", city: "Surabaya", province: "Jawa Timur", students: 540, since: "2025" },
  { name: "SMK Bina Karya", jenjang: "SMK", city: "Solo", province: "Jawa Tengah", students: 2100, since: "2024" },
  { name: "MTs Al-Hikmah", jenjang: "MTs", city: "Makassar", province: "Sulawesi Selatan", students: 720, since: "2025" },
  { name: "SMA Negeri 1 Denpasar", jenjang: "SMA", city: "Denpasar", province: "Bali", students: 1620, since: "2024" },
];

export const PARTNER_ORGS: PartnerOrg[] = [
  { name: "Bank Mandiri", role: "Mitra Pembayaran (VA + QRIS)" },
  { name: "Midtrans", role: "Payment Gateway" },
  { name: "Meta WhatsApp", role: "Penyedia API Resmi" },
  { name: "Dapodik Kemdikbud", role: "Sumber Data Induk" },
  { name: "Telkom IndiHome Sekolah", role: "Konektivitas" },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    school: "SMA Cendekia Bangsa, Bandung",
    jenjang: "SMA · 1.240 siswa",
    challenge:
      "Tata usaha menghabiskan 3 hari tiap awal bulan menutup buku — data SPP tersebar di Excel terpisah per kelas.",
    outcome:
      "Setelah migrasi, tutup buku selesai dalam 90 menit. Bendahara punya dashboard real-time, kepala sekolah tahu posisi kas tanpa harus bertanya.",
    metric: { value: "90 menit", label: "Waktu tutup buku bulanan" },
    quote:
      "Setelah belasan tahun mengandalkan kertas dan Excel, kami akhirnya bisa membaca sekolah ini seperti membaca neraca — dalam satu halaman, sebelum kopi habis.",
    quote_author: "Drs. Bambang Hartono, M.Pd. · Kepala Sekolah",
  },
  {
    school: "SD Aletheia Malang",
    jenjang: "SD · 680 siswa",
    challenge:
      "PPDB lewat antrean fisik membuat orangtua harus cuti kerja, dan panitia kewalahan mengelola berkas.",
    outcome:
      "PPDB 2025 dilakukan sepenuhnya online. Pendaftaran selesai 4 hari lebih cepat, dengan 0 berkas hilang.",
    metric: { value: "4 hari", label: "Lebih cepat dari tahun lalu" },
    quote:
      "Orangtua tidak perlu antre. Panitia tidak begadang. Anak-anak yang seharusnya jadi fokus, akhirnya jadi fokus lagi.",
    quote_author: "Ibu Lestari, S.Pd. · Ketua Panitia PPDB",
  },
];
