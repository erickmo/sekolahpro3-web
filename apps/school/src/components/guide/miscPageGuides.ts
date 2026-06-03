/**
 * Per-page onboarding content for the school's miscellaneous singleton pages
 * (Beranda/Dashboard, Audit Log, Laporan Terjadwal, Pesan, Verifikasi
 * Penjemputan). These pages have no dedicated module, so the copy is centralized
 * here and rendered via the shared <PageGuide> component.
 *
 * Steps are role-tagged with the coarse school role keys to FRAME who each step
 * speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "./PageGuide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type MiscGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided miscellaneous singleton page. */
export type MiscGuideId =
  | "dashboard"
  | "audit"
  | "laporan"
  | "pesan"
  | "pickup-verify";

/** Full guide content for a single page. */
export interface MiscGuideContent {
  title: string;
  intro: string;
  steps: MiscGuideStep[];
  tips: string[];
}

export const MISC_PAGE_GUIDES: Record<MiscGuideId, MiscGuideContent> = {
  dashboard: {
    title: "Cara pakai Beranda",
    intro: "Ringkasan operasional harian: statistik sekolah, fokus per waktu, roll-up risiko, dan agenda.",
    steps: [
      { title: "Ikuti fokus per waktu", detail: "Kartu mode (pagi/siang/sore) menyarankan tugas paling penting saat ini.", roles: ["admin", "operator"] },
      { title: "Tindak Roll-up Risiko", detail: "Sinyal lintas modul (SK habis, tunggakan, rombel tanpa wali) dengan tombol aksi langsung.", roles: ["kepala_sekolah", "admin"] },
      { title: "Cek agenda & aktivitas", detail: "Lihat agenda hari ini dan aktivitas terbaru di panel samping.", roles: ["operator", "tata_usaha"] },
      { title: "Pakai Aksi Cepat", detail: "Pintasan tambah siswa, catat pembayaran, atau buat pengumuman.", roles: ["tata_usaha", "operator"] },
    ],
    tips: [
      "Tutup checklist onboarding setelah setup awal selesai.",
      "Klik item fokus untuk lompat langsung ke halaman terkait.",
    ],
  },
  audit: {
    title: "Cara pakai Audit Log",
    intro: "Lacak aktivitas pengguna, perubahan konfigurasi, dan kejadian sistem untuk keperluan audit.",
    steps: [
      { title: "Filter per severity & aksi", detail: "Saring kejadian berdasar tingkat (info/warning/error/critical) dan jenis aksi.", roles: ["admin", "kepala_sekolah"] },
      { title: "Cari event spesifik", detail: "Telusuri lewat user, doctype, docname, atau alamat IP.", roles: ["admin", "operator"] },
      { title: "Periksa kolom detail", detail: "Lihat waktu, user, doctype, dan IP untuk menelusuri jejak perubahan.", roles: ["admin"] },
    ],
    tips: [
      "Severity critical menandai kejadian yang perlu segera ditinjau.",
      "Aksi Override menandai tindakan yang melewati batasan normal.",
    ],
  },
  laporan: {
    title: "Cara pakai Laporan",
    intro: "Pustaka laporan terjadwal yang dijalankan otomatis sesuai periode dan format yang ditetapkan.",
    steps: [
      { title: "Jadwalkan laporan baru", detail: "Tombol Jadwalkan Laporan → pilih report, periode, dan format output.", roles: ["admin", "operator"] },
      { title: "Atur status aktif", detail: "Toggle Aktif/Nonaktif menentukan apakah jadwal akan dieksekusi.", roles: ["admin"] },
      { title: "Pantau eksekusi", detail: "Cek kolom Berikutnya dan Terakhir untuk memastikan jadwal berjalan.", roles: ["operator", "tata_usaha"] },
    ],
    tips: [
      "Filter periode/format untuk menemukan jadwal tertentu dengan cepat.",
      "Jadwal Nonaktif tetap tersimpan tapi tidak dijalankan.",
    ],
  },
  pesan: {
    title: "Cara pakai Pesan",
    intro: "Inbox dari formulir kontak publik plus kanal komunikasi untuk broadcast ke wali dan staff.",
    steps: [
      { title: "Pilih & baca pesan masuk", detail: "Klik pesan di daftar kiri untuk membuka percakapan di panel kanan.", roles: ["humas", "operator"] },
      { title: "Balas via inline reply", detail: "Tulis balasan di kotak bawah lalu Kirim; status pesan berubah jadi Dibalas.", roles: ["humas", "tata_usaha"] },
      { title: "Buat Pesan Baru", detail: "Tombol Pesan Baru untuk broadcast pengumuman ke wali atau staff.", roles: ["humas", "kepala_sekolah"] },
      { title: "Tandai selesai", detail: "Tutup percakapan yang sudah ditangani lewat Tandai Semua Selesai.", roles: ["humas", "operator"] },
    ],
    tips: [
      "Filter Baru/Dibalas/Selesai untuk fokus pada pesan yang butuh respon.",
      "Gunakan kotak cari untuk menemukan pesan dari nama atau email tertentu.",
    ],
  },
  "pickup-verify": {
    title: "Cara pakai Verifikasi Penjemputan",
    intro: "Verifikasi penjemput siswa di gerbang lewat scan QR atau PIN sebelum melepas siswa.",
    steps: [
      { title: "Pilih gerbang", detail: "Tetapkan lokasi gerbang petugas agar event tercatat di titik yang benar.", roles: ["operator", "tata_usaha"] },
      { title: "Scan QR penjemput", detail: "Arahkan kamera ke kode QR penjemput untuk memuat data event.", roles: ["operator"] },
      { title: "Gunakan fallback PIN", detail: "Bila QR gagal, masukkan NIS dan PIN penjemput secara manual.", roles: ["operator", "tata_usaha"] },
      { title: "Lepas atau tolak", detail: "Setelah data muncul, konfirmasi pelepasan siswa atau tolak dengan catatan.", roles: ["operator", "kesiswaan"] },
    ],
    tips: [
      "Status menunggu wali akan ter-update otomatis tanpa refresh.",
      "Selalu cocokkan wajah penjemput dengan data sebelum melepas siswa.",
    ],
  },
};
