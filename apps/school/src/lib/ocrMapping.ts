// ocrMapping — pure field-name translation between OCR output and form state.
//
// Layer: Domain utility (pure functions, no I/O, no React, fully testable).
// Maps the backend's snake_case OCR field dict to the camelCase keys expected
// by SiswaForm (SiswaFormValues) and WaliModal (WaliRow).

/** Raw parsed fields from the backend OCR response. */
type Parsed = Record<string, unknown>;

/**
 * Extract a non-empty string value from a parsed OCR dict.
 *
 * @param src - The parsed OCR field dict.
 * @param key - Key to look up.
 * @returns The string value if present and non-empty, otherwise undefined.
 */
function str(src: Parsed, key: string): string | undefined {
  const v = src[key];
  return typeof v === "string" && v ? v : undefined;
}

// Mapping from OCR snake_case keys → SiswaFormValues camelCase keys.
const KTP_TO_SISWA: Record<string, string> = {
  nik: "nik",
  nama: "namaLengkap",
  jenis_kelamin: "jenisKelamin",
  tempat_lahir: "tempatLahir",
  tanggal_lahir: "tanggalLahir",
  agama: "agama",
  alamat: "alamat",
};

/**
 * Map a KTP / KK OCR parsed dict to the subset of SiswaFormValues field keys.
 *
 * Only keys present AND non-empty in the OCR output are included in the result,
 * so callers can safely spread the return value without overwriting existing
 * form values with empty strings.
 *
 * @param p - Parsed OCR field dict (backend snake_case).
 * @returns Partial SiswaFormValues-keyed dict with only the mapped, non-empty values.
 */
export function mapKtpToSiswa(p: Parsed): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [from, to] of Object.entries(KTP_TO_SISWA)) {
    const v = str(p, from);
    if (v) out[to] = v;
  }
  return out;
}

/**
 * Map a KTP OCR parsed dict to WaliRow field keys.
 *
 * The NIK destination depends on the wali's `hubungan`:
 * - "Ayah" → `nikAyah`
 * - "Ibu"  → `nikIbu`
 * - "Wali" → `nik` (generic fallback)
 *
 * Only present + non-empty keys are included.
 *
 * @param p        - Parsed OCR field dict (backend snake_case).
 * @param hubungan - Relationship type determines which NIK field is set.
 * @returns Partial WaliRow-keyed dict ready to spread into setV.
 */
export function mapKtpToWali(
  p: Parsed,
  hubungan: "Ayah" | "Ibu" | "Wali",
): Record<string, string> {
  const out: Record<string, string> = {};

  const nama = str(p, "nama");
  if (nama) out.nama = nama;

  // Route NIK to the correct wali-specific field based on relationship.
  const nik = str(p, "nik");
  if (nik) {
    out[hubungan === "Ayah" ? "nikAyah" : hubungan === "Ibu" ? "nikIbu" : "nik"] = nik;
  }

  const pekerjaan = str(p, "pekerjaan");
  if (pekerjaan) out.pekerjaan = pekerjaan;

  const alamat = str(p, "alamat");
  if (alamat) out.alamat = alamat;

  return out;
}
