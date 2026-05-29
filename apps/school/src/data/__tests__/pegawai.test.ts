import { describe, it, expect } from "vitest";
import {
  PEGAWAI_LIST,
  findPegawai,
  listPegawaiForSekolah,
  isGuru,
  isStaff,
  isDualRole,
} from "../pegawai";

describe("pegawai entity", () => {
  it("every pegawai has at least one role", () => {
    for (const p of PEGAWAI_LIST) {
      expect(p.roles.length).toBeGreaterThan(0);
    }
  });

  it("role profile presence matches roles array", () => {
    for (const p of PEGAWAI_LIST) {
      expect(p.roles.includes("guru")).toBe(p.guru !== undefined);
      expect(p.roles.includes("staff")).toBe(p.staff !== undefined);
    }
  });

  it("contains at least two dual-role exemplars", () => {
    const dual = PEGAWAI_LIST.filter(isDualRole);
    expect(dual.length).toBeGreaterThanOrEqual(2);
  });

  it("findPegawai returns undefined for unknown NIP", () => {
    expect(findPegawai("DOES-NOT-EXIST")).toBeUndefined();
  });

  it("listPegawaiForSekolah filters by school slug", () => {
    if (PEGAWAI_LIST.length === 0) return;
    const slug = PEGAWAI_LIST[0]!.sekolah;
    const subset = listPegawaiForSekolah(slug);
    expect(subset.every((p) => p.sekolah === slug)).toBe(true);
  });

  it("role predicates are consistent", () => {
    const guruOnly = PEGAWAI_LIST.find((p) => isGuru(p) && !isStaff(p));
    if (!guruOnly) return;
    expect(isGuru(guruOnly)).toBe(true);
    expect(isStaff(guruOnly)).toBe(false);
    expect(isDualRole(guruOnly)).toBe(false);
  });
});
