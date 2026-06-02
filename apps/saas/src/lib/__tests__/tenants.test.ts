import { describe, it, expect } from "vitest";
import {
  orgStatusTone,
  langgananStatusTone,
  resolveTenantDomain,
  latestLangganan,
  type LanggananRow,
} from "../tenants";

describe("orgStatusTone", () => {
  it("maps Aktif to success, everything else to neutral", () => {
    expect(orgStatusTone("Aktif")).toBe("success");
    expect(orgStatusTone("Nonaktif")).toBe("neutral");
    expect(orgStatusTone(undefined)).toBe("neutral");
  });
});

describe("langgananStatusTone", () => {
  it("maps subscription status to tone", () => {
    expect(langgananStatusTone("Aktif")).toBe("success");
    expect(langgananStatusTone("Kadaluarsa")).toBe("danger");
    expect(langgananStatusTone("Dibatalkan")).toBe("neutral");
    expect(langgananStatusTone(undefined)).toBe("neutral");
  });
});

describe("resolveTenantDomain", () => {
  it("prefers custom_domain over subdomain", () => {
    expect(resolveTenantDomain({ custom_domain: "sma.id", subdomain: "sma" })).toBe("sma.id");
  });
  it("falls back to subdomain, then em-dash", () => {
    expect(resolveTenantDomain({ subdomain: "sma" })).toBe("sma");
    expect(resolveTenantDomain({})).toBe("—");
  });
});

describe("latestLangganan", () => {
  const aktif: LanggananRow = { name: "L-2", status: "Aktif", tanggal_mulai: "2026-01-01" };
  const expired: LanggananRow = { name: "L-3", status: "Kadaluarsa", tanggal_mulai: "2026-06-01" };
  const cancelled: LanggananRow = { name: "L-1", status: "Dibatalkan", tanggal_mulai: "2025-01-01" };

  it("returns null for empty/undefined", () => {
    expect(latestLangganan(undefined)).toBeNull();
    expect(latestLangganan([])).toBeNull();
  });
  it("prefers an Aktif row over a newer non-active one", () => {
    // rows ordered tanggal_mulai desc: newest (expired) first, active second.
    expect(latestLangganan([expired, aktif, cancelled])).toBe(aktif);
  });
  it("falls back to the newest row when none are Aktif", () => {
    expect(latestLangganan([expired, cancelled])).toBe(expired);
  });
});
