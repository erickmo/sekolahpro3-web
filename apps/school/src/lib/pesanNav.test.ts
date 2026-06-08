import { describe, it, expect } from "vitest";
import { filterPesanNav, PESAN_NAV_GROUPS } from "./pesanNav";

describe("filterPesanNav", () => {
  it("guru sees the 'Pesan Wali' (Saya) tab", () => {
    const groups = filterPesanNav("guru");
    const labels = groups.flatMap((g) => g.items.map((i) => i.label));
    expect(labels).toContain("Beranda");
    expect(labels).toContain("Pesan Wali");
  });

  it("tu and kepsek do NOT see the guru-only Saya tab (empty group dropped)", () => {
    for (const role of ["tu", "kepsek"] as const) {
      const groups = filterPesanNav(role);
      const labels = groups.flatMap((g) => g.items.map((i) => i.label));
      expect(labels).toContain("Beranda");
      expect(labels).not.toContain("Pesan Wali");
      expect(groups.some((g) => g.label === "Saya")).toBe(false);
    }
  });

  it("strips the internal `roles` annotation from emitted items", () => {
    const items = filterPesanNav("guru").flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(0);
    const item = items[0]!;
    expect(item).not.toHaveProperty("roles");
    expect(item.to).toBeTruthy();
  });

  it("Beranda item is shown to all roles (no roles annotation)", () => {
    const beranda = PESAN_NAV_GROUPS[0]!.items[0]!;
    expect(beranda.roles).toBeUndefined();
    expect(beranda.exact).toBe(true);
  });
});
