/**
 * Unit test for the Asesmen tenant resolver.
 *
 * Covers AKA-11: the create-test flow must never POST without a `sekolah`
 * (multi-tenant scope). The resolver prefers the session school but falls back
 * to the route param so a not-yet-hydrated session does not drop the tenant.
 */
import { describe, it, expect, vi } from "vitest";

// The route module pulls in the api-client / auth stores at import scope; stub
// them so importing it for one pure helper has no side effects.
vi.mock("@sekolahpro/api-client", () => ({
  createResource: vi.fn(),
  listResource: vi.fn().mockResolvedValue([]),
  useResourceList: vi.fn(() => ({ data: [], isLoading: false })),
}));
vi.mock("@sekolahpro/auth", () => ({ useSessionStore: vi.fn(() => undefined) }));

import { resolveAsesmenTenant } from "../sch.$sekolah.akademik.$ta.asesmen.index";

describe("resolveAsesmenTenant", () => {
  it("prefers the explicit session school", () => {
    expect(resolveAsesmenTenant("SEK-AKTIF", "SEK-URL")).toBe("SEK-AKTIF");
  });

  it("falls back to the route param when the session school is missing", () => {
    expect(resolveAsesmenTenant(undefined, "SEK-URL")).toBe("SEK-URL");
    expect(resolveAsesmenTenant("", "SEK-URL")).toBe("SEK-URL");
  });

  it("returns null only when neither source is available", () => {
    expect(resolveAsesmenTenant(undefined, "")).toBeNull();
  });
});
