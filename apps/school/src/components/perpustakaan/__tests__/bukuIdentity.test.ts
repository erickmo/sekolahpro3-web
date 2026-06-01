// PERP-GAP-01 | ADR: PERP-ADR-0001
import { describe, it, expect } from "vitest";
import { bukuRouteParam, bukuEnrichIsbn } from "../bukuIdentity";

describe("bukuRouteParam", () => {
  it("returns the docname even when an isbn is present (PERP-GAP-01)", () => {
    // Regression guard: the catalog used to navigate by `isbn ?? name`, which
    // 404s every book that HAS an isbn because the detail page resolves by docname.
    expect(bukuRouteParam({ name: "BUKU-0001", isbn: "978-602-1234-56-7" })).toBe("BUKU-0001");
  });

  it("returns the docname when isbn is absent", () => {
    expect(bukuRouteParam({ name: "BUKU-0002" })).toBe("BUKU-0002");
  });
});

describe("bukuEnrichIsbn", () => {
  it("prefers the resolved document's isbn over the route param", () => {
    expect(bukuEnrichIsbn("BUKU-0001", { isbn: "978-1" })).toBe("978-1");
  });

  it("falls back to the route param when there is no doc or isbn", () => {
    expect(bukuEnrichIsbn("978-1")).toBe("978-1");
    expect(bukuEnrichIsbn("978-1", {})).toBe("978-1");
  });
});
