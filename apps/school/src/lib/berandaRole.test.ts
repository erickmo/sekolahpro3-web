import { describe, it, expect } from "vitest";
import {
  mapBerandaRoles,
  deriveBerandaRoles,
  BERANDA_ROLE_LABEL,
  ALL_BERANDA_ROLES,
  type BerandaRole,
} from "./berandaRole";

describe("mapBerandaRoles", () => {
  it("maps bendahara", () => {
    expect(mapBerandaRoles(["bendahara"])).toEqual(["bendahara"]);
  });

  it("maps Tata Usaha and operator to tu_operator", () => {
    expect(mapBerandaRoles(["Tata Usaha"])).toEqual(["tu_operator"]);
    expect(mapBerandaRoles(["operator"])).toEqual(["tu_operator"]);
  });

  it("maps guru / teacher to guru", () => {
    expect(mapBerandaRoles(["guru"])).toEqual(["guru"]);
    expect(mapBerandaRoles(["Teacher"])).toEqual(["guru"]);
  });

  it("maps Wali Kelas (spaced/dashed) to wali_kelas, not guru", () => {
    expect(mapBerandaRoles(["Wali Kelas"])).toEqual(["wali_kelas"]);
    expect(mapBerandaRoles(["wali-kelas"])).toEqual(["wali_kelas"]);
  });

  it("maps kepala_sekolah to kepala_sekolah", () => {
    expect(mapBerandaRoles(["Kepala Sekolah"])).toEqual(["kepala_sekolah"]);
  });

  it("grants ALL roles for full-access roles", () => {
    expect(new Set(mapBerandaRoles(["super_admin"]))).toEqual(new Set(ALL_BERANDA_ROLES));
    expect(new Set(mapBerandaRoles(["admin_sekolah"]))).toEqual(new Set(ALL_BERANDA_ROLES));
    expect(new Set(mapBerandaRoles(["Administrator"]))).toEqual(new Set(ALL_BERANDA_ROLES));
  });

  it("returns empty when nothing matches", () => {
    expect(mapBerandaRoles(["pustakawan"])).toEqual([]);
    expect(mapBerandaRoles([])).toEqual([]);
  });
});

describe("deriveBerandaRoles", () => {
  it("permissive fallback (all roles, primary tu_operator) for empty input", () => {
    const d = deriveBerandaRoles([]);
    expect(new Set(d.roles)).toEqual(new Set(ALL_BERANDA_ROLES));
    expect(d.primary).toBe("tu_operator");
  });

  it("permissive fallback when no matcher hits", () => {
    const d = deriveBerandaRoles(["pustakawan"]);
    expect(new Set(d.roles)).toEqual(new Set(ALL_BERANDA_ROLES));
    expect(d.primary).toBe("tu_operator");
  });

  it("kepala_sekolah wins over teaching roles (oversight priority)", () => {
    expect(deriveBerandaRoles(["guru", "kepala_sekolah"]).primary).toBe("kepala_sekolah");
  });

  it("wali_kelas wins over guru (more specific scope)", () => {
    expect(deriveBerandaRoles(["guru", "wali_kelas"]).primary).toBe("wali_kelas");
  });

  it("bendahara wins over tu_operator", () => {
    expect(deriveBerandaRoles(["operator", "bendahara"]).primary).toBe("bendahara");
  });

  it("single guru stays guru", () => {
    const d = deriveBerandaRoles(["guru"]);
    expect(d.roles).toEqual(["guru"]);
    expect(d.primary).toBe("guru");
  });
});

describe("BERANDA_ROLE_LABEL", () => {
  it("has a Bahasa Indonesia label for every role", () => {
    for (const role of ALL_BERANDA_ROLES) {
      expect(BERANDA_ROLE_LABEL[role as BerandaRole]).toBeTruthy();
    }
  });
});
