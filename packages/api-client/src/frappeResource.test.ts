import { describe, it, expect } from "vitest";
import { isTenantedDoctype, qualifyOrderBy } from "./frappeResource";

describe("TENANT_BLOCKLIST — vernon_ads doctypes are global", () => {
  const adsDoctypes = [
    "Property", "Property Group", "Ad Slot", "Campaign",
    "Ad Creative", "Ad Event", "Ads Customer",
  ];
  it("none of the ads doctypes are tenant-scoped", () => {
    for (const dt of adsDoctypes) {
      expect(isTenantedDoctype(dt)).toBe(false);
    }
  });
});

describe("qualifyOrderBy — disambiguate order_by under a child-table JOIN", () => {
  it("qualifies a bare ambiguous column when a dotted child field is requested", () => {
    // roles.role forces a JOIN; bare `modified` is ambiguous (MariaDB 1052).
    expect(qualifyOrderBy("Pegawai", ["name", "roles.role"], "modified desc")).toBe(
      "`tabPegawai`.modified desc",
    );
  });

  it("qualifies a bare column with no direction", () => {
    expect(qualifyOrderBy("Pegawai", ["roles.role"], "nama_lengkap")).toBe(
      "`tabPegawai`.nama_lengkap",
    );
  });

  it("leaves order_by untouched when no field is dotted", () => {
    expect(qualifyOrderBy("Pegawai", ["name", "nama_lengkap"], "modified desc")).toBe(
      "modified desc",
    );
  });

  it("leaves an already-qualified column untouched even with a dotted field", () => {
    expect(qualifyOrderBy("Pegawai", ["roles.role"], "`tabPegawai`.modified desc")).toBe(
      "`tabPegawai`.modified desc",
    );
  });

  it("qualifies every bare segment of a multi-column order_by", () => {
    expect(qualifyOrderBy("Pegawai", ["roles.role"], "status_kepegawaian asc, modified desc")).toBe(
      "`tabPegawai`.status_kepegawaian asc, `tabPegawai`.modified desc",
    );
  });
});
