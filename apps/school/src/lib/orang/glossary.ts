// Indonesian one-line glossary for jargon shown across the Orang (Siswa &
// Staff) modules. Feeds GlossaryTooltip so new operators understand terms like
// NISN, Dapodik, Rombel, JJM, GTY without leaving the page.
//
// Pure data + a single lookup helper. UI strings are Bahasa Indonesia.

/** term -> one-line Indonesian explanation. */
export const ORANG_GLOSSARY: Record<string, string> = {
  NISN: "Nomor Induk Siswa Nasional, identitas unik siswa secara nasional dari Kemendikbud.",
  NIS: "Nomor Induk Siswa, nomor urut siswa yang berlaku di lingkup sekolah.",
  NIK: "Nomor Induk Kependudukan, 16 digit identitas pada KTP/Kartu Keluarga.",
  Dapodik:
    "Data Pokok Pendidikan, sistem pendataan nasional sekolah, siswa, dan guru milik Kemendikbud.",
  Rombel:
    "Rombongan Belajar, satu kelompok siswa yang belajar bersama dalam satu kelas pada tahun ajaran tertentu.",
  Mutasi: "Perpindahan siswa, baik masuk dari sekolah lain maupun keluar ke sekolah lain.",
  "Mutasi Masuk": "Proses penerimaan siswa pindahan yang berasal dari sekolah lain.",
  Kelulusan: "Penetapan siswa tingkat akhir yang dinyatakan lulus dan berhak memperoleh ijazah.",
  Ijazah: "Dokumen resmi tanda kelulusan siswa dari satuan pendidikan.",
  "Persetujuan Wali":
    "Konfirmasi orang tua/wali atas data atau perubahan data siswa sebelum disahkan.",
  JJM: "Jumlah Jam Mengajar, total jam tatap muka seorang guru dalam seminggu.",
  "SK Mengajar":
    "Surat Keputusan penugasan mengajar yang menetapkan mata pelajaran dan kelas seorang guru.",
  "SK Jabatan":
    "Surat Keputusan pengangkatan pada jabatan tertentu, mis. kepala sekolah atau wakil.",
  Sertifikasi:
    "Sertifikasi pendidik, pengakuan profesional guru yang berhak atas tunjangan profesi.",
  GTY: "Guru Tetap Yayasan, guru yang diangkat tetap oleh yayasan penyelenggara sekolah.",
  PPPK: "Pegawai Pemerintah dengan Perjanjian Kerja, ASN berbasis kontrak kerja.",
  PNS: "Pegawai Negeri Sipil, ASN berstatus pegawai tetap pemerintah.",
  Honorer: "Pegawai tidak tetap yang dibayar dari honor, belum berstatus ASN/GTY.",
};

/**
 * Look up the explanation for a glossary term.
 * @param term the exact term key (case-sensitive)
 * @returns the explanation string, or undefined when the term is unknown
 */
export function glossaryFor(term: string): string | undefined {
  return ORANG_GLOSSARY[term];
}
