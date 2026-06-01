import type { ResourceFieldDef } from "../components/shared/ResourceCreateModal";

// Centralized create-form schemas for sub-domain "P2" routes.
// Each block: required fields plus the most common optional fields.

// ============================================================ Jadwal
export const JADWAL_PELAJARAN_FIELDS: ResourceFieldDef[] = [
  {
    name: "rombel",
    label: "Rombel",
    type: "link",
    required: true,
    linkDoctype: "Rombongan Belajar",
  },
  {
    name: "tahun_ajaran",
    label: "Tahun Ajaran",
    type: "link",
    required: true,
    linkDoctype: "Tahun Ajaran",
  },
  { name: "semester", label: "Semester", type: "link", required: true, linkDoctype: "Semester" },
  { name: "kurikulum", label: "Kurikulum", type: "link", required: true, linkDoctype: "Kurikulum" },
];

export const JADWAL_OVERRIDE_FIELDS: ResourceFieldDef[] = [
  {
    name: "rombel",
    label: "Rombel",
    type: "link",
    required: true,
    linkDoctype: "Rombongan Belajar",
  },
  { name: "tanggal", label: "Tanggal", type: "date", required: true },
  {
    name: "tipe",
    label: "Tipe",
    type: "select",
    required: true,
    options: ["Libur", "Pengganti", "Tambahan"].map((v) => ({ value: v, label: v })),
  },
  { name: "alasan", label: "Alasan", type: "text", colSpan: 2 },
];

// Slot Override = child table of Jadwal Override (parentfield=slots).
export const SLOT_OVERRIDE_FIELDS: ResourceFieldDef[] = [
  {
    name: "parent",
    label: "Jadwal Override",
    type: "link",
    required: true,
    linkDoctype: "Jadwal Override",
    hint: "Header jadwal override (induk)",
  },
  { name: "jam_mulai", label: "Jam Mulai (HH:MM)", type: "text", required: true },
  { name: "jam_selesai", label: "Jam Selesai (HH:MM)", type: "text", required: true },
  {
    name: "mata_pelajaran",
    label: "Mata Pelajaran",
    type: "link",
    required: true,
    linkDoctype: "Mata Pelajaran",
  },
  {
    name: "guru",
    label: "Guru",
    type: "link",
    required: true,
    linkDoctype: "Guru",
    linkLabelField: "nama_lengkap",
  },
  { name: "ruangan", label: "Ruangan", type: "link", linkDoctype: "Ruangan" },
];

export const SLOT_OVERRIDE_BASE_VALUES = {
  parenttype: "Jadwal Override",
  parentfield: "slots",
};

// ============================================================ Kelas
export const ROMBONGAN_BELAJAR_FIELDS: ResourceFieldDef[] = [
  { name: "nama_rombel", label: "Nama Rombel", type: "text", required: true },
  {
    name: "tahun_ajaran",
    label: "Tahun Ajaran",
    type: "link",
    required: true,
    linkDoctype: "Tahun Ajaran",
  },
  {
    name: "jenjang",
    label: "Jenjang",
    type: "link",
    required: true,
    linkDoctype: "Unit Jenjang",
  },
  { name: "tingkat", label: "Tingkat", type: "number", required: true },
  { name: "sekolah", label: "Sekolah", type: "link", required: true, linkDoctype: "Sekolah" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Aktif",
    options: ["Aktif", "Ditutup"].map((v) => ({ value: v, label: v })),
  },
  { name: "wali_kelas", label: "Wali Kelas", type: "link", linkDoctype: "User" },
  { name: "kapasitas", label: "Kapasitas", type: "number" },
  { name: "ruangan", label: "Ruangan", type: "link", linkDoctype: "Ruangan" },
];

// Anggota Rombel = child table of Rombongan Belajar (parentfield=anggota).
export const ANGGOTA_ROMBEL_FIELDS: ResourceFieldDef[] = [
  {
    name: "parent",
    label: "Rombel",
    type: "link",
    required: true,
    linkDoctype: "Rombongan Belajar",
    hint: "Rombongan belajar (induk)",
  },
  {
    name: "siswa",
    label: "Siswa",
    type: "link",
    required: true,
    linkDoctype: "Siswa",
    linkLabelField: "nama_lengkap",
  },
  { name: "no_urut", label: "No. Urut", type: "number" },
  { name: "tanggal_masuk_rombel", label: "Tanggal Masuk", type: "date" },
  {
    name: "status",
    label: "Status",
    type: "select",
    defaultValue: "Aktif",
    options: ["Aktif", "Keluar"].map((v) => ({ value: v, label: v })),
  },
];

export const ANGGOTA_ROMBEL_BASE_VALUES = {
  parenttype: "Rombongan Belajar",
  parentfield: "anggota",
};

// ============================================================ Koperasi
export const ANGGOTA_KOPERASI_FIELDS: ResourceFieldDef[] = [
  { name: "nasabah", label: "Nasabah", type: "link", required: true, linkDoctype: "Nasabah" },
  {
    name: "jenis_anggota",
    label: "Jenis Anggota",
    type: "select",
    required: true,
    options: ["Anggota", "Calon Anggota", "Anggota Luar Biasa"].map((v) => ({
      value: v,
      label: v,
    })),
  },
  { name: "tanggal_masuk", label: "Tanggal Masuk", type: "date", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Aktif",
    options: ["Aktif", "Keluar"].map((v) => ({ value: v, label: v })),
  },
  { name: "nomor_anggota", label: "Nomor Anggota (opsional)", type: "text" },
];

// Jadwal Angsuran = child table of Akad Pembiayaan (parentfield=jadwal_angsuran).
// Form berikut digunakan untuk menambah baris angsuran ke akad terpilih.
export const JADWAL_ANGSURAN_FIELDS: ResourceFieldDef[] = [
  {
    name: "parent",
    label: "Akad Pembiayaan",
    type: "link",
    required: true,
    linkDoctype: "Akad Pembiayaan",
    hint: "Akad pembiayaan (induk)",
  },
  { name: "ke", label: "Angsuran ke-", type: "number", required: true },
  { name: "tanggal_jatuh_tempo", label: "Jatuh Tempo", type: "date", required: true },
  { name: "pokok", label: "Pokok", type: "number", required: true },
  { name: "margin", label: "Margin", type: "number", required: true },
  { name: "total", label: "Total", type: "number", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Belum",
    options: ["Belum", "Lunas", "Terlambat"].map((v) => ({ value: v, label: v })),
  },
];

export const JADWAL_ANGSURAN_BASE_VALUES = {
  parenttype: "Akad Pembiayaan",
  parentfield: "jadwal_angsuran",
};

// ============================================================ Koperasi Sosial
// Penerimaan ZIS = dana sosial masuk (Zakat/Infak/Sedekah/Wakaf Tunai).
// jenis_dana options match the existing list filter on the ZIS route.
export const PENERIMAAN_ZIS_FIELDS: ResourceFieldDef[] = [
  {
    name: "jenis_dana",
    label: "Jenis Dana",
    type: "select",
    required: true,
    options: ["Zakat", "Infak", "Sedekah", "Wakaf Tunai"].map((v) => ({ value: v, label: v })),
  },
  { name: "jumlah", label: "Nominal (Rp)", type: "number", required: true, positive: true },
  { name: "tanggal", label: "Tanggal", type: "date", required: true, defaultValue: "@today" },
  {
    name: "nasabah",
    label: "Muzakki / Sumber",
    type: "link",
    linkDoctype: "Nasabah",
    hint: "Opsional — kosongkan untuk infak anonim.",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Diterima",
    options: ["Diterima", "Disalurkan"].map((v) => ({ value: v, label: v })),
  },
  { name: "keterangan", label: "Keterangan", type: "textarea", colSpan: 2 },
];

// Aset Wakaf = aset wakaf yang dikelola koperasi.
export const ASET_WAKAF_FIELDS: ResourceFieldDef[] = [
  { name: "nama_aset", label: "Nama Aset", type: "text", required: true, colSpan: 2 },
  {
    name: "jenis_wakaf",
    label: "Jenis Wakaf",
    type: "select",
    required: true,
    options: ["Tunai", "Tanah", "Bangunan", "Kendaraan", "Lainnya"].map((v) => ({ value: v, label: v })),
  },
  { name: "nilai", label: "Nilai (Rp)", type: "number", required: true, positive: true },
  {
    name: "wakif",
    label: "Wakif",
    type: "link",
    linkDoctype: "Nasabah",
    hint: "Opsional — pemberi wakaf.",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Produktif",
    options: ["Produktif", "Tidak Produktif"].map((v) => ({ value: v, label: v })),
  },
  { name: "keterangan", label: "Keterangan", type: "textarea", colSpan: 2 },
];

// ============================================================ Laporan
export const LAPORAN_TERJADWAL_FIELDS: ResourceFieldDef[] = [
  { name: "nama", label: "Nama Jadwal", type: "text", required: true, colSpan: 2 },
  { name: "report", label: "Report (Frappe Report Name)", type: "text", required: true, colSpan: 2 },
  {
    name: "periode",
    label: "Periode",
    type: "select",
    required: true,
    options: ["Harian", "Mingguan", "Bulanan", "Semesteran", "Tahunan"].map((v) => ({
      value: v,
      label: v,
    })),
  },
  {
    name: "format",
    label: "Format",
    type: "select",
    required: true,
    options: ["CSV", "Excel", "PDF"].map((v) => ({ value: v, label: v })),
  },
  { name: "sekolah", label: "Sekolah", type: "link", linkDoctype: "Sekolah" },
  { name: "next_run", label: "Next Run (YYYY-MM-DD HH:MM:SS)", type: "text" },
];
