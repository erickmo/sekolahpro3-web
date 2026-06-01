/**
 * Unit tests for predikatFromKehadiran (EKS-13). Boundary-focused: the thresholds
 * are the whole point, so each band edge is asserted explicitly.
 */
import { describe, it, expect } from "vitest";
import {
  predikatFromKehadiran,
  PREDIKAT_SANGAT_BAIK,
  PREDIKAT_BAIK,
  PREDIKAT_CUKUP,
  PREDIKAT_KURANG,
  ALL_PREDIKAT,
} from "./predikatFromKehadiran";

describe("predikatFromKehadiran", () => {
  it("returns Sangat Baik at and above 90", () => {
    expect(predikatFromKehadiran(100)).toBe(PREDIKAT_SANGAT_BAIK);
    expect(predikatFromKehadiran(90)).toBe(PREDIKAT_SANGAT_BAIK);
  });

  it("returns Baik in [75, 90)", () => {
    expect(predikatFromKehadiran(89.99)).toBe(PREDIKAT_BAIK);
    expect(predikatFromKehadiran(75)).toBe(PREDIKAT_BAIK);
  });

  it("returns Cukup in [50, 75)", () => {
    expect(predikatFromKehadiran(74.99)).toBe(PREDIKAT_CUKUP);
    expect(predikatFromKehadiran(50)).toBe(PREDIKAT_CUKUP);
  });

  it("returns Kurang below 50", () => {
    expect(predikatFromKehadiran(49.99)).toBe(PREDIKAT_KURANG);
    expect(predikatFromKehadiran(0)).toBe(PREDIKAT_KURANG);
  });

  it("exposes all four predikat in display order", () => {
    expect(ALL_PREDIKAT).toEqual([
      PREDIKAT_SANGAT_BAIK,
      PREDIKAT_BAIK,
      PREDIKAT_CUKUP,
      PREDIKAT_KURANG,
    ]);
  });
});
