import { describe, it, expect } from "vitest";
import { SISWA_NAV_GROUPS, STAFF_NAV_GROUPS } from "./nav";
import type { NavTabGroup } from "../../components/GroupedNavTabs";

const SCOPE_PREFIX = "/sch/$sekolah/";

function allItems(groups: NavTabGroup[]) {
  return groups.flatMap((g) => g.items);
}

describe.each([
  ["SISWA_NAV_GROUPS", SISWA_NAV_GROUPS],
  ["STAFF_NAV_GROUPS", STAFF_NAV_GROUPS],
])("%s", (_name, groups) => {
  it("has at least one group", () => {
    expect(groups.length).toBeGreaterThan(0);
  });

  it("every group is non-empty and has a label", () => {
    for (const g of groups) {
      expect(g.label.trim().length).toBeGreaterThan(0);
      expect(g.items.length).toBeGreaterThan(0);
    }
  });

  it("every item.to starts with the school scope prefix", () => {
    for (const item of allItems(groups)) {
      expect(item.to.startsWith(SCOPE_PREFIX), `bad route: ${item.to}`).toBe(true);
    }
  });

  it("the first group is 'Ringkasan' with an exact dashboard item", () => {
    const first = groups[0]!;
    const dashboard = first.items[0]!;
    expect(first.label).toBe("Ringkasan");
    expect(dashboard.exact).toBe(true);
  });

  it("has no duplicate 'to' values", () => {
    const tos = allItems(groups).map((i) => i.to);
    expect(new Set(tos).size).toBe(tos.length);
  });

  it("every item has a non-empty label", () => {
    for (const item of allItems(groups)) {
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("SISWA_NAV_GROUPS specifics", () => {
  it("dashboard route is the bare /sch/$sekolah/siswa", () => {
    expect(SISWA_NAV_GROUPS[0]!.items[0]!.to).toBe("/sch/$sekolah/siswa");
  });

  it("includes the Daftar Siswa route", () => {
    const tos = allItems(SISWA_NAV_GROUPS).map((i) => i.to);
    expect(tos).toContain("/sch/$sekolah/siswa/daftar");
  });
});

describe("STAFF_NAV_GROUPS specifics", () => {
  it("dashboard route is the bare /sch/$sekolah/staff", () => {
    expect(STAFF_NAV_GROUPS[0]!.items[0]!.to).toBe("/sch/$sekolah/staff");
  });

  it("includes the Daftar Pegawai route", () => {
    const tos = allItems(STAFF_NAV_GROUPS).map((i) => i.to);
    expect(tos).toContain("/sch/$sekolah/staff/daftar");
  });
});
