import { describe, it, expect } from "vitest";
import {
  KEUANGAN_HUB_GROUPS,
  KEUANGAN_NAV_GROUPS,
  KEUANGAN_SETUP_GROUP,
  resolveActiveSection,
  isItemEmphasized,
  type KeuanganNavItem,
} from "./keuanganHub";

describe("KEUANGAN_HUB_GROUPS structure (Alur Uang pipeline)", () => {
  it("has the money-flow stages + setup drawer in order", () => {
    expect(KEUANGAN_HUB_GROUPS.map((g) => g.key)).toEqual([
      "beranda",
      "tagih",
      "terima",
      "catat",
      "tutup-buku",
      "lapor-pajak",
      "siapkan",
    ]);
  });

  it("Tagih opens with the student-invoice page", () => {
    const tagih = KEUANGAN_HUB_GROUPS.find((g) => g.key === "tagih");
    expect(tagih?.items[0]?.label).toBe("Tagihan SPP & Siswa");
    expect(tagih?.items[0]?.to).toBe("/sch/$sekolah/keuangan/tagihan");
  });

  it("Lapor Pajak holds the tax pages", () => {
    const pajak = KEUANGAN_HUB_GROUPS.find((g) => g.key === "lapor-pajak");
    expect(pajak?.items.map((i) => i.label)).toContain("SPT Masa PPN");
    expect(pajak?.items.map((i) => i.label)).toContain("PPh Withholding");
  });

  it("every item has a non-empty `to` and `label`", () => {
    const items: KeuanganNavItem[] = KEUANGAN_HUB_GROUPS.flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.to).toMatch(/^\/sch\/\$sekolah\//);
      expect(it.label.length).toBeGreaterThan(0);
    }
  });

  it("exposes the 5 pipeline stages (no setup drawer) as the header pill row", () => {
    expect(KEUANGAN_NAV_GROUPS.map((g) => g.label)).not.toContain("Siapkan");
    // beranda + 5 stages
    expect(KEUANGAN_NAV_GROUPS.length).toBe(6);
  });

  it("exposes the setup drawer group separately", () => {
    expect(KEUANGAN_SETUP_GROUP.key).toBe("siapkan");
    expect(KEUANGAN_SETUP_GROUP.items.length).toBeGreaterThan(0);
  });
});

describe("resolveActiveSection (canonical home per route)", () => {
  it("maps the hub root to beranda", () => {
    expect(resolveActiveSection("/sch/x/keuangan")).toBe("beranda");
  });

  it("maps operasional pages to their pipeline stage", () => {
    expect(resolveActiveSection("/sch/x/keuangan/tagihan")).toBe("tagih");
    expect(resolveActiveSection("/sch/x/keuangan/pembayaran")).toBe("terima");
    expect(resolveActiveSection("/sch/x/keuangan/kas")).toBe("terima");
    expect(resolveActiveSection("/sch/x/keuangan/pengeluaran")).toBe("catat");
  });

  it("maps ledger pages to their pipeline stage", () => {
    expect(resolveActiveSection("/sch/x/akuntansi/buku-besar/jurnal/new")).toBe("catat");
    expect(resolveActiveSection("/sch/x/akuntansi/buku-besar/pembayaran")).toBe("terima");
    expect(resolveActiveSection("/sch/x/akuntansi/anggaran")).toBe("tutup-buku");
    expect(resolveActiveSection("/sch/x/akuntansi/pajak/spt-ppn")).toBe("lapor-pajak");
    expect(resolveActiveSection("/sch/x/akuntansi/referensi/fiscal-year")).toBe("siapkan");
  });

  it("maps the bare akuntansi root to beranda (it redirects to the hub)", () => {
    expect(resolveActiveSection("/sch/x/akuntansi")).toBe("beranda");
  });

  it("returns null for unrelated routes", () => {
    expect(resolveActiveSection("/sch/x/siswa")).toBeNull();
  });
});

describe("isItemEmphasized", () => {
  const tagihan: KeuanganNavItem = { to: "/sch/$sekolah/keuangan/tagihan", label: "Tagihan", roles: ["bendahara", "kasir"] };
  const pajak: KeuanganNavItem = { to: "/sch/$sekolah/akuntansi/pajak", label: "Pajak", roles: ["akuntan", "kepala"] };
  const beranda: KeuanganNavItem = { to: "/sch/$sekolah/keuangan", label: "Beranda", exact: true };

  it("emphasizes operasional items for bendahara/kasir", () => {
    expect(isItemEmphasized(tagihan, "kasir")).toBe(true);
    expect(isItemEmphasized(tagihan, "akuntan")).toBe(false);
  });

  it("emphasizes akuntansi items for akuntan/kepala", () => {
    expect(isItemEmphasized(pajak, "akuntan")).toBe(true);
    expect(isItemEmphasized(pajak, "kasir")).toBe(false);
  });

  it("treats role-agnostic items (no roles) as always emphasized", () => {
    expect(isItemEmphasized(beranda, "kasir")).toBe(true);
    expect(isItemEmphasized(beranda, "akuntan")).toBe(true);
  });
});
