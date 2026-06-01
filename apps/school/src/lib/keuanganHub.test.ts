import { describe, it, expect } from "vitest";
import {
  KEUANGAN_HUB_GROUPS,
  resolveActiveSection,
  isItemEmphasized,
  type KeuanganNavItem,
} from "./keuanganHub";

describe("KEUANGAN_HUB_GROUPS structure", () => {
  it("has the three top sections in order", () => {
    expect(KEUANGAN_HUB_GROUPS.map((g) => g.key)).toEqual([
      "ringkasan",
      "operasional",
      "akuntansi",
    ]);
  });

  it("operasional holds the four daily-cash pages", () => {
    const op = KEUANGAN_HUB_GROUPS.find((g) => g.key === "operasional");
    expect(op?.items.map((i) => i.label)).toEqual([
      "Tagihan",
      "Pembayaran",
      "Pengeluaran",
      "Buku Kas",
    ]);
  });

  it("akuntansi holds the four ledger pages", () => {
    const ak = KEUANGAN_HUB_GROUPS.find((g) => g.key === "akuntansi");
    expect(ak?.items.map((i) => i.label)).toEqual([
      "Buku Besar",
      "Anggaran",
      "Pajak",
      "Referensi",
    ]);
  });

  it("every item has a non-empty `to` and `label`", () => {
    const items: KeuanganNavItem[] = KEUANGAN_HUB_GROUPS.flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.to).toMatch(/^\/sch\/\$sekolah\//);
      expect(it.label.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveActiveSection", () => {
  it("maps the dashboard root to ringkasan", () => {
    expect(resolveActiveSection("/sch/x/keuangan")).toBe("ringkasan");
  });

  it("maps operasional pages", () => {
    expect(resolveActiveSection("/sch/x/keuangan/tagihan")).toBe("operasional");
    expect(resolveActiveSection("/sch/x/keuangan/pembayaran")).toBe("operasional");
    expect(resolveActiveSection("/sch/x/keuangan/pengeluaran")).toBe("operasional");
    expect(resolveActiveSection("/sch/x/keuangan/kas")).toBe("operasional");
  });

  it("maps every akuntansi route tree to akuntansi", () => {
    expect(resolveActiveSection("/sch/x/akuntansi")).toBe("akuntansi");
    expect(resolveActiveSection("/sch/x/akuntansi/buku-besar/jurnal/new")).toBe("akuntansi");
    expect(resolveActiveSection("/sch/x/akuntansi/pajak/spt-ppn")).toBe("akuntansi");
  });

  it("returns null for unrelated routes", () => {
    expect(resolveActiveSection("/sch/x/siswa")).toBeNull();
  });
});

describe("isItemEmphasized", () => {
  const tagihan: KeuanganNavItem = { to: "/sch/$sekolah/keuangan/tagihan", label: "Tagihan", roles: ["bendahara", "kasir"] };
  const pajak: KeuanganNavItem = { to: "/sch/$sekolah/akuntansi/pajak", label: "Pajak", roles: ["akuntan", "kepala"] };
  const dashboard: KeuanganNavItem = { to: "/sch/$sekolah/keuangan", label: "Dashboard", exact: true };

  it("emphasizes operasional items for bendahara/kasir", () => {
    expect(isItemEmphasized(tagihan, "kasir")).toBe(true);
    expect(isItemEmphasized(tagihan, "akuntan")).toBe(false);
  });

  it("emphasizes akuntansi items for akuntan/kepala", () => {
    expect(isItemEmphasized(pajak, "akuntan")).toBe(true);
    expect(isItemEmphasized(pajak, "kasir")).toBe(false);
  });

  it("treats role-agnostic items (no roles) as always emphasized", () => {
    expect(isItemEmphasized(dashboard, "kasir")).toBe(true);
    expect(isItemEmphasized(dashboard, "akuntan")).toBe(true);
  });
});
