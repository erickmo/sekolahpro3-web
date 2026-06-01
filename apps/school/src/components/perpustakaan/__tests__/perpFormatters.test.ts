// PERP-GAP-08 | PERP-GAP-09 | PERP-GAP-16
import { describe, it, expect } from "vitest";
import { perpMonthRange } from "../perpFormatters";

describe("perpMonthRange", () => {
  it("returns the month start and the next month's start", () => {
    expect(perpMonthRange("2026-05-25")).toEqual({ start: "2026-05-01", nextStart: "2026-06-01" });
  });

  it("rolls over December into the next year", () => {
    expect(perpMonthRange("2026-12-10")).toEqual({ start: "2026-12-01", nextStart: "2027-01-01" });
  });

  it("zero-pads single-digit months", () => {
    expect(perpMonthRange("2026-09-01")).toEqual({ start: "2026-09-01", nextStart: "2026-10-01" });
  });
});
