import type { MasterFieldDef } from "./MasterCreateModal";

// Shared field schemas for master.* CRUD forms. Used by list (create) + detail (edit).

const STATUS_OPTIONS = [
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

export const SEKOLAH_FIELDS: MasterFieldDef[] = [
  { name: "nama", label: "Nama Sekolah", type: "text", required: true },
  { name: "npsn", label: "NPSN", type: "text" },
  { name: "tingkat", label: "Jenjang", type: "select", options: [
    { value: "PAUD", label: "PAUD" },
    { value: "TK", label: "TK" },
    { value: "SD", label: "SD" },
    { value: "SMP", label: "SMP" },
    { value: "SMA", label: "SMA" },
    { value: "SMK", label: "SMK" },
  ] },
  { name: "alamat", label: "Alamat", type: "textarea" },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "Aktif" },
];

export const TAHUN_AJARAN_FIELDS: MasterFieldDef[] = [
  { name: "nama", label: "Tahun Ajaran", type: "text", required: true, hint: "Cth: 2025/2026" },
  { name: "tanggal_mulai", label: "Tanggal Mulai", type: "date", required: true },
  { name: "tanggal_selesai", label: "Tanggal Selesai", type: "date", required: true },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "Aktif" },
];

export const SEMESTER_FIELDS: MasterFieldDef[] = [
  { name: "nama", label: "Nama Semester", type: "text", required: true, hint: "Cth: Ganjil 2025/2026" },
  { name: "tahun_ajaran", label: "Tahun Ajaran", type: "text", required: true },
  { name: "tanggal_mulai", label: "Tanggal Mulai", type: "date", required: true },
  { name: "tanggal_selesai", label: "Tanggal Selesai", type: "date", required: true },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "Aktif" },
];

export const UNIT_JENJANG_FIELDS: MasterFieldDef[] = [
  { name: "nama", label: "Nama Unit", type: "text", required: true },
  { name: "tingkat", label: "Jenjang", type: "select", required: true, options: [
    { value: "PAUD", label: "PAUD" },
    { value: "TK", label: "TK" },
    { value: "SD", label: "SD" },
    { value: "SMP", label: "SMP" },
    { value: "SMA", label: "SMA" },
    { value: "SMK", label: "SMK" },
  ] },
  { name: "sekolah", label: "Sekolah", type: "text", required: true, hint: "ID Sekolah" },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "Aktif" },
];

export const ORGANISASI_FIELDS: MasterFieldDef[] = [
  { name: "nama", label: "Nama Organisasi", type: "text", required: true },
  { name: "jenis_organisasi", label: "Jenis", type: "select", options: [
    { value: "Yayasan", label: "Yayasan" },
    { value: "Sekolah", label: "Sekolah" },
    { value: "Unit", label: "Unit" },
    { value: "Lainnya", label: "Lainnya" },
  ] },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "Aktif" },
];

export const MODUL_FIELDS: MasterFieldDef[] = [
  { name: "nama", label: "Nama Modul", type: "text", required: true },
  { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: 1 },
  { name: "deskripsi", label: "Deskripsi", type: "textarea" },
];

export const FEATURE_FLAG_FIELDS: MasterFieldDef[] = [
  { name: "key", label: "Key Flag", type: "text", required: true, disabledOnEdit: true, hint: "snake_case key" },
  { name: "enabled", label: "Aktif", type: "checkbox", defaultValue: 0 },
  { name: "description", label: "Deskripsi", type: "textarea" },
];

export const PENGGUNA_FIELDS: MasterFieldDef[] = [
  { name: "user", label: "Email User", type: "text", required: true, disabledOnEdit: true },
  { name: "role_sekolah", label: "Peran", type: "select", required: true, options: [
    { value: "Admin", label: "Admin" },
    { value: "Kepala Sekolah", label: "Kepala Sekolah" },
    { value: "Guru", label: "Guru" },
    { value: "Staf TU", label: "Staf TU" },
    { value: "Bendahara", label: "Bendahara" },
    { value: "Wali Kelas", label: "Wali Kelas" },
  ] },
  { name: "sekolah", label: "Sekolah", type: "text", hint: "ID Sekolah" },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "Aktif" },
];
