// PERP-GAP-08 | PERP-GAP-09 | PERP-GAP-16
import { describe, it, expect } from "vitest";
import { perpMonthRange, perpFormatDate, perpFormatRupiah } from "../perpFormatters";

describe("perpFormatRupiah", () => {
  it("formats a finite number in id-ID with an Rp prefix", () => {
    expect(perpFormatRupiah(5000)).toBe("Rp 5.000");
    expect(perpFormatRupiah(0)).toBe("Rp 0");
  });

  it("returns an em-dash for null/undefined/NaN/Infinity (PERP-GAP-24)", () => {
    expect(perpFormatRupiah(undefined)).toBe("—");
    expect(perpFormatRupiah(null)).toBe("—");
    expect(perpFormatRupiah(NaN)).toBe("—");
    expect(perpFormatRupiah(Infinity)).toBe("—");
  });
});

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
