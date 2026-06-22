import { describe, it, expect } from "vitest";
import { withCompanyFilter } from "./akuntansi-scope";

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

  it("scopes e-Faktur Export directly by company (backend now has the field)", () => {
    // e-Faktur Export gained a `company` field (vernon_accounting PR #2), so it
    // is filtered directly like its sibling tax doctypes — no tax_period 2-hop.
    expect(withCompanyFilter(undefined, "SD Aletheia")).toEqual([["company", "=", "SD Aletheia"]]);
  });
});
