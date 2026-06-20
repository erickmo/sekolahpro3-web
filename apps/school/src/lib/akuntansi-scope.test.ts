import { describe, it, expect } from "vitest";
import { withCompanyFilter, efakturScopeFilter } from "./akuntansi-scope";

describe("withCompanyFilter", () => {
  it("appends a company filter when none is present", () => {
    expect(withCompanyFilter(undefined, "SD Aletheia")).toEqual([["company", "=", "SD Aletheia"]]);
  });

  it("returns filters untouched when company is empty", () => {
    const base = [["status", "=", "Draft"]] as never;
    expect(withCompanyFilter(base, "")).toBe(base);
  });

  it("does not duplicate an existing company filter", () => {
    const base = [["company", "=", "X"]] as never;
    expect(withCompanyFilter(base, "Y")).toBe(base);
  });
});

describe("efakturScopeFilter", () => {
  it("scopes e-Faktur to the company's tax periods via the tax_period link", () => {
    // e-Faktur Export has no `company` field, so it is scoped indirectly
    // through its tax_period link (Tax Period IS company-scoped).
    const f = efakturScopeFilter("SD Aletheia", ["PPN-2026-05", "PPN-2026-06"]);
    expect(f).toEqual([["tax_period", "in", ["PPN-2026-05", "PPN-2026-06"]]]);
  });

  it("yields an empty in-list when the company has no tax periods (no exports shown)", () => {
    expect(efakturScopeFilter("SD Aletheia", [])).toEqual([["tax_period", "in", []]]);
  });

  it("returns no filter when no company is active (admin context sees all)", () => {
    expect(efakturScopeFilter("", ["PPN-2026-05"])).toEqual([]);
  });
});
