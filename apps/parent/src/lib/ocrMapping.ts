// ocrMapping — pure field-name translation between OCR output and PickupPerson form state.
//
// Layer: Domain utility (pure functions, no I/O, no React, fully testable).
// Maps the backend's snake_case OCR field dict to the keys expected by
// PickupPersonForm (PickupPersonFormValues).
//
// Note: PickupPerson deliberately has NO NIK field — only the person's name is
// auto-filled from KTP. Phone and PIN always require manual entry for safety.

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

/**
 * Map a KTP OCR parsed dict to PickupPersonFormValues field keys.
 *
 * Only the `nama` field is mapped — PickupPerson has no NIK field, and
 * phone/PIN must always be entered manually for security. Only keys that
 * are present AND non-empty in the OCR output are included, so callers can
 * safely pass the return value to setNama without overwriting valid data.
 *
 * @param p - Parsed OCR field dict (backend snake_case).
 * @returns Partial PickupPersonFormValues-keyed dict with only mapped, non-empty values.
 */
export function mapKtpToPickup(p: Parsed): Record<string, string> {
  const out: Record<string, string> = {};
  // Only 'nama' is an auto-fillable field on PickupPerson.
  const nama = str(p, "nama");
  if (nama) out["nama"] = nama;
  return out;
}
