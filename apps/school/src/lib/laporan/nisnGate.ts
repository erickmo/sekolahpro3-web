/**
 * Pre-flight data-quality gate for the Pusat Lapor "Susun & Kirim" flow.
 *
 * Runs the Siswa Missing NISN report and blocks submission while any student
 * lacks a NISN — preventing the #1 real-world TU failure: a Dapodik rejection.
 * Pure: the component fetches the report via export_data; these helpers parse
 * + evaluate the result.
 */

/** Extract the rows from an export_data response (JSON envelope, object, or bare array). */
export function extractRows(raw: unknown): unknown[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown[] }).data)) {
    return (value as { data: unknown[] }).data;
  }
  return [];
}

export interface NisnGateResult {
  blocked: boolean;
  count: number;
}

/** The gate is blocked while any student is missing a NISN. */
export function evaluateNisnGate(rows: readonly unknown[]): NisnGateResult {
  const count = rows.length;
  return { blocked: count > 0, count };
}
