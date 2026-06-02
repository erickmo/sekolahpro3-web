// Offline demo dataset. When the backend is unreachable (dev without bench, or
// the morning demo), the situs SPA renders this believable sample school so the
// experience is fully explorable without a live API.

import { SECTION_KEYS } from "../constants";
import type {
  Agenda,
  Berita,
  Galeri,
  Halaman,
  PpdbInfo,
  Prestasi,
  SiteData,
} from "../types";

export const DEMO_SEKOLAH = "SMP Pelita Bangsa";

export const demoSite: SiteData = {
  sekolah: DEMO_SEKOLAH,
  nama: DEMO_SEKOLAH,
  templateKey: "klasik",
  brand: {
    color: "#0e7490",
    color2: "#f59e0b",
    logo: null,
    favicon: null,
    heroImage: null,
  },
  social: {
    instagram: "https://instagram.com/pelitabangsa",
    facebook: "https://facebook.com/pelitabangsa",
    youtube: "https://youtube.com/@pelitabangsa",
    whatsapp: "6281234567890",
  },
  profil: {
    tagline: "Berakhlak, Berprestasi, Berwawasan Global",
    heroJudul: "Selamat Datang di SMP Pelita Bangsa",
    heroSubjudul:
      "Membentuk generasi cerdas, berkarakter, dan siap menghadapi tantangan masa depan sejak tahun 1998.",
    heroCtaLabel: "Daftar PPDB 2026/2027",
    heroCtaUrl: "/ppdb",
    visi: "Menjadi sekolah unggul yang melahirkan lulusan berakhlak mulia, berprestasi, dan berwawasan global.",
    misi:
      "<ul><li>Menyelenggarakan pembelajaran aktif, kreatif, dan menyenangkan.</li><li>Menanamkan nilai akhlak dan budi pekerti dalam setiap kegiatan.</li><li>Mengembangkan potensi akademik dan non-akademik peserta didik.</li><li>Membangun budaya literasi dan teknologi.</li></ul>",
    sambutanKepsek:
      "<p>Assalamu'alaikum warahmatullahi wabarakatuh. Selamat datang di situs resmi SMP Pelita Bangsa. Kami berkomitmen memberikan pendidikan terbaik yang memadukan keunggulan akademik dengan pembentukan karakter. Terima kasih atas kepercayaan Bapak/Ibu kepada kami.</p>",
    namaKepsek: "Dra. Hj. Siti Rahmawati, M.Pd.",
    alamat: "Jl. Merdeka No. 45, Bandung, Jawa Barat 40115",
    petaEmbed: "",
  },
  contact: {
    telepon: "(022) 1234-5678",
    email: "info@pelitabangsa.sch.id",
    whatsapp: "6281234567890",
    alamat: "Jl. Merdeka No. 45, Bandung, Jawa Barat 40115",
  },
  meta: {
    metaTitle: "SMP Pelita Bangsa — Berakhlak, Berprestasi, Berwawasan Global",
    metaDescription:
      "Situs resmi SMP Pelita Bangsa Bandung. Informasi profil sekolah, berita, agenda, prestasi, dan pendaftaran peserta didik baru (PPDB) 2026/2027.",
    ogImage: null,
  },
  sections: [...SECTION_KEYS],
  nav: [
    { to: "/", label: "Beranda", section: "hero" },
    { to: "/profil", label: "Profil", section: "profil" },
    { to: "/berita", label: "Berita", section: "berita" },
    { to: "/agenda", label: "Agenda", section: "agenda" },
    { to: "/galeri", label: "Galeri", section: "galeri" },
    { to: "/prestasi", label: "Prestasi", section: "prestasi" },
    { to: "/ppdb", label: "PPDB", section: "ppdb" },
    { to: "/kontak", label: "Kontak", section: "kontak" },
  ],
  isDemo: true,
};

export const demoBerita: Berita[] = [
  {
    name: "BS-001",
    judul: "PPDB 2026/2027 Resmi Dibuka",
    slug: "ppdb-2026-2027-dibuka",
    kategori: "Pengumuman",
    ringkasan:
      "Pendaftaran Peserta Didik Baru tahun ajaran 2026/2027 telah dibuka. Daftar sekarang melalui jalur Reguler, Prestasi, dan Afirmasi.",
    konten:
      "<p>SMP Pelita Bangsa dengan bangga mengumumkan pembukaan Penerimaan Peserta Didik Baru (PPDB) tahun ajaran 2026/2027. Tersedia tiga jalur pendaftaran: Reguler, Prestasi, dan Afirmasi.</p><h3>Jadwal Penting</h3><ul><li>Pendaftaran: 1 Juni – 30 Juni 2026</li><li>Tes Seleksi: 5 Juli 2026</li><li>Pengumuman: 12 Juli 2026</li></ul><p>Segera daftarkan putra-putri Anda melalui menu PPDB di situs ini.</p>",
    gambarSampul: null,
    tanggalTerbit: "2026-06-01",
    penulis: "Panitia PPDB",
  },
  {
    name: "BS-002",
    judul: "Tim Robotik Raih Juara 1 Tingkat Provinsi",
    slug: "tim-robotik-juara-provinsi",
    kategori: "Prestasi",
    ringkasan:
      "Tim robotik SMP Pelita Bangsa berhasil meraih Juara 1 dalam Kompetisi Robotik Pelajar Tingkat Provinsi Jawa Barat 2026.",
    konten:
      "<p>Membanggakan! Tim robotik kami berhasil meraih Juara 1 dalam Kompetisi Robotik Pelajar Tingkat Provinsi Jawa Barat 2026 yang diselenggarakan di Bandung.</p><p>Prestasi ini merupakan hasil kerja keras siswa dan bimbingan guru pembina ekstrakurikuler robotik. Selamat kepada tim!</p>",
    gambarSampul: null,
    tanggalTerbit: "2026-05-20",
    penulis: "Humas Sekolah",
  },
  {
    name: "BS-003",
    judul: "Peringatan Hari Pendidikan Nasional 2026",
    slug: "hardiknas-2026",
    kategori: "Berita",
    ringkasan:
      "Upacara dan rangkaian kegiatan memperingati Hari Pendidikan Nasional berlangsung meriah dengan tema Merdeka Belajar.",
    konten:
      "<p>Seluruh warga SMP Pelita Bangsa memperingati Hari Pendidikan Nasional 2026 dengan upacara bendera dan berbagai lomba antar kelas. Tema tahun ini adalah 'Merdeka Belajar, Maju Bersama'.</p>",
    gambarSampul: null,
    tanggalTerbit: "2026-05-02",
    penulis: "Humas Sekolah",
  },
];

export const demoAgenda: Agenda[] = [
  {
    name: "AG-001",
    judul: "Tes Seleksi PPDB Gelombang 1",
    tanggalMulai: "2026-07-05T08:00:00",
    tanggalSelesai: "2026-07-05T12:00:00",
    lokasi: "Aula SMP Pelita Bangsa",
    deskripsi: "Tes seleksi akademik dan wawancara untuk calon peserta didik baru gelombang 1.",
  },
  {
    name: "AG-002",
    judul: "Class Meeting Akhir Semester",
    tanggalMulai: "2026-06-16T07:30:00",
    tanggalSelesai: "2026-06-20T15:00:00",
    lokasi: "Lapangan & Aula",
    deskripsi: "Pekan olahraga dan seni antar kelas menjelang libur semester genap.",
  },
];

export const demoGaleri: Galeri[] = [
  { name: "GL-001", judul: "Upacara Bendera", gambar: "", kategori: "Kegiatan" },
  { name: "GL-002", judul: "Laboratorium Komputer", gambar: "", kategori: "Fasilitas" },
  { name: "GL-003", judul: "Perpustakaan", gambar: "", kategori: "Fasilitas" },
  { name: "GL-004", judul: "Ekstrakurikuler Pramuka", gambar: "", kategori: "Kegiatan" },
  { name: "GL-005", judul: "Lapangan Olahraga", gambar: "", kategori: "Fasilitas" },
  { name: "GL-006", judul: "Pentas Seni", gambar: "", kategori: "Kegiatan" },
];

export const demoPrestasi: Prestasi[] = [
  {
    name: "PR-001",
    judul: "Juara 1 Kompetisi Robotik Pelajar",
    tingkat: "Provinsi",
    tahun: 2026,
    peraih: "Tim Robotik",
    deskripsi: "Kompetisi Robotik Pelajar Tingkat Provinsi Jawa Barat.",
    gambar: null,
  },
  {
    name: "PR-002",
    judul: "Juara 2 Olimpiade Matematika",
    tingkat: "Kabupaten",
    tahun: 2025,
    peraih: "Ahmad Fauzan (8A)",
    deskripsi: "Olimpiade Sains Nasional bidang Matematika tingkat kabupaten.",
    gambar: null,
  },
  {
    name: "PR-003",
    judul: "Juara 1 Lomba Tahfidz",
    tingkat: "Kota",
    tahun: 2025,
    peraih: "Khadijah Salsabila (9B)",
    deskripsi: "Musabaqah Hifzhil Qur'an tingkat kota.",
    gambar: null,
  },
];

export const demoHalaman: Record<string, Halaman> = {
  fasilitas: {
    name: "HL-FAS",
    slug: "fasilitas",
    judul: "Fasilitas Sekolah",
    ikon: "building",
    konten:
      "<p>SMP Pelita Bangsa didukung fasilitas lengkap untuk menunjang kegiatan belajar:</p><ul><li>Ruang kelas ber-AC dengan proyektor</li><li>Laboratorium komputer & IPA</li><li>Perpustakaan digital</li><li>Lapangan olahraga serbaguna</li><li>Masjid & kantin sehat</li><li>Ruang UKS dan konseling</li></ul>",
  },
};

export const demoPpdb: PpdbInfo = {
  dibuka: true,
  gelombang: [
    {
      name: "GEL-1",
      nama: "Gelombang 1",
      tingkat: "7",
      tanggalBuka: "2026-06-01",
      tanggalTutup: "2026-06-30",
      biayaPendaftaran: 150000,
      sisaKuota: 48,
    },
  ],
  jalur: ["Reguler", "Prestasi", "Afirmasi"],
  dokumen: ["Kartu Keluarga", "Akta Lahir", "Rapor", "Foto"],
  catatan: "Pendaftaran dilakukan secara daring. Panitia akan menghubungi via WhatsApp.",
};
