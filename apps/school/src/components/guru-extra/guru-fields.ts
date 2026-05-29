import type { ResourceFieldDef } from "../shared/ResourceCreateModal";

// Field schema untuk form Tambah Guru (DocType: Guru).
// Reqd fields mengikuti definisi doctype JSON di apps/sekolahpro.
export const GURU_DOCTYPE = "Pegawai";

export const GURU_FIELDS: ResourceFieldDef[] = [
  { name: "nama_lengkap", label: "Nama Lengkap", type: "text", required: true, colSpan: 2 },
  {
    name: "user",
    label: "User",
    type: "link",
    required: true,
    linkDoctype: "User",
    linkLabelField: "full_name",
    hint: "Akun login Frappe untuk guru ini",
  },
  {
    name: "sekolah",
    label: "Sekolah",
    type: "link",
    required: true,
    linkDoctype: "Sekolah",
  },
  { name: "nik", label: "NIK", type: "text", required: true },
  { name: "tanggal_lahir", label: "Tanggal Lahir", type: "date", required: true },
  {
    name: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    required: true,
    options: [
      { value: "Laki-laki", label: "Laki-laki" },
      { value: "Perempuan", label: "Perempuan" },
    ],
  },
  {
    name: "status_kepegawaian",
    label: "Status Kepegawaian",
    type: "select",
    required: true,
    options: [
      { value: "PNS", label: "PNS" },
      { value: "PPPK", label: "PPPK" },
      { value: "GTY", label: "GTY" },
      { value: "GTT", label: "GTT" },
      { value: "Honorer", label: "Honorer" },
    ],
  },
  { name: "nip", label: "NIP", type: "text" },
  { name: "nuptk", label: "NUPTK", type: "text" },
  { name: "jabatan_fungsional", label: "Jabatan Fungsional", type: "text" },
];
