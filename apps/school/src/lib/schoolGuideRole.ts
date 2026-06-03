/**
 * Shared role labels for in-app page guides across school modules that lack a
 * dedicated role helper (Absensi, Jadwal, Kelas, Master, Siswa, Staff, Situs,
 * Infrastruktur, Pengaturan, and singleton pages).
 *
 * Guide steps tag themselves with these coarse role keys to FRAME who a step
 * speaks to — they are a presentation hint only and never hide functionality.
 * PageGuide resolves an unknown key to itself, so this map is permissive: a
 * page may tag any key here and get a friendly Bahasa Indonesia label.
 */

/** Coarse audience buckets shared by guide content in role-helper-less modules. */
export type SchoolGuideRole =
  | "admin"
  | "operator"
  | "tata_usaha"
  | "guru"
  | "wali_kelas"
  | "kepala_sekolah"
  | "kurikulum"
  | "kesiswaan"
  | "bk"
  | "bendahara"
  | "pustakawan"
  | "humas";

/** Map a coarse role key to its Bahasa Indonesia label for guide badges. */
export const SCHOOL_ROLE_LABEL: Record<SchoolGuideRole, string> = {
  admin: "Admin Sekolah",
  operator: "Operator",
  tata_usaha: "Tata Usaha",
  guru: "Guru",
  wali_kelas: "Wali Kelas",
  kepala_sekolah: "Kepala Sekolah",
  kurikulum: "Kurikulum",
  kesiswaan: "Kesiswaan",
  bk: "Bimbingan Konseling",
  bendahara: "Bendahara",
  pustakawan: "Pustakawan",
  humas: "Humas",
};
