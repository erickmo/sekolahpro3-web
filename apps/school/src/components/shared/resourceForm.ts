/**
 * Pure validation + default-resolution helpers for ResourceCreateModal.
 *
 * Extracted from the component so the rules (required, numeric, must-be-positive)
 * and the "@today" date default are unit-testable without rendering React.
 * The modal imports these; structural typing lets it pass its ResourceFieldDef[]
 * straight in (ResourceFieldDef satisfies ResourceFormField).
 */

export interface ResourceFormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  /** When true, a number field must be strictly greater than zero. */
  positive?: boolean;
}

/**
 * Validate raw string form values against the field schema.
 * @returns null when valid, otherwise a Bahasa Indonesia error message.
 */
export function validateResourceForm(
  fields: ResourceFormField[],
  values: Record<string, string>,
): string | null {
  for (const f of fields) {
    const raw = values[f.name]?.toString().trim() ?? "";

    if (f.required && !raw) {
      return `Field "${f.label}" wajib diisi.`;
    }

    if (f.type === "number" && raw) {
      const n = Number(raw);
      if (Number.isNaN(n)) {
        return `Field "${f.label}" harus berupa angka.`;
      }
      if (f.positive && n <= 0) {
        return `Field "${f.label}" harus lebih dari 0.`;
      }
    }
  }
  return null;
}

/**
 * Resolve a schema default for an initial form value. The "@today" sentinel on
 * a date field becomes the supplied today (kept correct at form-open time
 * instead of baked in at module load); everything else is stringified as-is.
 */
export function resolveDefaultValue(
  raw: string | number | undefined,
  type: string,
  today: string,
): string {
  if (type === "date" && raw === "@today") return today;
  return raw !== undefined ? String(raw) : "";
}
