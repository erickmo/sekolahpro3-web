import type { ResourceFieldDef } from "../shared/ResourceCreateModal";

// Field schemas untuk sub-form modul Guru.
// Reqd mengikuti definisi doctype di apps/sekolahpro.

// --- Berkas Guru ---------------------------------------------------------
// `file` di doctype bertipe Attach. Modal belum punya widget upload, jadi
// pakai text untuk URL/path; ganti ke upload-widget saat tersedia.
export const BERKAS_GURU_FIELDS: ResourceFieldDef[] = [
  {
    name: "guru",
    label: "Guru",
    type: "link",
    required: true,
    linkDoctype: "Pegawai",
    linkLabelField: "nama_lengkap",
  },
  { name: "nama_berkas", label: "Nama Berkas", type: "text", required: true, colSpan: 2 },
  {
    name: "jenis_berkas",
    label: "Jenis Berkas",
    type: "select",
    options: [
      "Ijazah",
      "Sertifikat",
      "KTP",
      "KK",
      "NPWP",
      "SK CPNS",
      "SK PNS",
      "SK Berkala",
      "SK Pangkat",
    ].map((v) => ({ value: v, label: v })),
  },
  { name: "file", label: "URL File", type: "text", required: true, hint: "URL / path file (mis. /files/...)", colSpan: 2 },
  { name: "tanggal_upload", label: "Tanggal Upload", type: "date" },
  { name: "nomor_dokumen", label: "Nomor Dokumen", type: "text" },
  { name: "tanggal_berlaku", label: "Tanggal Berlaku", type: "date" },
  { name: "tanggal_kadaluarsa", label: "Tanggal Kadaluarsa", type: "date" },
  { name: "keterangan", label: "Keterangan", type: "textarea", colSpan: 2 },
];

// --- Jenis Jabatan -------------------------------------------------------
export const JENIS_JABATAN_FIELDS: ResourceFieldDef[] = [
  { name: "nama_jabatan", label: "Nama Jabatan", type: "text", required: true, colSpan: 2 },
  { name: "keterangan", label: "Keterangan", type: "textarea", colSpan: 2 },
];

// --- Mapel Pengampu Guru (child table of Guru, parentfield=mapel_pengampu)
// Selain field anak, kirim parent/parenttype/parentfield untuk POST.
export const MAPEL_PENGAMPU_GURU_FIELDS: ResourceFieldDef[] = [
  {
    name: "parent",
    label: "Guru",
    type: "link",
    required: true,
    linkDoctype: "Pegawai",
    linkLabelField: "nama_lengkap",
    hint: "Guru pengampu (induk)",
  },
  {
    name: "mata_pelajaran",
    label: "Mata Pelajaran",
    type: "link",
    required: true,
    linkDoctype: "Mata Pelajaran",
  },
  {
    name: "tingkat",
    label: "Tingkat",
    type: "select",
    options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((v) => ({
      value: v,
      label: v,
    })),
  },
];

export const MAPEL_PENGAMPU_BASE_VALUES = {
  parenttype: "Pegawai",
  parentfield: "mapel_pengampu",
};

// --- Penugasan Guru ------------------------------------------------------
// detail_penugasan child table dilewati; isi via desk setelah header dibuat.
export const PENUGASAN_GURU_FIELDS: ResourceFieldDef[] = [
  {
    name: "guru",
    label: "Guru",
    type: "link",
    required: true,
    linkDoctype: "Pegawai",
    linkLabelField: "nama_lengkap",
  },
  {
    name: "tahun_ajaran",
    label: "Tahun Ajaran",
    type: "link",
    required: true,
    linkDoctype: "Tahun Ajaran",
  },
  {
    name: "semester",
    label: "Semester",
    type: "select",
    required: true,
    options: [
      { value: "Ganjil", label: "Ganjil" },
      { value: "Genap", label: "Genap" },
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    defaultValue: "Draft",
    options: ["Draft", "Aktif", "Nonaktif"].map((v) => ({ value: v, label: v })),
  },
];

// --- SK Jabatan ----------------------------------------------------------
export const SK_JABATAN_FIELDS: ResourceFieldDef[] = [
  {
    name: "guru",
    label: "Guru",
    type: "link",
    required: true,
    linkDoctype: "Pegawai",
    linkLabelField: "nama_lengkap",
  },
  {
    name: "jenis_jabatan",
    label: "Jenis Jabatan",
    type: "link",
    required: true,
    linkDoctype: "Jenis Jabatan",
  },
  { name: "tanggal_sk", label: "Tanggal SK", type: "date", required: true },
  { name: "tanggal_mulai_berlaku", label: "Mulai Berlaku", type: "date", required: true },
  { name: "tanggal_berakhir", label: "Berakhir", type: "date" },
  {
    name: "tahun_ajaran",
    label: "Tahun Ajaran",
    type: "link",
    linkDoctype: "Tahun Ajaran",
  },
  { name: "nomor_sk_manual", label: "Nomor SK (manual)", type: "text" },
  { name: "keterangan_tugas", label: "Keterangan Tugas", type: "text", colSpan: 2 },
  { name: "dasar_hukum", label: "Dasar Hukum", type: "textarea", colSpan: 2 },
];

// --- SK Mengajar ---------------------------------------------------------
export const SK_MENGAJAR_FIELDS: ResourceFieldDef[] = [
  {
    name: "guru",
    label: "Guru",
    type: "link",
    required: true,
    linkDoctype: "Pegawai",
    linkLabelField: "nama_lengkap",
  },
  {
    name: "penugasan_guru",
    label: "Penugasan Guru",
    type: "link",
    required: true,
    linkDoctype: "Penugasan Guru",
  },
  { name: "tanggal_sk", label: "Tanggal SK", type: "date", required: true },
  { name: "tanggal_mulai_berlaku", label: "Mulai Berlaku", type: "date", required: true },
  { name: "tanggal_berakhir", label: "Berakhir", type: "date" },
  {
    name: "tahun_ajaran",
    label: "Tahun Ajaran",
    type: "link",
    linkDoctype: "Tahun Ajaran",
  },
  {
    name: "semester",
    label: "Semester",
    type: "select",
    options: [
      { value: "Ganjil", label: "Ganjil" },
      { value: "Genap", label: "Genap" },
    ],
  },
  { name: "nomor_sk_manual", label: "Nomor SK (manual)", type: "text" },
  { name: "dasar_hukum", label: "Dasar Hukum", type: "textarea", colSpan: 2 },
];
