/**
 * Unit tests for the extracurricular role helper.
 * Covers EKS-04: role-string normalization, Frappe->ekskul bucket mapping,
 * primary-role priority selection, and permissive fallback.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useSession } from "@sekolahpro/auth";
import {
  mapEkskulRoles,
  pickPrimaryRole,
  useEkskulRole,
  ROLE_LABEL,
  ALL_EKSKUL_ROLES,
  type EkskulRole,
} from "./ekskulRole";

vi.mock("@sekolahpro/auth", () => ({ useSession: vi.fn() }));
const mockedUseSession = vi.mocked(useSession);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("mapEkskulRoles", () => {
  it("maps kepala variants to kepala", () => {
    expect(mapEkskulRoles(["kepala_sekolah"])).toEqual(["kepala"]);
    expect(mapEkskulRoles(["Kepala Sekolah"])).toEqual(["kepala"]);
    expect(mapEkskulRoles(["kepala-sekolah"])).toEqual(["kepala"]);
  });

  it("maps coordinator roles to koordinator", () => {
    expect(mapEkskulRoles(["Koordinator Ekstrakurikuler"])).toEqual(["koordinator"]);
    expect(mapEkskulRoles(["koordinator"])).toEqual(["koordinator"]);
  });

  it("maps coach + teaching roles to pembina", () => {
    expect(mapEkskulRoles(["Pembina Ekstrakurikuler"])).toEqual(["pembina"]);
    expect(mapEkskulRoles(["pelatih"])).toEqual(["pembina"]);
    expect(mapEkskulRoles(["coach"])).toEqual(["pembina"]);
    expect(mapEkskulRoles(["guru"])).toEqual(["pembina"]);
    expect(mapEkskulRoles(["teacher"])).toEqual(["pembina"]);
  });

  it("maps operator/admin-ish roles to koordinator", () => {
    expect(mapEkskulRoles(["admin_sekolah"])).toEqual(["koordinator"]);
    expect(mapEkskulRoles(["super_admin"])).toEqual(["koordinator"]);
    expect(mapEkskulRoles(["operator"])).toEqual(["koordinator"]);
    expect(mapEkskulRoles(["admin"])).toEqual(["koordinator"]);
  });

  it("prefers the koordinator matcher over the ekstrakurikuler->pembina substring", () => {
    // "Koordinator Ekstrakurikuler" contains both "koordinator" and "ekstrakurikuler";
    // koordinator must win (it is listed first, first-match-wins per raw role).
    expect(mapEkskulRoles(["Koordinator Ekstrakurikuler"])).toEqual(["koordinator"]);
  });

  it("collects a deduped set across multiple roles", () => {
    const roles = mapEkskulRoles(["guru", "operator", "guru"]);
    expect(new Set(roles)).toEqual(new Set<EkskulRole>(["pembina", "koordinator"]));
  });

  it("returns an empty array when nothing matches", () => {
    expect(mapEkskulRoles(["pustakawan"])).toEqual([]);
    expect(mapEkskulRoles([])).toEqual([]);
  });
});

describe("pickPrimaryRole", () => {
  it("kepala wins over koordinator and pembina", () => {
    expect(pickPrimaryRole(["pembina", "koordinator", "kepala"])).toBe("kepala");
  });

  it("koordinator wins over pembina", () => {
    expect(pickPrimaryRole(["pembina", "koordinator"])).toBe("koordinator");
  });

  it("returns pembina when it is the only role", () => {
    expect(pickPrimaryRole(["pembina"])).toBe("pembina");
  });

  it("falls back to koordinator when the set is empty", () => {
    expect(pickPrimaryRole([])).toBe("koordinator");
  });
});

describe("ROLE_LABEL", () => {
  it("has a Bahasa Indonesia label for every role", () => {
    for (const role of ALL_EKSKUL_ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
  });
});

describe("useEkskulRole", () => {
  it("derives roles + primary + flags from the session", () => {
    mockedUseSession.mockReturnValue({ roles: ["pembina", "kepala_sekolah"] } as never);
    const { result } = renderHook(() => useEkskulRole());
    expect(new Set(result.current.roles)).toEqual(new Set<EkskulRole>(["pembina", "kepala"]));
    expect(result.current.primary).toBe("kepala");
    expect(result.current.isPembina).toBe(true);
    expect(result.current.isKepala).toBe(true);
    expect(result.current.isKoordinator).toBe(false);
  });

  it("falls back to all roles when the session has no roles", () => {
    mockedUseSession.mockReturnValue({ roles: [] } as never);
    const { result } = renderHook(() => useEkskulRole());
    expect(new Set(result.current.roles)).toEqual(new Set(ALL_EKSKUL_ROLES));
    expect(result.current.primary).toBe("koordinator");
    expect(result.current.isPembina).toBe(true);
    expect(result.current.isKoordinator).toBe(true);
    expect(result.current.isKepala).toBe(true);
  });

  it("falls back to all roles when no Frappe role matches an ekskul bucket", () => {
    mockedUseSession.mockReturnValue({ roles: ["pustakawan", "satpam"] } as never);
    const { result } = renderHook(() => useEkskulRole());
    expect(new Set(result.current.roles)).toEqual(new Set(ALL_EKSKUL_ROLES));
  });

  it("falls back to all roles when useSession throws (no provider mounted)", () => {
    mockedUseSession.mockImplementationOnce(() => {
      throw new Error("no SessionProvider");
    });
    const { result } = renderHook(() => useEkskulRole());
    expect(new Set(result.current.roles)).toEqual(new Set(ALL_EKSKUL_ROLES));
    expect(result.current.primary).toBe("koordinator");
  });
});
