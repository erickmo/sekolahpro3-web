// PERP-GAP-03
import { describe, it, expect } from "vitest";
import { resolveSegmentPath, isSegmentActive } from "../inventarisNav";

const OPNAME = "/sch/$sekolah/perpustakaan/inventaris/opname";

describe("resolveSegmentPath", () => {
  it("substitutes the active school slug for $sekolah", () => {
    expect(resolveSegmentPath(OPNAME, "sdn-1")).toBe(
      "/sch/sdn-1/perpustakaan/inventaris/opname",
    );
  });
});

describe("isSegmentActive", () => {
  it("matches the resolved exact path", () => {
    expect(isSegmentActive("/sch/sdn-1/perpustakaan/inventaris/opname", OPNAME, "sdn-1")).toBe(true);
  });

  it("matches a nested child path", () => {
    expect(isSegmentActive("/sch/sdn-1/perpustakaan/inventaris/opname/OPN-1", OPNAME, "sdn-1")).toBe(true);
  });

  it("does not match a different segment", () => {
    expect(isSegmentActive("/sch/sdn-1/perpustakaan/inventaris/berita-acara", OPNAME, "sdn-1")).toBe(false);
  });

  it("never matches when comparing against the raw $sekolah template (regression guard)", () => {
    // The old code compared the live pathname against the unresolved template.
    expect(isSegmentActive(OPNAME, OPNAME, "sdn-1")).toBe(false);
  });
});
