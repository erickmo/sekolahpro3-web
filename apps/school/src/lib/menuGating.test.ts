import { describe, expect, it } from "vitest";
import { canSee, ROLE_MENU_MAP } from "./menuGating";

describe("ROLE_MENU_MAP single-door entries", () => {
  it("operator gains /akademik (their only door to kelas/jadwal/ekskul/ppdb)", () => {
    expect(ROLE_MENU_MAP.operator).toContain("/akademik");
  });
  it("bendahara gains /akademik (door to ppdb pembayaran)", () => {
    expect(ROLE_MENU_MAP.bendahara).toContain("/akademik");
  });
  it("petugas_koperasi keeps /koperasi (pilih cards + kop shell key off it)", () => {
    expect(ROLE_MENU_MAP.petugas_koperasi).toContain("/koperasi");
  });
});

describe("canSee", () => {
  it("wildcard roles see everything", () => {
    expect(canSee("/apapun", ["admin_sekolah"])).toBe(true);
  });
  it("role union: any allowing role wins", () => {
    expect(canSee("/akademik", ["bendahara", "pustakawan"])).toBe(true);
  });
  it("denies when no role allows", () => {
    expect(canSee("/akademik", ["pustakawan"])).toBe(false);
  });
});
