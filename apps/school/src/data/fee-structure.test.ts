import { describe, it, expect } from "vitest";
import { summarizePreview, mergeSummaries, type GenerateSummary } from "./fee-structure";

describe("summarizePreview", () => {
  it("totals count and amount across components", () => {
    const s: GenerateSummary = {
      created: 3,
      skipped: 1,
      total_amount: 350000,
      by_component: [
        { nama: "SPP", count: 2, amount: 200000 },
        { nama: "Seragam", count: 1, amount: 150000 },
      ],
      warnings: [],
      errors: [],
    };
    const r = summarizePreview(s);
    expect(r.totalSiswa).toBe(3);
    expect(r.totalRupiah).toBe(350000);
    expect(r.lines).toHaveLength(2);
  });
});

describe("mergeSummaries", () => {
  it("sums counts/amounts and concatenates lines + warnings", () => {
    const a: GenerateSummary = {
      created: 2,
      skipped: 0,
      total_amount: 200000,
      by_component: [{ nama: "SPP", count: 2, amount: 200000 }],
      warnings: ["w1"],
      errors: [],
    };
    const b: GenerateSummary = {
      created: 1,
      skipped: 3,
      total_amount: 150000,
      by_component: [{ nama: "Seragam", count: 1, amount: 150000 }],
      warnings: [],
      errors: ["e1"],
    };
    const m = mergeSummaries([a, b]);
    expect(m.created).toBe(3);
    expect(m.skipped).toBe(3);
    expect(m.total_amount).toBe(350000);
    expect(m.by_component).toHaveLength(2);
    expect(m.warnings).toEqual(["w1"]);
    expect(m.errors).toEqual(["e1"]);
  });

  it("returns an empty summary for no inputs", () => {
    expect(mergeSummaries([])).toEqual({
      created: 0,
      skipped: 0,
      total_amount: 0,
      by_component: [],
      warnings: [],
      errors: [],
    });
  });
});
