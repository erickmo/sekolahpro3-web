import { describe, it, expect, vi, beforeEach } from "vitest";
import { deriveRoles } from "../sessionRole";

vi.mock("@sekolahpro/auth", () => ({ useSession: vi.fn() }));
import { useSession } from "@sekolahpro/auth";

import {
  ROLE_LABEL,
  PERPUS_ROLE_CONFIG,
  usePerpustakaanRole,
  type PerpustakaanRole,
} from "../perpustakaanRole";

const ALL: PerpustakaanRole[] = ["petugas", "pustakawan", "admin"];

describe("perpustakaanRole config", () => {
  it("has a Bahasa Indonesia label for every role", () => {
    for (const role of ALL) {
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
    expect(ROLE_LABEL.petugas).toMatch(/sirkulasi/i);
  });

  it("maps head-librarian roles to pustakawan", () => {
    expect(deriveRoles(["Kepala Perpustakaan"], PERPUS_ROLE_CONFIG).primary).toBe("pustakawan");
    expect(deriveRoles(["Pustakawan"], PERPUS_ROLE_CONFIG).primary).toBe("pustakawan");
  });

  it("maps circulation-desk roles to petugas", () => {
    expect(deriveRoles(["Petugas Perpustakaan"], PERPUS_ROLE_CONFIG).primary).toBe("petugas");
    expect(deriveRoles(["Operator Sirkulasi"], PERPUS_ROLE_CONFIG).primary).toBe("petugas");
  });

  it("maps admin roles to admin", () => {
    expect(deriveRoles(["Admin Sekolah"], PERPUS_ROLE_CONFIG).primary).toBe("admin");
  });

  it("defaults primary to petugas (circulation-staff POV) when nothing matches", () => {
    const res = deriveRoles(["Totally Unknown"], PERPUS_ROLE_CONFIG);
    expect(new Set(res.roles)).toEqual(new Set(ALL));
    expect(res.primary).toBe("petugas");
  });
});

describe("usePerpustakaanRole", () => {
  beforeEach(() => vi.mocked(useSession).mockReset());

  it("returns permissive fallback when session provider is missing", () => {
    vi.mocked(useSession).mockImplementationOnce(() => {
      throw new Error("no provider");
    });
    const info = usePerpustakaanRole();
    expect(new Set(info.roles)).toEqual(new Set(ALL));
    expect(info.primary).toBe("petugas");
    expect(info.isPetugas).toBe(true);
  });

  it("derives roles + flags from the session", () => {
    vi.mocked(useSession).mockReturnValue({ roles: ["Kepala Perpustakaan"] } as unknown as ReturnType<typeof useSession>);
    const info = usePerpustakaanRole();
    expect(info.primary).toBe("pustakawan");
    expect(info.isPustakawan).toBe(true);
    expect(info.isAdmin).toBe(false);
  });
});
