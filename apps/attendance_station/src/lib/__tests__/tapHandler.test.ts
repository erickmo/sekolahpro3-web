// ABS-002
import { describe, expect, it } from "vitest";

import { isDuplicate, nextDirection } from "../tapHandler";

const WINDOW_SEC = 5;

describe("isDuplicate", () => {
  it("flags the same subject tapped again within the window", () => {
    // ABS-002 | same subject, 3s apart <= 5s window
    const prev = { subjectId: "S1", at: 100 };
    const next = { subjectId: "S1", at: 103 };
    expect(isDuplicate(prev, next, WINDOW_SEC)).toBe(true);
  });

  it("does not flag the same subject after the window", () => {
    // ABS-002 | same subject, 10s apart > 5s window
    const prev = { subjectId: "S1", at: 100 };
    const next = { subjectId: "S1", at: 110 };
    expect(isDuplicate(prev, next, WINDOW_SEC)).toBe(false);
  });

  it("does not flag a different subject within the window", () => {
    // ABS-002 | distinct subjects are never duplicates
    const prev = { subjectId: "S1", at: 100 };
    const next = { subjectId: "S2", at: 102 };
    expect(isDuplicate(prev, next, WINDOW_SEC)).toBe(false);
  });
});

describe("nextDirection", () => {
  it("toggles in->out in gate mode", () => {
    // ABS-002 | gate mode alternates direction
    expect(nextDirection("gate", "in")).toBe("out");
  });

  it("toggles out->in in gate mode", () => {
    expect(nextDirection("gate", "out")).toBe("in");
  });

  it("defaults to in for a first gate tap (null last)", () => {
    expect(nextDirection("gate", null)).toBe("in");
  });

  it("always returns in for classroom mode", () => {
    expect(nextDirection("classroom", "in")).toBe("in");
    expect(nextDirection("classroom", "out")).toBe("in");
  });

  it("always returns in for event mode", () => {
    expect(nextDirection("event", "out")).toBe("in");
    expect(nextDirection("event", null)).toBe("in");
  });
});
