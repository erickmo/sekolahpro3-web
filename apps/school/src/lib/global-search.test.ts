import { describe, it, expect } from "vitest";
import { financeActions, globalSearch, groupHitsByCategory } from "./global-search";

describe("financeActions (⌘K finance route+action provider)", () => {
  it("matches a tax verb to its deep route", () => {
    const hits = financeActions("with");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.category).toBe("Keuangan");
    expect(hits[0]!.href.endsWith("/akuntansi/pajak/withholding")).toBe(true);
  });

  it("matches a create verb to a /new route", () => {
    const hits = financeActions("jurnal baru");
    expect(hits.some((h) => h.href.endsWith("/akuntansi/buku-besar/jurnal/new"))).toBe(true);
  });

  it("maps 'tutup' to the period-close page (plain route, no query string)", () => {
    const hits = financeActions("tutup");
    expect(hits.some((h) => h.href.endsWith("/akuntansi/referensi/period"))).toBe(true);
    for (const h of hits) expect(h.href.includes("?")).toBe(false);
  });

  it("returns nothing below the minimum query length", () => {
    expect(financeActions("a")).toEqual([]);
  });
});

describe("globalSearch + grouping include finance", () => {
  it("surfaces finance actions in the global palette", () => {
    const hits = globalSearch("withholding");
    expect(hits.some((h) => h.category === "Keuangan")).toBe(true);
  });

  it("orders the Keuangan category first when present", () => {
    const groups = groupHitsByCategory(globalSearch("spt ppn"));
    expect(groups[0]?.category).toBe("Keuangan");
  });

  it("returns no results for a non-matching short query", () => {
    expect(globalSearch("zz")).toEqual([]);
  });
});
