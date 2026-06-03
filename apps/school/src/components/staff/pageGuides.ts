/**
 * Per-page onboarding content for the Kepegawaian (Guru & Staff) module, written
 * from the personnel-desk point of view. Centralized so the copy stays consistent
 * and editable in one place; each page renders it via the shared <PageGuide>
 * component.
 *
 * Steps are role-tagged with the coarse SCHOOL_ROLE keys to FRAME who each step
 * speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type StaffGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided Kepegawaian page. */
export type StaffGuideId =
  | "dashboard"
  | "berkas"
  | "daftar"
  | "jabatan"
  | "mapel-pengampu"
  | "penugasan"
  | "sk-jabatan"
  | "sk-mengajar";

/** Full guide content for a single page. */
export interface StaffGuideContent {
  title: string;
  intro: string;
  steps: StaffGuideStep[];
  tips: string[];
}

export const STAFF_PAGE_GUIDES: Record<StaffGuideId, StaffGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Guru & Staff",
    intro: "Ringkasan tenaga pendidik & kependidikan: jumlah, komposisi peran, sertifikasi, dan antrian tindakan.",
    steps: [
      { title: "Baca kartu ringkasan", detail: "Lihat total pegawai, jumlah guru, staff, dual-role, dan yang aktif.", roles: ["admin", "kepala_sekolah"] },
      { title: "Cek visualisasi", detail: "Komposisi peran, status kepegawaian, cakupan sertifikasi, dan gender dalam grafik.", roles: ["operator", "tata_usaha"] },
      { title: "Tindak lanjuti antrian", detail: "Panel Perlu Tindakan menampilkan hal mendesak dari data pegawai nyata.", roles: ["operator", "tata_usaha"] },
      { title: "Pakai Aksi Cepat", detail: "Pintasan ke tambah pegawai, jabatan, penugasan, dan terbitkan SK.", roles: ["operator"] },
    ],
    tips: [
      "Klik kartu atau pintasan untuk lompat ke halaman terkait.",
      "Angka dihitung dari data pegawai live, bukan cache.",
    ],
  },
  daftar: {
    title: "Cara pakai Daftar Pegawai",
    intro: "Direktori guru & staff: cari, filter per role/status, lalu buka detail pegawai.",
    steps: [
      { title: "Tambah pegawai", detail: "Tombol Tambah Pegawai → isi nama, NIP, role, dan status kepegawaian.", roles: ["operator", "tata_usaha"] },
      { title: "Filter & cari", detail: "Saring per role (guru/staff/dual) atau status, cari nama atau NIP.", roles: ["operator"] },
      { title: "Buka detail", detail: "Klik baris pegawai untuk melihat profil, penugasan, dan berkas.", roles: ["tata_usaha"] },
    ],
    tips: ["NIP membantu pencarian cepat.", "Pegawai dual-role muncul sebagai guru sekaligus staff."],
  },
  berkas: {
    title: "Cara pakai Berkas Staff",
    intro: "Arsip dokumen kepegawaian: unggah berkas, pantau masa berlaku, dan perbarui yang kadaluarsa.",
    steps: [
      { title: "Unggah berkas", detail: "Tombol Unggah Berkas → pilih pegawai, jenis, nomor, dan masa berlaku.", roles: ["tata_usaha", "operator"] },
      { title: "Pantau status", detail: "Kolom Status menandai berkas Aktif atau Expired berdasarkan tanggal kadaluarsa.", roles: ["tata_usaha"] },
      { title: "Perbarui berkas", detail: "Tombol Aksi pada baris untuk memperpanjang berkas yang akan kadaluarsa.", roles: ["tata_usaha"] },
    ],
    tips: ["Cek status Expired secara berkala agar dokumen tetap valid.", "Cari per nama pegawai untuk menemukan semua berkasnya."],
  },
  jabatan: {
    title: "Cara pakai Jenis Jabatan",
    intro: "Master jenis jabatan staff. Buat dulu sebelum menerbitkan SK Jabatan.",
    steps: [
      { title: "Tambah jabatan", detail: "Tombol Tambah Jabatan → isi nama jabatan dan keterangan.", roles: ["admin", "tata_usaha"] },
      { title: "Atur status aktif", detail: "Jabatan non-aktif tetap tersimpan tapi tidak dipakai untuk SK baru.", roles: ["admin"] },
    ],
    tips: ["Nama jabatan sebaiknya konsisten, mis. Wakil Kepala, Bendahara, Kepala TU."],
  },
  "mapel-pengampu": {
    title: "Cara pakai Mapel Pengampu",
    intro: "Pemetaan guru ke mata pelajaran dan kelas per tahun ajaran, dasar penyusunan jadwal & penugasan.",
    steps: [
      { title: "Tetapkan pengampu", detail: "Tombol Tetapkan Pengampu → pilih guru, mapel, kelas, dan tahun ajaran.", roles: ["kurikulum", "operator"] },
      { title: "Telusuri pemetaan", detail: "Cari per nama guru atau mapel untuk melihat siapa mengampu apa.", roles: ["kurikulum"] },
    ],
    tips: ["Lengkapi pemetaan sebelum menyusun jadwal pelajaran.", "Satu guru bisa mengampu beberapa mapel/kelas."],
  },
  penugasan: {
    title: "Cara pakai Penugasan Guru",
    intro: "Susun beban mengajar (JJM) per guru per semester, lalu terbitkan SK Mengajar dari sini.",
    steps: [
      { title: "Buat penugasan", detail: "Tombol Buat Penugasan → pilih guru, tahun ajaran, dan semester.", roles: ["kurikulum", "operator"] },
      { title: "Periksa total JJM", detail: "Kolom Total JJM merangkum jam mengajar; cek kesesuaian beban guru.", roles: ["kurikulum"] },
      { title: "Terbitkan SK", detail: "Tombol SK Mengajar pada baris membuat SK dari penugasan aktif.", roles: ["tata_usaha", "kepala_sekolah"] },
    ],
    tips: ["Detail per-mapel diisi via halaman detail/desk.", "Hanya penugasan Aktif yang bisa diterbitkan SK-nya."],
  },
  "sk-jabatan": {
    title: "Cara pakai SK Jabatan Staff",
    intro: "Kelola surat keputusan jabatan staff: terbitkan, lacak status, hingga pencabutan.",
    steps: [
      { title: "Terbitkan SK", detail: "Tombol Terbitkan SK → pilih pegawai, jenis jabatan, nomor, dan tanggal SK.", roles: ["tata_usaha", "kepala_sekolah"] },
      { title: "Pantau status", detail: "Status berjalan dari Diajukan → Disetujui Kepsek → Diterbitkan.", roles: ["kepala_sekolah"] },
      { title: "Cari arsip", detail: "Cari per nama pegawai untuk melihat riwayat SK jabatannya.", roles: ["tata_usaha"] },
    ],
    tips: ["Nomor SK manual harus sesuai arsip resmi sekolah.", "SK Dicabut tetap tersimpan sebagai jejak audit."],
  },
  "sk-mengajar": {
    title: "Cara pakai SK Mengajar",
    intro: "Surat keputusan mengajar untuk guru: terbitkan satu per satu atau secara massal.",
    steps: [
      { title: "Terbitkan SK", detail: "Tombol Terbitkan SK → buat draft SK Mengajar untuk seorang guru.", roles: ["tata_usaha", "kepala_sekolah"] },
      { title: "Generate massal", detail: "Tombol bulk membuat SK sekaligus dari penugasan aktif.", roles: ["operator", "tata_usaha"] },
      { title: "Lacak status", detail: "Status menandai SK Diajukan, Diterbitkan, atau Dicabut.", roles: ["kepala_sekolah"] },
    ],
    tips: ["SK Mengajar bersumber dari Penugasan Guru yang aktif.", "Periksa tanggal mulai berlaku sebelum menerbitkan."],
  },
};
