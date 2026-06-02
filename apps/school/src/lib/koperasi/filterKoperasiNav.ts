// Filter murni: petakan KOPERASI_NAV ke menu sesuai jenis koperasi.
// - Section/item ber-`mode` hanya tampil bila cocok dengan mode aktif.
// - Item ber-`labelKonvensional` memakai label itu saat mode konvensional.
// - Section yang kosong setelah filter item dibuang.
import type { KoperasiMode, KoperasiNavSection } from "../koperasi-nav";

/**
 * Saring sections sidebar koperasi menurut mode (syariah vs konvensional).
 * @param sections daftar section mentah (KOPERASI_NAV)
 * @param isSyariah true untuk BMT/syariah, false untuk konvensional
 * @returns sections terfilter dengan label sudah disesuaikan
 */
export function filterKoperasiNav(
  sections: KoperasiNavSection[],
  isSyariah: boolean,
): KoperasiNavSection[] {
  const mode: KoperasiMode = isSyariah ? "syariah" : "konvensional";
  return sections
    .filter((s) => !s.mode || s.mode === mode)
    .map((s) => ({
      ...s,
      items: s.items
        .filter((it) => !it.mode || it.mode === mode)
        .map((it) =>
          !isSyariah && it.labelKonvensional
            ? { ...it, label: it.labelKonvensional }
            : it,
        ),
    }))
    .filter((s) => s.items.length > 0);
}
