// PERP-GAP-08 | PERP-GAP-09 | PERP-GAP-16
import { describe, it, expect } from "vitest";
import { perpMonthRange, perpFormatDate } from "../perpFormatters";

describe("perpFormatDate", () => {
  it("returns an em-dash for empty input", () => {
    expect(perpFormatDate(undefined)).toBe("—");
    expect(perpFormatDate(null)).toBe("—");
    expect(perpFormatDate("")).toBe("—");
  });

  it("formats a valid ISO date instead of echoing the raw value (PERP-GAP-09)", () => {
    const out = perpFormatDate("2026-05-25");
    expect(out).not.toBe("2026-05-25");
    expect(out).toContain("2026");
  });

  it("returns unparseable input unchanged", () => {
    expect(perpFormatDate("bukan-tanggal")).toBe("bukan-tanggal");
  });
});

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
