import { describe, it, expect } from "vitest";
import {
  validateResourceForm,
  resolveDefaultValue,
  type ResourceFormField,
} from "../resourceForm";

const field = (over: Partial<ResourceFormField> & { name: string; label: string }): ResourceFormField => ({
  type: "text",
  ...over,
});

describe("validateResourceForm", () => {
  it("returns null when all required fields are filled", () => {
    const fields = [field({ name: "nama", label: "Nama", required: true })];
    expect(validateResourceForm(fields, { nama: "Budi" })).toBeNull();
  });

  it("rejects a blank required field", () => {
    const fields = [field({ name: "nama", label: "Nama", required: true })];
    expect(validateResourceForm(fields, { nama: "" })).toMatch(/Nama.*wajib/i);
  });

  it("rejects a non-numeric value for a number field", () => {
    const fields = [field({ name: "jumlah", label: "Jumlah", type: "number" })];
    expect(validateResourceForm(fields, { jumlah: "abc" })).toMatch(/angka/i);
  });

  it("rejects zero for a positive number field", () => {
    const fields = [field({ name: "jumlah", label: "Jumlah", type: "number", positive: true })];
    expect(validateResourceForm(fields, { jumlah: "0" })).toMatch(/lebih dari 0/i);
  });

  it("rejects a negative value for a positive number field", () => {
    const fields = [field({ name: "jumlah", label: "Jumlah", type: "number", positive: true })];
    expect(validateResourceForm(fields, { jumlah: "-5" })).toMatch(/lebih dari 0/i);
  });

  it("accepts a positive value for a positive number field", () => {
    const fields = [field({ name: "jumlah", label: "Jumlah", type: "number", positive: true })];
    expect(validateResourceForm(fields, { jumlah: "50000" })).toBeNull();
  });

  it("ignores positive check when an optional positive field is left blank", () => {
    const fields = [field({ name: "jumlah", label: "Jumlah", type: "number", positive: true })];
    expect(validateResourceForm(fields, { jumlah: "" })).toBeNull();
  });
});

describe("resolveDefaultValue", () => {
  const today = "2026-06-02";

  it("resolves the @today sentinel to today for date fields", () => {
    expect(resolveDefaultValue("@today", "date", today)).toBe(today);
  });

  it("leaves a normal default untouched", () => {
    expect(resolveDefaultValue("Aktif", "select", today)).toBe("Aktif");
  });

  it("stringifies a numeric default", () => {
    expect(resolveDefaultValue(12, "number", today)).toBe("12");
  });

  it("returns empty string for an undefined default", () => {
    expect(resolveDefaultValue(undefined, "text", today)).toBe("");
  });

  it("does not treat @today as today for a non-date field", () => {
    expect(resolveDefaultValue("@today", "text", today)).toBe("@today");
  });
});
