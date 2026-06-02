import { describe, it, expect } from "vitest";
import {
  asetStatusTone,
  kondisiTone,
  peminjamanStatusTone,
  maintenanceStatusTone,
  prioritasTone,
  formatRupiah,
  stokLabel,
} from "./badges";

describe("tone mappers", () => {
  it("asetStatusTone", () => {
    expect(asetStatusTone("Tersedia")).toBe("success");
    expect(asetStatusTone("Maintenance")).toBe("warning");
    expect(asetStatusTone("Hilang")).toBe("danger");
    expect(asetStatusTone(undefined)).toBe("neutral");
  });
  it("kondisiTone", () => {
    expect(kondisiTone("Baik")).toBe("success");
    expect(kondisiTone("Rusak Ringan")).toBe("warning");
    expect(kondisiTone("Rusak Berat")).toBe("danger");
  });
  it("peminjamanStatusTone", () => {
    expect(peminjamanStatusTone("Dipinjam")).toBe("brand");
    expect(peminjamanStatusTone("Terlambat")).toBe("danger");
    expect(peminjamanStatusTone("Dikembalikan")).toBe("success");
  });
  it("maintenanceStatusTone", () => {
    expect(maintenanceStatusTone("Selesai")).toBe("success");
    expect(maintenanceStatusTone("Dilaporkan")).toBe("danger");
  });
  it("prioritasTone", () => {
    expect(prioritasTone("Kritis")).toBe("danger");
    expect(prioritasTone("Rendah")).toBe("neutral");
  });
});

describe("formatters", () => {
  it("formatRupiah handles null", () => {
    expect(formatRupiah(null)).toBe("—");
    expect(formatRupiah(undefined)).toBe("—");
  });
  it("formatRupiah formats IDR without decimals", () => {
    const out = formatRupiah(150000);
    expect(out).toContain("150.000");
    expect(out).toContain("Rp");
  });
  it("stokLabel", () => {
    expect(stokLabel(7, 10)).toBe("7 / 10 tersedia");
    expect(stokLabel(undefined, undefined)).toBe("0 / 0 tersedia");
  });
});
