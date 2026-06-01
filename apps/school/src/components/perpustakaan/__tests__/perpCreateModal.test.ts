// PERP-GAP-16 | PERP-GAP-23
import { describe, it, expect } from "vitest";
import { buildPerpPayload, type PerpFieldDef } from "../PerpCreateModal";

const FIELDS: PerpFieldDef[] = [
  { name: "judul", label: "Judul", type: "text", required: true },
  { name: "tahun", label: "Tahun", type: "number" },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

describe("buildPerpPayload (PERP-GAP-23)", () => {
  it("blocks when a required field is empty/whitespace", () => {
    expect(buildPerpPayload(FIELDS, { judul: "  ", tahun: "2026" })).toEqual({
      ok: false,
      error: 'Field "Judul" wajib diisi.',
    });
  });

  it("coerces number fields and omits empty values", () => {
    const res = buildPerpPayload(FIELDS, { judul: "Buku A", tahun: "2026", catatan: "" });
    expect(res).toEqual({ ok: true, payload: { judul: "Buku A", tahun: 2026 } });
  });

  it("rejects a non-numeric number field", () => {
    expect(buildPerpPayload(FIELDS, { judul: "Buku A", tahun: "abc" })).toEqual({
      ok: false,
      error: 'Field "Tahun" harus berupa angka.',
    });
  });

  it("returns just the required field when optionals are absent", () => {
    expect(buildPerpPayload(FIELDS, { judul: "Buku A" })).toEqual({ ok: true, payload: { judul: "Buku A" } });
  });
});
