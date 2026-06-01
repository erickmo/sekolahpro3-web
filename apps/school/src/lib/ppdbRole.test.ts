/**
 * Tests untuk ppdbRole — memverifikasi pemetaan peran PPDB (staff / manajer)
 * dari string peran Frappe, pemilihan peran utama berdasarkan prioritas, dan
 * fallback permisif saat tidak ada peran yang cocok atau sesi kosong.
 */

import { describe, it, expect, vi } from "vitest";
import {
  ROLE_LABEL,
  normalizeRole,
  mapPpdbRoles,
  pickPrimary,
  usePpdbRole,
  type PpdbRole,
} from "./ppdbRole";

// `usePpdbRole` memanggil useSession; stub agar test fallback deterministik.
vi.mock("@sekolahpro/auth", () => ({
  useSession: vi.fn(() => ({ roles: [] })),
}));

import { useSession } from "@sekolahpro/auth";

describe("ROLE_LABEL", () => {
  it("menyediakan label Bahasa Indonesia untuk tiap peran", () => {
    expect(ROLE_LABEL.staff).toBe("Staff PPDB");
    expect(ROLE_LABEL.manajer).toBe("Manajer PPDB");
  });
});

describe("normalizeRole", () => {
  it("lowercase + ganti spasi/dash menjadi underscore", () => {
    expect(normalizeRole("Kepala Sekolah")).toBe("kepala_sekolah");
    expect(normalizeRole("admin-sekolah")).toBe("admin_sekolah");
    expect(normalizeRole("  Super  Admin  ")).toBe("super_admin");
  });
});

describe("mapPpdbRoles", () => {
  it("memetakan kepala_sekolah / kepala menjadi manajer", () => {
    expect(mapPpdbRoles(["Kepala Sekolah"])).toEqual(["manajer"]);
    expect(mapPpdbRoles(["kepala"])).toEqual(["manajer"]);
  });

  it("memetakan operator / bendahara / admin menjadi staff", () => {
    expect(mapPpdbRoles(["operator"])).toEqual(["staff"]);
    expect(mapPpdbRoles(["bendahara"])).toEqual(["staff"]);
    expect(mapPpdbRoles(["admin_sekolah"])).toEqual(["staff"]);
    expect(mapPpdbRoles(["super_admin"])).toEqual(["staff"]);
    expect(mapPpdbRoles(["admin"])).toEqual(["staff"]);
  });

  it("mengabaikan peran tak dikenal (mengembalikan array kosong)", () => {
    expect(mapPpdbRoles(["random_guest"])).toEqual([]);
    expect(mapPpdbRoles([])).toEqual([]);
  });

  it("menggabungkan peran majemuk tanpa duplikat", () => {
    const roles = mapPpdbRoles(["kepala_sekolah", "operator", "bendahara"]);
    expect(roles).toContain("manajer");
    expect(roles).toContain("staff");
    expect(roles).toHaveLength(2);
  });
});

describe("pickPrimary", () => {
  it("memilih manajer ketika ada (prioritas tertinggi)", () => {
    expect(pickPrimary(["staff", "manajer"])).toBe("manajer");
    expect(pickPrimary(["manajer"])).toBe("manajer");
  });

  it("memilih staff ketika manajer tidak ada", () => {
    expect(pickPrimary(["staff"])).toBe("staff");
  });

  it("fallback ke staff untuk himpunan kosong", () => {
    expect(pickPrimary([])).toBe("staff");
  });
});

describe("usePpdbRole", () => {
  it("fallback permisif (kedua peran) saat sesi tanpa roles", () => {
    vi.mocked(useSession).mockReturnValue({ roles: [] } as unknown as ReturnType<
      typeof useSession
    >);
    const info = usePpdbRole();
    expect(info.roles).toEqual(expect.arrayContaining(["staff", "manajer"]));
    expect(info.isStaff).toBe(true);
    expect(info.isManajer).toBe(true);
    expect(info.primary).toBe("manajer");
  });

  it("fallback permisif saat useSession melempar (tanpa provider)", () => {
    vi.mocked(useSession).mockImplementation(() => {
      throw new Error("no provider");
    });
    const info = usePpdbRole();
    expect(info.isStaff).toBe(true);
    expect(info.isManajer).toBe(true);
  });

  it("mempersempit ke peran yang cocok saat roles ada", () => {
    vi.mocked(useSession).mockReturnValue({
      roles: ["operator"],
    } as ReturnType<typeof useSession>);
    const info = usePpdbRole();
    expect(info.roles).toEqual<PpdbRole[]>(["staff"]);
    expect(info.isStaff).toBe(true);
    expect(info.isManajer).toBe(false);
    expect(info.primary).toBe("staff");
  });
});
