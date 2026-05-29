export type PegawaiApi = {
  name: string;
  nama_lengkap?: string;
  nip?: string;
  nik?: string;
  nuptk?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: "Laki-laki" | "Perempuan";
  agama?: string;
  status_kepegawaian?: string;
  jabatan_fungsional?: string;
  sekolah?: string;
  is_aktif?: 0 | 1;
  tmt_pertama_kerja?: string;
  roles?: Array<{ role: string }>;
};

const ROLE_GURU = "Pegawai Guru";
const ROLE_STAFF = "Pegawai Staff";

export function apiIsGuru(p: PegawaiApi): boolean {
  return (p.roles ?? []).some((r) => r.role === ROLE_GURU);
}

export function apiIsStaff(p: PegawaiApi): boolean {
  return (p.roles ?? []).some((r) => r.role === ROLE_STAFF);
}

export function apiIsDualRole(p: PegawaiApi): boolean {
  return apiIsGuru(p) && apiIsStaff(p);
}

export function apiRoleBadges(p: PegawaiApi): Array<"guru" | "staff"> {
  const out: Array<"guru" | "staff"> = [];
  if (apiIsGuru(p)) out.push("guru");
  if (apiIsStaff(p)) out.push("staff");
  return out;
}
