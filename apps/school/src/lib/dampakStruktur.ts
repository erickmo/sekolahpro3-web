/**
 * Dampak Struktur — advisory structural-impact preview for a Mutasi Siswa, shown
 * on the Kepsek Kartu Tinjau before approval (audit graft from C2, gated per C6).
 *
 * ADVISORY ONLY: these verdicts mirror the controller's capacity/status guards so
 * the headmaster is not "approving blind", but the Frappe Workflow engine stays
 * the sole authority — never a hard block (denorm counts can be stale).
 *
 * C6: the over-capacity / Ditutup headroom chip is meaningful ONLY for `Naik
 * Kelas` (the only jenis with a `rombel_tujuan`). Destructive jenis (Pindah
 * Keluar / Drop Out) have no target — they get a destructive-confirm verdict, no
 * headroom. The Kepsek queue is destructive-only, so that is the common path.
 */
import { JENIS_MUTASI, isDestructiveJenis } from "./mutasiConstants";

/** Minimal target-rombel shape needed for the headroom computation. */
export interface DampakTargetRombel {
  name: string;
  kapasitas?: number;
  jumlah_siswa?: number;
  status?: string;
  wali_kelas?: string;
}

export interface DampakInput {
  jenis: string;
  /** The destination rombel — only present/relevant for Naik Kelas. */
  rombelTujuan?: DampakTargetRombel | undefined;
}

export interface DampakVerdict {
  /** Pindah Keluar / Drop Out — removes a student, needs explicit confirm. */
  destructive: boolean;
  /** Whether a target rombel headroom verdict applies (Naik Kelas only). */
  hasTarget: boolean;
  /** Adding the student would exceed kapasitas (Naik Kelas only). */
  overCapacity?: boolean;
  /** The target rombel is Ditutup (Naik Kelas only). */
  targetDitutup?: boolean;
  /** Remaining seats in the target before this move (Naik Kelas only). */
  headroom?: number | undefined;
  /** Advisory, human-readable warnings. */
  warnings: string[];
}

const STATUS_DITUTUP = "Ditutup";

/** Compute the advisory structural impact of a mutasi for the Kartu Tinjau. */
export function computeDampak(input: DampakInput): DampakVerdict {
  if (isDestructiveJenis(input.jenis)) {
    return {
      destructive: true,
      hasTarget: false,
      warnings: ["Aksi destruktif: siswa akan keluar dari rombel. Konfirmasi diperlukan."],
    };
  }

  // Non-destructive with a target (Naik Kelas) → headroom verdict.
  if (input.jenis === JENIS_MUTASI.NAIK_KELAS && input.rombelTujuan) {
    const t = input.rombelTujuan;
    const cap = t.kapasitas ?? 0;
    const isi = t.jumlah_siswa ?? 0;
    const warnings: string[] = [];

    const overCapacity = cap > 0 && isi + 1 > cap;
    if (overCapacity) {
      warnings.push(`Melebihi kapasitas: ${isi + 1}/${cap} setelah penempatan.`);
    }
    const targetDitutup = t.status === STATUS_DITUTUP;
    if (targetDitutup) {
      warnings.push(`Rombel tujuan ${t.name} berstatus Ditutup.`);
    }

    return {
      destructive: false,
      hasTarget: true,
      overCapacity,
      targetDitutup,
      headroom: cap > 0 ? cap - isi : undefined,
      warnings,
    };
  }

  // No target context to assess (e.g. Tinggal Kelas, or Naik without a target).
  return { destructive: false, hasTarget: false, warnings: [] };
}
