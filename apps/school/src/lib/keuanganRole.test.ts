import { describe, it, expect } from "vitest";
import {
  mapFrappeRolesToKeuangan,
  pickPrimaryRole,
  ROLE_LABEL,
  ALL_KEUANGAN_ROLES,
  type KeuanganRole,
} from "./keuanganRole";

describe("mapFrappeRolesToKeuangan", () => {
  it("maps bendahara role", () => {
    expect(mapFrappeRolesToKeuangan(["bendahara"])).toEqual(["bendahara"]);
  });

  it("maps cashier-ish roles (kasir, cashier, tata_usaha, operator) to kasir", () => {
    expect(mapFrappeRolesToKeuangan(["kasir"])).toEqual(["kasir"]);
    expect(mapFrappeRolesToKeuangan(["cashier"])).toEqual(["kasir"]);
    expect(mapFrappeRolesToKeuangan(["tata_usaha"])).toEqual(["kasir"]);
    expect(mapFrappeRolesToKeuangan(["operator"])).toEqual(["kasir"]);
  });

  it("maps accounting roles (akuntan, Accounts Manager, Accounts User) to akuntan", () => {
    expect(mapFrappeRolesToKeuangan(["akuntan"])).toEqual(["akuntan"]);
    expect(mapFrappeRolesToKeuangan(["Accounts Manager"])).toEqual(["akuntan"]);
    expect(mapFrappeRolesToKeuangan(["Accounts User"])).toEqual(["akuntan"]);
  });

  it("maps kepala_sekolah to kepala", () => {
    expect(mapFrappeRolesToKeuangan(["kepala_sekolah"])).toEqual(["kepala"]);
  });

  it("normalizes spacing and dashes (Kepala Sekolah / kepala-sekolah)", () => {
    expect(mapFrappeRolesToKeuangan(["Kepala Sekolah"])).toEqual(["kepala"]);
    expect(mapFrappeRolesToKeuangan(["kepala-sekolah"])).toEqual(["kepala"]);
  });

  it("collects a deduped set across multiple roles", () => {
    const roles = mapFrappeRolesToKeuangan(["bendahara", "akuntan", "bendahara"]);
    expect(new Set(roles)).toEqual(new Set<KeuanganRole>(["bendahara", "akuntan"]));
  });

  it("grants ALL roles for full-access roles (super_admin, admin_sekolah, Administrator)", () => {
    expect(new Set(mapFrappeRolesToKeuangan(["super_admin"]))).toEqual(new Set(ALL_KEUANGAN_ROLES));
    expect(new Set(mapFrappeRolesToKeuangan(["admin_sekolah"]))).toEqual(new Set(ALL_KEUANGAN_ROLES));
    expect(new Set(mapFrappeRolesToKeuangan(["Administrator"]))).toEqual(new Set(ALL_KEUANGAN_ROLES));
  });

  it("returns empty array when nothing matches", () => {
    expect(mapFrappeRolesToKeuangan(["pustakawan"])).toEqual([]);
    expect(mapFrappeRolesToKeuangan([])).toEqual([]);
  });
});

describe("pickPrimaryRole", () => {
  it("kepala wins over every other role", () => {
    expect(pickPrimaryRole(["kasir", "akuntan", "bendahara", "kepala"])).toBe("kepala");
  });

  it("bendahara wins over akuntan and kasir", () => {
    expect(pickPrimaryRole(["kasir", "akuntan", "bendahara"])).toBe("bendahara");
  });

  it("akuntan wins over kasir", () => {
    expect(pickPrimaryRole(["kasir", "akuntan"])).toBe("akuntan");
  });

  it("falls back to bendahara when set is empty", () => {
    expect(pickPrimaryRole([])).toBe("bendahara");
  });
});

describe("ROLE_LABEL", () => {
  it("has a Bahasa Indonesia label for every role", () => {
    for (const role of ALL_KEUANGAN_ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
  });
});
