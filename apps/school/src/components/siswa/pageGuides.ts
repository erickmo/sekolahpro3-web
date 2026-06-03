/**
 * Per-page onboarding content for the Siswa (student-directory) module, written
 * from the kesiswaan / tata-usaha staff point of view. Centralized so the copy
 * stays consistent and editable in one place; each route renders it via the
 * shared <PageGuide> component.
 *
 * Steps are role-tagged with coarse SchoolGuideRole keys to FRAME who each step
 * speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type SiswaGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided Siswa page. */
export type SiswaGuideId =
  | "dashboard"
  | "daftar"
  | "ijazah"
  | "rombel"
  | "wali"
  | "siswa-baru"
  | "kelulusan"
  | "kelulusan-baru"
  | "mutasi"
  | "mutasi-baru"
  | "mutasi-masuk"
  | "mutasi-masuk-baru"
  | "pendaftaran"
  | "pendaftaran-baru"
  | "persetujuan"
  | "persetujuan-baru"
  | "perubahan-data"
  | "perubahan-data-baru";

/** Full guide content for a single page. */
export interface SiswaGuideContent {
  title: string;
  intro: string;
  steps: SiswaGuideStep[];
  tips: string[];
}

export const SISWA_PAGE_GUIDES: Record<SiswaGuideId, SiswaGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Siswa",
    intro: "Pantau kondisi kesiswaan: jumlah murid, status keaktifan, sebaran gender/jenjang, dan antrian aksi.",
    steps: [
      { title: "Baca kartu KPI", detail: "Total, aktif, calon, dan mutasi keluar dihitung dari data nyata.", roles: ["kesiswaan", "kepala_sekolah"] },
      { title: "Cek Perlu Tindakan", detail: "Antrian aksi seperti calon menunggu aktivasi dan mutasi belum final.", roles: ["kesiswaan", "tata_usaha"] },
      { title: "Pakai Aksi Cepat", detail: "Pintasan ke pendaftaran, mutasi, kelulusan, dan rombel.", roles: ["operator", "tata_usaha"] },
    ],
    tips: [
      "Angka dihitung live, bukan cache.",
      "Mulai dari rombel bila datanya masih kosong.",
    ],
  },
  daftar: {
    title: "Cara pakai Daftar Siswa",
    intro: "Direktori seluruh siswa: cari, filter, ekspor CSV, lalu buka profil.",
    steps: [
      { title: "Cari & filter", detail: "Saring per status, jenjang, JK, tahun masuk, atau agama.", roles: ["operator", "tata_usaha"] },
      { title: "Tambah siswa", detail: "Tombol Tambah Siswa membuka form data baru.", roles: ["operator", "tata_usaha"] },
      { title: "Ekspor data", detail: "Unduh CSV siswa terfilter untuk laporan atau Dapodik.", roles: ["operator", "kesiswaan"] },
      { title: "Buka profil", detail: "Klik baris untuk melihat detail dan tab Wali.", roles: ["tata_usaha", "guru"] },
    ],
    tips: ["Filter default ke status Aktif; pilih Semua untuk semua siswa.", "Import massal tersedia lewat tombol di toolbar."],
  },
  ijazah: {
    title: "Cara pakai Arsip Ijazah",
    intro: "Arsip ijazah terbit dengan retensi 25 tahun; setiap unduhan tercatat di audit log.",
    steps: [
      { title: "Cari arsip", detail: "Filter per tahun ajaran atau status distribusi.", roles: ["tata_usaha", "operator"] },
      { title: "Pantau retensi", detail: "Badge retensi menunjukkan sisa masa simpan arsip.", roles: ["tata_usaha"] },
      { title: "Unduh dengan alasan", detail: "Tombol Unduh wajib pilih alasan akses; bulk download dilarang.", roles: ["tata_usaha", "kepala_sekolah"] },
    ],
    tips: ["Sumber penerbitan ijazah ada di halaman Kelulusan.", "Setiap unduh tercatat sesuai UU PDP & Permendikbud."],
  },
  rombel: {
    title: "Cara pakai Anggota Rombel",
    intro: "Daftar keanggotaan siswa pada rombongan belajar beserta nomor absen.",
    steps: [
      { title: "Lihat anggota", detail: "Tampil siswa, rombel, tahun ajaran, dan nomor absen.", roles: ["wali_kelas", "kurikulum"] },
      { title: "Tambah anggota", detail: "Tombol Tambah Anggota membuka form penempatan rombel.", roles: ["operator", "kurikulum"] },
      { title: "Cari cepat", detail: "Telusuri per nama siswa atau ID anggota.", roles: ["wali_kelas"] },
    ],
    tips: ["Susun rombel sebelum menempatkan siswa.", "Satu siswa hanya satu rombel aktif per tahun ajaran."],
  },
  wali: {
    title: "Cara pakai Direktori Wali",
    intro: "Direktori read-only data wali siswa; edit dilakukan di detail siswa tab Wali.",
    steps: [
      { title: "Cari wali", detail: "Telusuri per nama wali atau nomor telepon.", roles: ["tata_usaha", "humas"] },
      { title: "Filter hubungan", detail: "Saring per hubungan (Ayah/Ibu/Wali) atau wali utama.", roles: ["tata_usaha"] },
      { title: "Lompat ke siswa", detail: "Klik kolom Siswa untuk membuka profil anaknya.", roles: ["tata_usaha", "guru"] },
    ],
    tips: ["Wali adalah child table Siswa — ubah dari detail siswa.", "Wali Utama adalah kontak prioritas sekolah."],
  },
  "siswa-baru": {
    title: "Cara pakai Tambah Siswa Baru",
    intro: "Form pendataan siswa: identitas, administrasi, dapodik, alamat, dan kontak.",
    steps: [
      { title: "Isi identitas", detail: "Lengkapi nama, NIS/NISN, dan data pribadi siswa.", roles: ["operator", "tata_usaha"] },
      { title: "Lengkapi dapodik & alamat", detail: "Isi data administrasi, dapodik, alamat, dan kontak.", roles: ["operator"] },
      { title: "Simpan", detail: "Simpan untuk menambah siswa ke direktori.", roles: ["operator", "tata_usaha"] },
    ],
    tips: ["NIS dan NISN harus unik.", "Batal mengembalikan ke daftar tanpa menyimpan."],
  },
  kelulusan: {
    title: "Cara pakai Kelulusan Siswa",
    intro: "Daftar pengesahan kelulusan dengan alur approval Ka-TU dan Kepsek.",
    steps: [
      { title: "Pantau status", detail: "Lihat hasil (Lulus/Tidak) dan status workflow tiap record.", roles: ["tata_usaha", "kepala_sekolah"] },
      { title: "Filter", detail: "Saring per hasil kelulusan atau status persetujuan.", roles: ["tata_usaha"] },
      { title: "Proses kelulusan", detail: "Tombol Proses Kelulusan membuka form pengesahan baru.", roles: ["tata_usaha"] },
    ],
    tips: ["Approved otomatis membuat Arsip Ijazah (retensi 25 tahun).", "Klik ID untuk membuka detail approval."],
  },
  "kelulusan-baru": {
    title: "Cara pakai Proses Kelulusan Baru",
    intro: "Catat pengesahan kelulusan siswa beserta data ijazah dan tracer alumni.",
    steps: [
      { title: "Pilih siswa & status", detail: "Tentukan siswa, tahun ajaran, dan hasil Lulus/Tidak Lulus.", roles: ["tata_usaha"] },
      { title: "Isi ijazah", detail: "Untuk Lulus, isi No. Ijazah/SKHUN dan tanggal pengesahan.", roles: ["tata_usaha"] },
      { title: "Lengkapi alumni", detail: "Opsional: catat rencana melanjutkan untuk tracer study.", roles: ["tata_usaha", "bk"] },
      { title: "Simpan draft", detail: "Disimpan sebagai Draft menunggu approval Ka-TU & Kepsek.", roles: ["tata_usaha"] },
    ],
    tips: ["No. Ijazah & tanggal wajib untuk siswa Lulus.", "Dual-control: perlu approval Ka-TU dan Kepsek."],
  },
  mutasi: {
    title: "Cara pakai Mutasi Siswa",
    intro: "Daftar mutasi internal: naik kelas, tinggal kelas, pindah keluar, dan drop out.",
    steps: [
      { title: "Pantau mutasi", detail: "Lihat jenis mutasi, tanggal efektif, dan status workflow.", roles: ["tata_usaha", "kesiswaan"] },
      { title: "Filter", detail: "Saring per jenis mutasi atau status persetujuan.", roles: ["tata_usaha"] },
      { title: "Ajukan mutasi", detail: "Tombol Ajukan Mutasi membuka form pengajuan baru.", roles: ["tata_usaha", "kesiswaan"] },
    ],
    tips: ["Pindah Keluar & DO perlu approval Ka-TU dan Kepsek.", "Klik ID untuk membuka detail mutasi."],
  },
  "mutasi-baru": {
    title: "Cara pakai Ajukan Mutasi Baru",
    intro: "Catat mutasi siswa; field detail menyesuaikan jenis mutasi yang dipilih.",
    steps: [
      { title: "Pilih siswa & jenis", detail: "Tentukan siswa, tanggal efektif, dan jenis mutasi.", roles: ["tata_usaha", "kesiswaan"] },
      { title: "Isi detail", detail: "Naik Kelas butuh rombel tujuan; Pindah Keluar butuh sekolah tujuan.", roles: ["tata_usaha"] },
      { title: "Tulis alasan", detail: "Tinggal Kelas/Pindah/DO wajib alasan minimal 20 karakter.", roles: ["tata_usaha", "bk"] },
      { title: "Simpan draft", detail: "Disimpan sebagai Draft untuk diproses approval.", roles: ["tata_usaha"] },
    ],
    tips: ["DO & Pindah Keluar adalah dual-control.", "Field detail muncul sesuai jenis mutasi."],
  },
  "mutasi-masuk": {
    title: "Cara pakai Mutasi Masuk",
    intro: "Daftar siswa pindahan masuk dari sekolah lain yang diverifikasi Dapodik.",
    steps: [
      { title: "Pantau pindahan", detail: "Lihat nama, NISN, sekolah asal, dan status verifikasi.", roles: ["tata_usaha", "operator"] },
      { title: "Filter status", detail: "Saring per status: Diajukan, Diverifikasi, Diterima, Ditolak.", roles: ["tata_usaha"] },
      { title: "Terima pindahan", detail: "Tombol Terima Pindahan membuka alur verifikasi Dapodik.", roles: ["tata_usaha", "operator"] },
    ],
    tips: ["Input manual dilarang — wajib lewat verifikasi Dapodik.", "Klik baris untuk melihat detail pindahan."],
  },
  "mutasi-masuk-baru": {
    title: "Cara pakai Terima Siswa Pindahan",
    intro: "Alur 3 langkah menerima siswa pindahan dengan verifikasi Dapodik wajib.",
    steps: [
      { title: "Verifikasi Dapodik", detail: "Masukkan NPSN (8 digit) + NISN (10 digit), lalu Cek Dapodik.", roles: ["operator", "tata_usaha"] },
      { title: "Lengkapi data tambahan", detail: "Isi tanggal masuk, rombel tujuan, dan alasan pindah.", roles: ["tata_usaha"] },
      { title: "Konfirmasi & submit", detail: "Tinjau ringkasan lalu submit untuk terbitkan NIS baru.", roles: ["tata_usaha", "operator"] },
    ],
    tips: ["Tidak ada jalur manual — wajib verifikasi via API Dapodik.", "Pilih rombel tujuan yang masih punya kapasitas."],
  },
  pendaftaran: {
    title: "Cara pakai Pendaftaran Siswa",
    intro: "Daftar pendaftaran calon siswa: reguler, mutasi, beasiswa, atau khusus.",
    steps: [
      { title: "Pantau pendaftar", detail: "Lihat nama, NISN, jenis, dan status pendaftaran.", roles: ["operator", "humas"] },
      { title: "Filter", detail: "Saring per jenis pendaftaran atau status proses.", roles: ["operator"] },
      { title: "Daftar siswa baru", detail: "Tombol Daftar Siswa Baru membuka form pendaftaran.", roles: ["operator", "humas"] },
    ],
    tips: ["Status berjalan Draft → Submitted → Diterima/Ditolak.", "Klik ID untuk membuka detail pendaftaran."],
  },
  "pendaftaran-baru": {
    title: "Cara pakai Daftar Siswa Baru",
    intro: "Form pendaftaran calon siswa: identitas, jenis pendaftaran, rombel target, dan kontak wali.",
    steps: [
      { title: "Isi identitas calon", detail: "Lengkapi nama, JK, tanggal lahir, NISN/NIK calon siswa.", roles: ["operator", "humas"] },
      { title: "Pilih jenis & rombel", detail: "Tentukan jenis pendaftaran, tanggal daftar, dan rombel target.", roles: ["operator"] },
      { title: "Isi kontak wali", detail: "Lengkapi telepon dan email wali untuk verifikasi.", roles: ["humas", "operator"] },
      { title: "Simpan draft", detail: "Disimpan sebagai Draft; siswa & rombel dibuat saat diterima.", roles: ["operator"] },
    ],
    tips: ["Pindahan dari sekolah lain pakai alur Mutasi Masuk (verifikasi Dapodik).", "NISN 10 digit & NIK 16 digit divalidasi otomatis."],
  },
  persetujuan: {
    title: "Cara pakai Persetujuan Wali",
    intro: "Catatan consent wali per tujuan pemrosesan data sesuai UU PDP.",
    steps: [
      { title: "Pantau consent", detail: "Lihat siswa, tujuan, status, dan cara persetujuan diberikan.", roles: ["tata_usaha", "humas"] },
      { title: "Filter", detail: "Saring per tujuan atau status (Granted/Pending/Withdrawn/Expired).", roles: ["tata_usaha"] },
      { title: "Minta persetujuan", detail: "Tombol Minta Persetujuan membuka form consent baru.", roles: ["tata_usaha", "humas"] },
    ],
    tips: ["Satu record = satu tujuan (consent granular).", "Default consent OFF sampai wali memberi izin eksplisit."],
  },
  "persetujuan-baru": {
    title: "Cara pakai Catat Persetujuan Wali",
    intro: "Rekam persetujuan eksplisit wali untuk satu tujuan pemrosesan data.",
    steps: [
      { title: "Pilih pihak", detail: "Tentukan siswa dan wali pemberi consent.", roles: ["tata_usaha", "humas"] },
      { title: "Pilih satu tujuan", detail: "Setiap record hanya untuk satu purpose pemrosesan data.", roles: ["tata_usaha"] },
      { title: "Catat bukti", detail: "Isi cara persetujuan, tanggal, dan masa berlaku.", roles: ["tata_usaha"] },
      { title: "Simpan", detail: "Simpan hanya untuk persetujuan yang sudah dikonfirmasi wali.", roles: ["tata_usaha", "humas"] },
    ],
    tips: ["Jangan catat 'Setuju Semua' — consent wajib granular.", "Kosongkan masa berlaku bila tanpa expiry."],
  },
  "perubahan-data": {
    title: "Cara pakai Perubahan Data Siswa",
    intro: "Daftar permintaan ubah data kritis siswa via workflow dual-control.",
    steps: [
      { title: "Pantau permintaan", detail: "Lihat field diubah, nilai sebelum→sesudah, dan status.", roles: ["tata_usaha", "operator"] },
      { title: "Filter", detail: "Saring per status workflow atau field yang diubah.", roles: ["tata_usaha"] },
      { title: "Ajukan perubahan", detail: "Tombol Ajukan Perubahan membuka form permintaan baru.", roles: ["tata_usaha", "operator"] },
    ],
    tips: ["Data kritis tak bisa diedit langsung — wajib lewat workflow.", "Klik ID untuk melihat detail dan approval."],
  },
  "perubahan-data-baru": {
    title: "Cara pakai Ajukan Perubahan Data",
    intro: "Form usulan ubah data kritis (nama, NIK, tgl lahir, NISN) dengan bukti.",
    steps: [
      { title: "Pilih siswa & field", detail: "Tentukan siswa dan field kritis yang akan diubah.", roles: ["tata_usaha", "operator"] },
      { title: "Isi nilai baru", detail: "Data saat ini terisi otomatis; masukkan nilai baru yang valid.", roles: ["tata_usaha"] },
      { title: "Lampirkan bukti", detail: "Tulis alasan (min. 30 karakter) dan URL lampiran wajib.", roles: ["tata_usaha", "operator"] },
      { title: "Simpan draft", detail: "Disimpan sebagai Draft menunggu approval Ka-TU & Kepsek.", roles: ["tata_usaha"] },
    ],
    tips: ["NIK 16 digit, NISN 10 digit divalidasi otomatis.", "Lampiran akta/KK/penetapan wajib sebelum approval."],
  },
};
