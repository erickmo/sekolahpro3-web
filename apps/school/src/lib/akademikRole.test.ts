/**
 * Unit tests for the academic role helper.
 *
 * Covers AKA-04: role-string normalization, Frappe→academic bucket mapping,
 * primary-role priority selection, and the permissive fallback behaviour of the
 * `useAkademikRole` hook (no provider / empty roles / unmatched roles).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useSession } from "@sekolahpro/auth";
import {
  mapAkademikRoles,
  pickPrimaryRole,
  useAkademikRole,
  ROLE_LABEL,
  ALL_AKADEMIK_ROLES,
  type AkademikRole,
} from "./akademikRole";

// `useAkademikRole` reads the auth session; mock it so we control the roles it
// sees (including the "no provider" case where useSession throws).
vi.mock("@sekolahpro/auth", () => ({ useSession: vi.fn() }));
const mockedUseSession = vi.mocked(useSession);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("mapAkademikRoles", () => {
  it("maps kepala variants to kepala", () => {
    expect(mapAkademikRoles(["kepala_sekolah"])).toEqual(["kepala"]);
    expect(mapAkademikRoles(["kepala"])).toEqual(["kepala"]);
  });

  it("maps teaching roles (guru, teacher) to guru", () => {
    expect(mapAkademikRoles(["guru"])).toEqual(["guru"]);
    expect(mapAkademikRoles(["teacher"])).toEqual(["guru"]);
  });

  it("maps operator/admin-ish roles to admin", () => {
    expect(mapAkademikRoles(["admin_sekolah"])).toEqual(["admin"]);
    expect(mapAkademikRoles(["super_admin"])).toEqual(["admin"]);
    expect(mapAkademikRoles(["operator"])).toEqual(["admin"]);
    expect(mapAkademikRoles(["akademik"])).toEqual(["admin"]);
    expect(mapAkademikRoles(["admin"])).toEqual(["admin"]);
  });

  it("normalizes spacing and dashes (Kepala Sekolah / kepala-sekolah)", () => {
    expect(mapAkademikRoles(["Kepala Sekolah"])).toEqual(["kepala"]);
    expect(mapAkademikRoles(["kepala-sekolah"])).toEqual(["kepala"]);
  });

  it("prefers the kepala_sekolah matcher over the bare admin substring", () => {
    // "kepala_sekolah" contains no "admin"; ensure the more specific kepala
    // matcher is reached and the role resolves to kepala (not admin).
    expect(mapAkademikRoles(["Kepala Sekolah"])).toEqual(["kepala"]);
  });

  it("collects a deduped set across multiple roles", () => {
    const roles = mapAkademikRoles(["guru", "operator", "guru"]);
    expect(new Set(roles)).toEqual(new Set<AkademikRole>(["guru", "admin"]));
  });

  it("returns an empty array when nothing matches", () => {
    expect(mapAkademikRoles(["pustakawan"])).toEqual([]);
    expect(mapAkademikRoles([])).toEqual([]);
  });
});

describe("pickPrimaryRole", () => {
  it("kepala wins over admin and guru", () => {
    expect(pickPrimaryRole(["guru", "admin", "kepala"])).toBe("kepala");
  });

  it("admin wins over guru", () => {
    expect(pickPrimaryRole(["guru", "admin"])).toBe("admin");
  });

  it("returns guru when it is the only role", () => {
    expect(pickPrimaryRole(["guru"])).toBe("guru");
  });

  it("falls back to admin when the set is empty", () => {
    expect(pickPrimaryRole([])).toBe("admin");
  });
});

describe("ROLE_LABEL", () => {
  it("has a Bahasa Indonesia label for every role", () => {
    for (const role of ALL_AKADEMIK_ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
  });
});

describe("useAkademikRole", () => {
  it("derives roles + primary + flags from the session", () => {
    mockedUseSession.mockReturnValue({ roles: ["guru", "kepala_sekolah"] } as never);
    const { result } = renderHook(() => useAkademikRole());
    expect(new Set(result.current.roles)).toEqual(new Set<AkademikRole>(["guru", "kepala"]));
    expect(result.current.primary).toBe("kepala");
    expect(result.current.isGuru).toBe(true);
    expect(result.current.isKepala).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("falls back to all roles when the session has no roles", () => {
    mockedUseSession.mockReturnValue({ roles: [] } as never);
    const { result } = renderHook(() => useAkademikRole());
    expect(new Set(result.current.roles)).toEqual(new Set(ALL_AKADEMIK_ROLES));
    expect(result.current.primary).toBe("admin");
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isGuru).toBe(true);
    expect(result.current.isKepala).toBe(true);
  });

  it("falls back to all roles when no Frappe role matches an academic bucket", () => {
    mockedUseSession.mockReturnValue({ roles: ["pustakawan", "satpam"] } as never);
    const { result } = renderHook(() => useAkademikRole());
    expect(new Set(result.current.roles)).toEqual(new Set(ALL_AKADEMIK_ROLES));
  });

  it("falls back to all roles when useSession throws (no provider mounted)", () => {
    // mockImplementationOnce (not mockImplementation): a persistent throwing mock
    // surfaces as a deferred unhandled rejection in vitest even though the hook
    // catches it. One-shot keeps the throw scoped to this render.
    mockedUseSession.mockImplementationOnce(() => {
      throw new Error("no SessionProvider");
    });
    const { result } = renderHook(() => useAkademikRole());
    expect(new Set(result.current.roles)).toEqual(new Set(ALL_AKADEMIK_ROLES));
    expect(result.current.primary).toBe("admin");
  });
});
