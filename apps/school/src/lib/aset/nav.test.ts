import { describe, it, expect } from "vitest";
import { ASET_TABS, isTabActive } from "./nav";

describe("ASET_TABS", () => {
  it("has a Dashboard tab marked exact", () => {
    const dash = ASET_TABS.find((t) => t.label === "Dashboard");
    expect(dash?.exact).toBe(true);
  });
  it("covers all module sub-pages", () => {
    const labels = ASET_TABS.map((t) => t.label);
    expect(labels).toContain("Daftar Aset");
    expect(labels).toContain("Peminjaman");
    expect(labels).toContain("Maintenance");
    expect(labels).toContain("Transfer");
  });
});

describe("isTabActive", () => {
  const sekolah = "sma1";
  it("exact tab matches only its own path", () => {
    expect(isTabActive("/sch/$sekolah/aset", sekolah, "/sch/sma1/aset", true)).toBe(true);
    expect(isTabActive("/sch/$sekolah/aset", sekolah, "/sch/sma1/aset/daftar", true)).toBe(false);
  });
  it("non-exact tab matches nested detail routes", () => {
    expect(isTabActive("/sch/$sekolah/aset/peminjaman", sekolah, "/sch/sma1/aset/peminjaman", false)).toBe(true);
    expect(isTabActive("/sch/$sekolah/aset/peminjaman", sekolah, "/sch/sma1/aset/peminjaman/PINJ-AST-0001", false)).toBe(true);
    expect(isTabActive("/sch/$sekolah/aset/peminjaman", sekolah, "/sch/sma1/aset/maintenance", false)).toBe(false);
  });
});
