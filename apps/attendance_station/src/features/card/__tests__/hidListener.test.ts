// ABS-002
import { describe, expect, it } from "vitest";

import { classifyKeystrokeTiming } from "../hidListener";

describe("classifyKeystrokeTiming", () => {
  it("classifies fast bursts as a reader", () => {
    // ABS-002 | median 10ms <= 50ms threshold
    expect(classifyKeystrokeTiming([10, 12, 9])).toBe("reader");
  });

  it("classifies slow gaps as human", () => {
    // ABS-002 | median 200ms > 50ms threshold
    expect(classifyKeystrokeTiming([200, 180, 300])).toBe("human");
  });

  it("treats no timing signal as human", () => {
    // ABS-002 | empty deltas (0-1 keystroke) lack signal -> human
    expect(classifyKeystrokeTiming([])).toBe("human");
  });
});
