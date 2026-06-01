import { describe, it, expect } from "vitest";
import {
  mapFrappeRolesToPengaturan,
  pickPrimaryRole,
  ROLE_LABEL,
  ALL_PENGATURAN_ROLES,
  pengaturanRoleLabel,
  type PengaturanRole,
} from "./pengaturanRole";

describe("mapFrappeRolesToPengaturan", () => {
  it("maps Kepala Sekolah to kepala", () => {
    expect(mapFrappeRolesToPengaturan(["Kepala Sekolah"])).toContain("kepala");
  });

  it("maps Bendahara to bendahara", () => {
    expect(mapFrappeRolesToPengaturan(["Bendahara"])).toEqual(["bendahara"]);
  });

  it("maps tata usaha / operator / staff to tu", () => {
    expect(mapFrappeRolesToPengaturan(["Tata Usaha"])).toEqual(["tu"]);
    expect(mapFrappeRolesToPengaturan(["operator"])).toEqual(["tu"]);
    expect(mapFrappeRolesToPengaturan(["staff"])).toEqual(["tu"]);
  });

  it("maps IT-ish roles (it_admin, IT, sysadmin, teknisi) to it", () => {
    expect(mapFrappeRolesToPengaturan(["it_admin"])).toEqual(["it"]);
    expect(mapFrappeRolesToPengaturan(["IT"])).toEqual(["it"]);
    expect(mapFrappeRolesToPengaturan(["sysadmin"])).toEqual(["it"]);
    expect(mapFrappeRolesToPengaturan(["teknisi"])).toEqual(["it"]);
  });

  it("maps auditor to auditor", () => {
    expect(mapFrappeRolesToPengaturan(["Auditor"])).toEqual(["auditor"]);
  });

  it("grants ALL roles for System Manager (full access)", () => {
    expect(new Set(mapFrappeRolesToPengaturan(["System Manager"]))).toEqual(
      new Set(ALL_PENGATURAN_ROLES),
    );
  });

  it("grants ALL roles for super_admin / admin_sekolah / administrator", () => {
    expect(new Set(mapFrappeRolesToPengaturan(["super_admin"]))).toEqual(new Set(ALL_PENGATURAN_ROLES));
    expect(new Set(mapFrappeRolesToPengaturan(["admin_sekolah"]))).toEqual(new Set(ALL_PENGATURAN_ROLES));
    expect(new Set(mapFrappeRolesToPengaturan(["Administrator"]))).toEqual(new Set(ALL_PENGATURAN_ROLES));
  });

  it("returns empty array for unknown roles", () => {
    expect(mapFrappeRolesToPengaturan(["pustakawan"])).toEqual([]);
    expect(mapFrappeRolesToPengaturan([])).toEqual([]);
  });

  it("collects a deduped set across multiple roles", () => {
    const roles = mapFrappeRolesToPengaturan(["Bendahara", "Auditor", "Bendahara"]);
    expect(new Set(roles)).toEqual(new Set<PengaturanRole>(["bendahara", "auditor"]));
  });
});

describe("pickPrimaryRole", () => {
  it("follows priority kepala > it > tu > bendahara > auditor", () => {
    expect(pickPrimaryRole(["auditor", "bendahara", "tu", "it", "kepala"])).toBe("kepala");
    expect(pickPrimaryRole(["auditor", "bendahara", "tu", "it"])).toBe("it");
    expect(pickPrimaryRole(["auditor", "bendahara", "tu"])).toBe("tu");
    expect(pickPrimaryRole(["auditor", "bendahara"])).toBe("bendahara");
    expect(pickPrimaryRole(["auditor"])).toBe("auditor");
  });

  it("falls back to kepala when set is empty", () => {
    expect(pickPrimaryRole([])).toBe("kepala");
  });
});

describe("ROLE_LABEL", () => {
  it("has a Bahasa Indonesia label for every role", () => {
    for (const role of ALL_PENGATURAN_ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
  });
});

describe("pengaturanRoleLabel", () => {
  it("returns the friendly label for a known role key", () => {
    expect(pengaturanRoleLabel("kepala")).toBe("Kepala Sekolah");
    expect(pengaturanRoleLabel("it")).toBe("Admin IT");
  });
});
