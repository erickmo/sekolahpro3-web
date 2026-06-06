// ABS-002
import { describe, expect, it } from "vitest";

import { withinSkew } from "../time";

describe("withinSkew", () => {
  it("returns true when difference is within tolerance", () => {
    // ABS-002 | 30s gap <= 60s tolerance
    expect(withinSkew(1000, 1030, 60)).toBe(true);
  });

  it("returns false when difference exceeds tolerance", () => {
    // ABS-002 | 100s gap > 60s tolerance
    expect(withinSkew(1000, 1100, 60)).toBe(false);
  });
});
