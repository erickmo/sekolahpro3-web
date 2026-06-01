/**
 * Unit tests for CreateResourceModal pure helpers.
 *
 * Covers AKA-23: section grouping order, conditional field visibility
 * (showWhen), initial-value construction, and Frappe error parsing — the
 * data-shaping logic behind the dynamic form.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({
  listResource: vi.fn().mockResolvedValue([]),
  useResourceCreate: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

import {
  groupBySection,
  fieldVisible,
  buildInitial,
  parseFrappeError,
  type FieldSpec,
} from "./CreateResourceModal";

const f = (name: string, extra: Partial<FieldSpec> = {}): FieldSpec => ({ name, label: name, ...extra });

describe("groupBySection", () => {
  it("groups by section and preserves first-seen section order", () => {
    const groups = groupBySection(
      [f("a", { section: "Umum" }), f("b", { section: "Lanjutan" }), f("c", { section: "Umum" })],
      "Data",
    );
    expect(groups.map((g) => g.title)).toEqual(["Umum", "Lanjutan"]);
    expect(groups[0]!.fields.map((x) => x.name)).toEqual(["a", "c"]);
  });

  it("falls back to the default title for fields without a section", () => {
    const groups = groupBySection([f("a"), f("b")], "Data");
    expect(groups).toHaveLength(1);
    expect(groups[0]!.title).toBe("Data");
  });
});

describe("fieldVisible", () => {
  it("is always visible without a showWhen condition", () => {
    expect(fieldVisible(f("a"), {})).toBe(true);
  });

  it("respects the showWhen equality condition", () => {
    const field = f("interval", { showWhen: { field: "tipe", equals: "Interval" } });
    expect(fieldVisible(field, { tipe: "Interval" })).toBe(true);
    expect(fieldVisible(field, { tipe: "Angka" })).toBe(false);
    expect(fieldVisible(field, {})).toBe(false);
  });
});

describe("buildInitial", () => {
  it("defaults checkbox to false and other kinds to empty string", () => {
    const init = buildInitial([f("aktif", { kind: "checkbox" }), f("nama", { kind: "text" })], undefined);
    expect(init).toEqual({ aktif: false, nama: "" });
  });

  it("honours an explicit defaultValue", () => {
    expect(buildInitial([f("n", { kind: "number", defaultValue: 75 })], undefined)).toEqual({ n: 75 });
  });

  it("applies overrides on top of defaults", () => {
    const init = buildInitial([f("ta"), f("nama")], { ta: "S-2025" });
    expect(init).toEqual({ ta: "S-2025", nama: "" });
  });
});

describe("parseFrappeError", () => {
  it("uses the Error message as the generic fallback", () => {
    expect(parseFrappeError(new Error("boom")).generic).toBe("boom");
  });

  it("prefers data.message and maps error_list to per-field errors", () => {
    const err = {
      data: {
        message: "Validasi gagal",
        error_list: [{ fieldname: "nama", message: "Wajib diisi" }],
      },
    };
    const parsed = parseFrappeError(err);
    expect(parsed.generic).toBe("Validasi gagal");
    expect(parsed.perField).toEqual({ nama: "Wajib diisi" });
  });

  it("returns a default generic message for an unknown error", () => {
    expect(parseFrappeError(null).generic).toBe("Gagal menyimpan");
  });
});
