/**
 * Canonical constants for the Mutasi Siswa workflow + jenis taxonomy.
 *
 * These strings are the source of truth for the Frappe `Mutasi Siswa` doctype
 * (workflow states from `workflow_mutasi_siswa.json`, jenis options from
 * `mutasi_siswa.json`). They were previously hand-typed across mutasi/kelulusan
 * routes, the siswa detail, and the bulk-naik flow — with a live `"DO"` vs
 * `"Drop Out"` inconsistency. Import from here instead of re-typing.
 *
 * Source of truth: sekolahpro/siswa/doctype/mutasi_siswa/mutasi_siswa.json,
 * sekolahpro/fixtures/workflow_mutasi_siswa.json.
 */

/** Workflow states of `Mutasi Siswa` (and `Kelulusan Siswa`, same workflow shape). */
export const WORKFLOW_STATE = {
  DRAFT: "Draft",
  PENDING_KATU: "Pending Ka-TU",
  PENDING_KEPSEK: "Pending Kepsek",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export type WorkflowState = (typeof WORKFLOW_STATE)[keyof typeof WORKFLOW_STATE];

/**
 * `jenis_mutasi` options, using the doctype-authoritative labels.
 * NOTE: the doctype value is `"Drop Out"` (mutasi_siswa.json). Some legacy UI
 * used a short `"DO"` — that is a display alias, not the stored value.
 */
export const JENIS_MUTASI = {
  NAIK_KELAS: "Naik Kelas",
  TINGGAL_KELAS: "Tinggal Kelas",
  PINDAH_KELUAR: "Pindah Keluar",
  DROP_OUT: "Drop Out",
} as const;

export type JenisMutasi = (typeof JENIS_MUTASI)[keyof typeof JENIS_MUTASI];

/**
 * Jenis the real workflow escalates to `Pending Kepsek`. Per the conditional
 * transitions in workflow_mutasi_siswa.json, only these reach the headmaster;
 * Naik/Tinggal Kelas are finalized by Ka-TU. The Kepsek approval queue is
 * therefore intrinsically destructive-only.
 */
export const DESTRUCTIVE_JENIS: readonly JenisMutasi[] = [
  JENIS_MUTASI.PINDAH_KELUAR,
  JENIS_MUTASI.DROP_OUT,
];

/** True when a jenis_mutasi is one that escalates to Kepsek (Pindah Keluar / Drop Out). */
export function isDestructiveJenis(jenis: string): boolean {
  return (DESTRUCTIVE_JENIS as readonly string[]).includes(jenis);
}
