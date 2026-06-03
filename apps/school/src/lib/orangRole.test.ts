/**
 * Unit tests for the people-domain (Orang) role helper.
 *
 * Covers role-string normalization + Frappe→bucket mapping (via the generic
 * deriveRoles engine driven by ORANG_ROLE_CONFIG), primary-role priority, and
 * the permissive fallback behaviour of the `useOrangRole` hook (no provider /
 * empty roles / unmatched roles).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useSession } from "@sekolahpro/auth";
import { deriveRoles } from "./sessionRole";
import {
  ORANG_ROLE_CONFIG,
  ROLE_LABEL,
  useOrangRole,
  type OrangRole,
} from "./orangRole";

// `useOrangRole` reads the auth session; mock it so we control the roles it sees
// (including the "no provider" case where useSession throws).
vi.mock("@sekolahpro/auth", () => ({ useSession: vi.fn() }));
const mockedUseSession = vi.mocked(useSession);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ALL_ORANG_ROLES = new Set<OrangRole>(ORANG_ROLE_CONFIG.allRoles);

describe("ORANG_ROLE_CONFIG mapping (via deriveRoles)", () => {
  const derive = (roles: string[]) => deriveRoles(roles, ORANG_ROLE_CONFIG);

  it("maps tata-usaha-ish roles to tata_usaha", () => {
    expect(derive(["tata_usaha"]).roles).toEqual(["tata_usaha"]);
    expect(derive(["kesiswaan"]).roles).toEqual(["tata_usaha"]);
    expect(derive(["kepegawaian"]).roles).toEqual(["tata_usaha"]);
    expect(derive(["operator"]).roles).toEqual(["tata_usaha"]);
  });

  it("maps leadership roles to pimpinan", () => {
    expect(derive(["kepala_sekolah"]).roles).toEqual(["pimpinan"]);
    expect(derive(["wakil_kepala"]).roles).toEqual(["pimpinan"]);
    expect(derive(["pimpinan"]).roles).toEqual(["pimpinan"]);
  });

  it("maps admin-ish roles to admin", () => {
    expect(derive(["admin_sekolah"]).roles).toEqual(["admin"]);
    expect(derive(["super_admin"]).roles).toEqual(["admin"]);
    expect(derive(["admin"]).roles).toEqual(["admin"]);
  });

  it("normalizes spacing and dashes (Kepala Sekolah / kepala-sekolah)", () => {
    expect(derive(["Kepala Sekolah"]).roles).toEqual(["pimpinan"]);
    expect(derive(["kepala-sekolah"]).roles).toEqual(["pimpinan"]);
  });

  it("does NOT false-match the dropped bare 'tu' needle", () => {
    // "bantuan" / "santunan" normalize to themselves and must map to nothing,
    // so the permissive fallback (all roles) is returned, not tata_usaha only.
    expect(new Set(derive(["bantuan", "santunan"]).roles)).toEqual(ALL_ORANG_ROLES);
  });

  it("collects a deduped set across multiple roles", () => {
    const { roles } = derive(["kesiswaan", "kepala_sekolah", "kesiswaan"]);
    expect(new Set(roles)).toEqual(new Set<OrangRole>(["tata_usaha", "pimpinan"]));
  });
});

describe("primary-role priority", () => {
  const derive = (roles: string[]) => deriveRoles(roles, ORANG_ROLE_CONFIG);

  it("pimpinan wins over admin and tata_usaha", () => {
    expect(derive(["operator", "admin", "kepala_sekolah"]).primary).toBe("pimpinan");
  });

  it("admin wins over tata_usaha", () => {
    expect(derive(["operator", "admin_sekolah"]).primary).toBe("admin");
  });

  it("returns tata_usaha when it is the only role", () => {
    expect(derive(["kesiswaan"]).primary).toBe("tata_usaha");
  });
});

describe("ROLE_LABEL", () => {
  it("has a Bahasa Indonesia label for every role", () => {
    for (const role of ORANG_ROLE_CONFIG.allRoles) {
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
  });
});

describe("useOrangRole", () => {
  it("derives roles + primary + flags from the session", () => {
    mockedUseSession.mockReturnValue({ roles: ["kesiswaan", "kepala_sekolah"] } as never);
    const { result } = renderHook(() => useOrangRole());
    expect(new Set(result.current.roles)).toEqual(new Set<OrangRole>(["tata_usaha", "pimpinan"]));
    expect(result.current.primary).toBe("pimpinan");
    expect(result.current.isTataUsaha).toBe(true);
    expect(result.current.isPimpinan).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("falls back to all roles when the session has no roles", () => {
    mockedUseSession.mockReturnValue({ roles: [] } as never);
    const { result } = renderHook(() => useOrangRole());
    expect(new Set(result.current.roles)).toEqual(ALL_ORANG_ROLES);
    expect(result.current.primary).toBe("tata_usaha");
  });

  it("falls back to all roles when no Frappe role matches a bucket", () => {
    mockedUseSession.mockReturnValue({ roles: ["pustakawan", "satpam"] } as never);
    const { result } = renderHook(() => useOrangRole());
    expect(new Set(result.current.roles)).toEqual(ALL_ORANG_ROLES);
  });

  it("falls back to all roles when useSession throws (no provider mounted)", () => {
    // mockImplementationOnce (not mockImplementation): a persistent throwing mock
    // surfaces as a deferred unhandled rejection in vitest even though the hook
    // catches it. One-shot keeps the throw scoped to this render.
    mockedUseSession.mockImplementationOnce(() => {
      throw new Error("no SessionProvider");
    });
    const { result } = renderHook(() => useOrangRole());
    expect(new Set(result.current.roles)).toEqual(ALL_ORANG_ROLES);
    expect(result.current.primary).toBe("tata_usaha");
  });
});
