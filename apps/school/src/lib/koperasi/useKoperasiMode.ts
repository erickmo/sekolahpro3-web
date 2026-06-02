// Baca jenis koperasi (Konvensional vs Syariah/BMT) dari singleton backend
// `Pengaturan Koperasi` (field mode_koperasi). Dipakai untuk menyesuaikan menu.
import { useResourceDoc } from "@sekolahpro/api-client";

/** Nilai mode_koperasi backend untuk koperasi konvensional. */
export const MODE_KONVENSIONAL = "Konvensional";
/** Nilai mode_koperasi backend untuk koperasi syariah (BMT). */
export const MODE_SYARIAH = "Syariah (BMT)";

const PENGATURAN_KOPERASI = "Pengaturan Koperasi";

interface PengaturanKoperasiDoc {
  mode_koperasi?: string;
}

/**
 * Turunkan flag syariah dari nilai mode_koperasi.
 * Hanya nilai eksplisit "Konvensional" yang dianggap konvensional; selainnya
 * (undefined/unknown/loading) → true (superset) supaya BMT tak pernah
 * kehilangan menu ZIS/Wakaf sebelum data termuat.
 * @param mode nilai mentah field mode_koperasi
 */
export function deriveIsSyariah(mode: string | undefined): boolean {
  return mode !== MODE_KONVENSIONAL;
}

/**
 * Hook: baca mode koperasi dari singleton Pengaturan Koperasi.
 * @param enabled false mematikan fetch (mis. di luar shell /kop)
 * @returns isSyariah (dengan fallback superset) + isLoading
 */
export function useKoperasiMode(enabled: boolean): { isSyariah: boolean; isLoading: boolean } {
  const q = useResourceDoc<PengaturanKoperasiDoc>(
    PENGATURAN_KOPERASI,
    PENGATURAN_KOPERASI,
    { enabled },
  );
  return { isSyariah: deriveIsSyariah(q.data?.mode_koperasi), isLoading: q.isLoading };
}
