import { describe, it, expect } from "vitest";
import { deriveRoles } from "../sessionRole";
import { ASET_ROLE_CONFIG, ROLE_LABEL } from "./role";

describe("ASET_ROLE_CONFIG via deriveRoles", () => {
  it("maps petugas_aset to petugas", () => {
    const d = deriveRoles(["Petugas Aset"], ASET_ROLE_CONFIG);
    expect(d.roles).toContain("petugas");
    expect(d.primary).toBe("petugas");
  });

  it("maps manajer_aset to manajer and prioritizes it", () => {
    const d = deriveRoles(["Manajer Aset", "Petugas Aset"], ASET_ROLE_CONFIG);
    expect(d.roles).toContain("manajer");
    expect(d.primary).toBe("manajer");
  });

  it("admin_sekolah resolves to admin", () => {
    const d = deriveRoles(["admin_sekolah"], ASET_ROLE_CONFIG);
    expect(d.roles).toContain("admin");
  });

  it("is permissive when no role matches", () => {
    const d = deriveRoles(["RandomRole"], ASET_ROLE_CONFIG);
    expect(d.roles).toEqual(["petugas", "manajer", "admin"]);
    expect(d.primary).toBe("petugas");
  });

  it("empty session falls back to all buckets, primary petugas", () => {
    const d = deriveRoles([], ASET_ROLE_CONFIG);
    expect(d.primary).toBe("petugas");
    expect(d.roles.length).toBe(3);
  });

  it("has a label for every bucket", () => {
    expect(ROLE_LABEL.petugas).toBeTruthy();
    expect(ROLE_LABEL.manajer).toBeTruthy();
    expect(ROLE_LABEL.admin).toBeTruthy();
  });
});
