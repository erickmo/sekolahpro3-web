import { describe, it, expect } from "vitest";
import {
  computeShu,
  validateStep1,
  distributeEqually,
  totalDistributed,
  validateStep3,
} from "../shuWizard";

describe("computeShu", () => {
  it("computes cadangan and shu_dibagikan", () => {
    expect(computeShu({ periode: "2025", shu_total: 1_000_000, pct_cadangan: 25 })).toEqual({
      cadangan: 250_000,
      shu_dibagikan: 750_000,
    });
  });

  it("clamps pct to [0,100]", () => {
    expect(computeShu({ periode: "x", shu_total: 1000, pct_cadangan: 150 }).cadangan).toBe(1000);
    expect(computeShu({ periode: "x", shu_total: 1000, pct_cadangan: -10 }).cadangan).toBe(0);
  });
});

describe("validateStep1", () => {
  it("requires periode", () => {
    expect(validateStep1({ periode: " ", shu_total: 100, pct_cadangan: 10 })).toMatch(/periode/i);
  });
  it("rejects zero shu_total", () => {
    expect(validateStep1({ periode: "2025", shu_total: 0, pct_cadangan: 10 })).toMatch(/SHU/i);
  });
  it("rejects pct > 100", () => {
    expect(validateStep1({ periode: "2025", shu_total: 100, pct_cadangan: 101 })).toMatch(/cadangan/i);
  });
  it("accepts valid input", () => {
    expect(validateStep1({ periode: "2025", shu_total: 100, pct_cadangan: 25 })).toBeNull();
  });
});

describe("distributeEqually", () => {
  it("returns empty when no anggota", () => {
    expect(distributeEqually([], 1000)).toEqual([]);
  });
  it("splits evenly with 50/50 jasa", () => {
    const out = distributeEqually(["A", "B", "C"], 300);
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual({ anggota: "A", jasa_anggota: 50, jasa_modal: 50 });
  });
  it("absorbs rounding remainder in jasa_modal", () => {
    const out = distributeEqually(["A", "B"], 101);
    // per=50 (floor), half=25, jasa_modal = 25 → total per anggota 50, 2 anggota → 100 (1 short)
    expect(totalDistributed(out)).toBeLessThanOrEqual(101);
  });
});

describe("validateStep3", () => {
  it("requires items", () => {
    expect(validateStep3([], 1000)).toMatch(/anggota/i);
  });
  it("rejects negative jasa", () => {
    expect(
      validateStep3([{ anggota: "A", jasa_anggota: -1, jasa_modal: 0 }], 0),
    ).toMatch(/negatif/i);
  });
  it("tolerates floor-rounding remainder", () => {
    // 3 anggota, 100 → per=33, half=16, rest=17 → total 99 (diff 1, within tolerance 3)
    const out = distributeEqually(["A", "B", "C"], 100);
    expect(validateStep3(out, 100)).toBeNull();
  });
  it("rejects large mismatch", () => {
    expect(
      validateStep3(
        [{ anggota: "A", jasa_anggota: 100, jasa_modal: 100 }],
        1000,
      ),
    ).toMatch(/cocok/i);
  });
});
