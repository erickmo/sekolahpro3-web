import { describe, it, expect } from "vitest";
import { isActive } from "../GroupedNavTabs";

describe("GroupedNavTabs isActive", () => {
  const dash = "/sch/$sekolah/master";

  it("exact match only when exact=true", () => {
    expect(isActive(dash, dash, true)).toBe(true);
    expect(isActive(dash + "/kkm", dash, true)).toBe(false);
  });

  it("prefix match lights parent on nested routes when not exact", () => {
    const mapel = "/sch/$sekolah/master/mapel";
    expect(isActive(mapel, mapel)).toBe(true);
    expect(isActive(mapel + "/BIO-01", mapel)).toBe(true);
  });

  it("does not light dashboard on sibling routes", () => {
    // Regression: exact dashboard must not match every /master/* route.
    expect(isActive("/sch/$sekolah/master/kkm", dash, true)).toBe(false);
  });

  it("does not partial-match unrelated prefixes", () => {
    expect(isActive("/sch/$sekolah/master/kkm", "/sch/$sekolah/master/kurikulum")).toBe(false);
  });
});
