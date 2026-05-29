import { describe, it, expect } from "vitest";
import { apiIsGuru, apiIsStaff, apiIsDualRole, apiRoleBadges, type PegawaiApi } from "../roles";

const make = (roles: string[]): PegawaiApi => ({
  name: "PEGAWAI-0001",
  roles: roles.map((role) => ({ role })),
});

describe("pegawai role helpers (API)", () => {
  it("detects guru role", () => {
    expect(apiIsGuru(make(["Pegawai Guru"]))).toBe(true);
    expect(apiIsGuru(make(["Pegawai Staff"]))).toBe(false);
  });

  it("detects staff role", () => {
    expect(apiIsStaff(make(["Pegawai Staff"]))).toBe(true);
    expect(apiIsStaff(make([]))).toBe(false);
  });

  it("detects dual role only when both present", () => {
    expect(apiIsDualRole(make(["Pegawai Guru", "Pegawai Staff"]))).toBe(true);
    expect(apiIsDualRole(make(["Pegawai Guru"]))).toBe(false);
  });

  it("returns badges in guru,staff order", () => {
    expect(apiRoleBadges(make(["Pegawai Staff", "Pegawai Guru"]))).toEqual(["guru", "staff"]);
    expect(apiRoleBadges(make([]))).toEqual([]);
  });

  it("handles missing roles array", () => {
    expect(apiIsGuru({ name: "x" })).toBe(false);
    expect(apiRoleBadges({ name: "x" })).toEqual([]);
  });
});
