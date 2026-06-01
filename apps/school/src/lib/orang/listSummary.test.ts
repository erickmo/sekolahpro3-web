import { describe, it, expect } from "vitest";
import {
  countBy,
  toSummary,
  isFirstRunEmpty,
  type SummaryItem,
} from "./listSummary";

type Row = { name: string; status?: string; jenjang?: string };

const rows: Row[] = [
  { name: "A", status: "Aktif", jenjang: "SD" },
  { name: "B", status: "Aktif", jenjang: "SD" },
  { name: "C", status: "Calon", jenjang: "SMP" },
  { name: "D", status: "", jenjang: "SMP" }, // blank status -> Lainnya
  { name: "E" }, // missing status -> Lainnya
];

describe("countBy", () => {
  it("returns {} for empty input", () => {
    expect(countBy([], "status")).toEqual({});
  });

  it("tallies a present string field", () => {
    const c = countBy(rows, "status");
    expect(c.Aktif).toBe(2);
    expect(c.Calon).toBe(1);
  });

  it("buckets missing and blank values into 'Lainnya'", () => {
    const c = countBy(rows, "status");
    expect(c.Lainnya).toBe(2); // D (blank) + E (missing)
  });

  it("counts always sum to the row count", () => {
    const c = countBy(rows, "status");
    const sum = Object.values(c).reduce((a, b) => a + b, 0);
    expect(sum).toBe(rows.length);
  });

  it("never throws on rows missing the field entirely", () => {
    expect(() => countBy([{ name: "x" }], "status")).not.toThrow();
    expect(countBy([{ name: "x" }], "status")).toEqual({ Lainnya: 1 });
  });

  it("works with a keyof field as well as a string field name", () => {
    const c = countBy(rows, "jenjang");
    expect(c.SD).toBe(2);
    expect(c.SMP).toBe(2);
    expect(c.Lainnya).toBe(1);
  });
});

describe("toSummary", () => {
  const counts = { Aktif: 2, Calon: 1, Lainnya: 2 };

  it("returns [] for empty counts", () => {
    expect(toSummary({})).toEqual([]);
  });

  it("maps each count entry to a SummaryItem with label + value", () => {
    const items = toSummary(counts);
    const aktif = items.find((i) => i.label === "Aktif");
    expect(aktif?.value).toBe(2);
    expect(items).toHaveLength(3);
  });

  it("places ordered keys first, then the remaining keys", () => {
    const items = toSummary(counts, ["Calon", "Aktif"]);
    expect(items.map((i) => i.label)).toEqual(["Calon", "Aktif", "Lainnya"]);
  });

  it("skips ordered keys that are not present in counts", () => {
    const items = toSummary(counts, ["Alumni", "Aktif"]);
    expect(items.map((i) => i.label)).toEqual(["Aktif", "Calon", "Lainnya"]);
  });

  it("applies tones from the tone map; undefined when unmapped", () => {
    const items = toSummary(counts, ["Aktif"], { Aktif: "emerald" });
    const aktif = items.find((i) => i.label === "Aktif");
    const calon = items.find((i) => i.label === "Calon");
    expect(aktif?.tone).toBe("emerald");
    expect(calon?.tone).toBeUndefined();
  });
});

describe("isFirstRunEmpty", () => {
  const base = {
    isLoading: false,
    isError: false,
    rowCount: 0,
    hasSearch: false,
    hasActiveFilter: false,
  };

  it("is true ONLY for a truly empty, unfiltered, loaded list", () => {
    expect(isFirstRunEmpty(base)).toBe(true);
  });

  it("is false while loading", () => {
    expect(isFirstRunEmpty({ ...base, isLoading: true })).toBe(false);
  });

  it("is false on error", () => {
    expect(isFirstRunEmpty({ ...base, isError: true })).toBe(false);
  });

  it("is false when rows exist", () => {
    expect(isFirstRunEmpty({ ...base, rowCount: 5 })).toBe(false);
  });

  it("is false when a search term is active (filtered-empty case)", () => {
    expect(isFirstRunEmpty({ ...base, hasSearch: true })).toBe(false);
  });

  it("is false when a select filter is active (filtered-empty case)", () => {
    expect(isFirstRunEmpty({ ...base, hasActiveFilter: true })).toBe(false);
  });
});

// Type-level sanity: SummaryItem tone domain stays a closed union.
const _toneCheck: SummaryItem["tone"] = "neutral";
void _toneCheck;
