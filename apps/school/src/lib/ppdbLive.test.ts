/**
 * Unit tests for the PURE live-data adapters in ./ppdbLive.
 *
 * Every adapter is deterministic and dependency-free; tests craft minimal rows
 * and assert the exact ChartDatum / DistributionSegment / summary output,
 * including the mandatory empty-input and all-zero edge cases.
 */
import { describe, it, expect } from "vitest";
import {
  perStatusToFunnel,
  perStatusToDistribution,
  paymentSummaryLive,
  paymentStatusDistributionLive,
  docCompletenessByPendaftaran,
  scoreHistogramLive,
  jalurDistributionLive,
} from "./ppdbLive";
import { PIPELINE_STAGES } from "./ppdbApi";

describe("perStatusToFunnel", () => {
  it("maps per_status onto every PIPELINE_STAGES slot in canonical order", () => {
    const out = perStatusToFunnel({ Draft: 3, Diterima: 5, Ditolak: 2 });
    expect(out).toHaveLength(PIPELINE_STAGES.length);
    expect(out[0]).toEqual({ label: "Draft", value: 3, tone: "neutral" });
    const diterima = out.find((d) => d.label.startsWith("Diterima"));
    expect(diterima).toMatchObject({ value: 5, tone: "emerald" });
  });

  it("returns all-zero (full stage set) for empty input", () => {
    const out = perStatusToFunnel({});
    expect(out).toHaveLength(PIPELINE_STAGES.length);
    expect(out.every((d) => d.value === 0)).toBe(true);
  });

  it("ignores foreign statuses not in PIPELINE_STAGES", () => {
    const out = perStatusToFunnel({ Aneh: 9, Draft: 1 });
    const total = out.reduce((a, d) => a + d.value, 0);
    expect(total).toBe(1);
  });
});

describe("perStatusToDistribution", () => {
  it("emits only stages with a positive count, toned per stage", () => {
    const out = perStatusToDistribution({ Draft: 0, Diterima: 4, Seleksi: 2 });
    const labels = out.map((s) => s.label);
    expect(labels.some((l) => l.startsWith("Diterima"))).toBe(true);
    expect(labels).toContain("Seleksi");
    expect(labels).not.toContain("Draft");
    expect(out.every((s) => s.value > 0 && typeof s.tone === "string")).toBe(true);
  });

  it("returns [] for empty input", () => {
    expect(perStatusToDistribution({})).toEqual([]);
  });
});

describe("paymentSummaryLive", () => {
  it("sums tagihan/terbayar and computes outstanding + pct", () => {
    const out = paymentSummaryLive([
      { name: "P1", jumlah_tagihan: 1000, jumlah_terbayar: 400 },
      { name: "P2", jumlah_tagihan: 1000, jumlah_terbayar: 1000 },
    ]);
    expect(out).toEqual({
      billed: 2000,
      collected: 1400,
      outstanding: 600,
      pctCollected: 70,
    });
  });

  it("returns zeroes for empty input (no NaN)", () => {
    expect(paymentSummaryLive([])).toEqual({
      billed: 0,
      collected: 0,
      outstanding: 0,
      pctCollected: 0,
    });
  });

  it("caps pctCollected at 100 and floors outstanding at 0 on over-payment", () => {
    const out = paymentSummaryLive([
      { name: "P1", jumlah_tagihan: 500, jumlah_terbayar: 900 },
    ]);
    expect(out.pctCollected).toBe(100);
    expect(out.outstanding).toBe(0);
  });

  it("treats missing amount fields as zero", () => {
    const out = paymentSummaryLive([{ name: "P1" }]);
    expect(out).toEqual({
      billed: 0,
      collected: 0,
      outstanding: 0,
      pctCollected: 0,
    });
  });
});

describe("paymentStatusDistributionLive", () => {
  it("counts known Lunas/Cicilan/Tertunda statuses", () => {
    const out = paymentStatusDistributionLive([
      { name: "P1", status: "Lunas" },
      { name: "P2", status: "Lunas" },
      { name: "P3", status: "Tertunda" },
    ]);
    const byLabel = Object.fromEntries(out.map((s) => [s.label, s.value]));
    expect(byLabel["Lunas"]).toBe(2);
    expect(byLabel["Tertunda"]).toBe(1);
    expect(byLabel["Cicilan"]).toBe(0);
  });

  it("returns the full status set with zeroes for empty input", () => {
    const out = paymentStatusDistributionLive([]);
    expect(out).toHaveLength(3);
    expect(out.every((s) => s.value === 0)).toBe(true);
  });
});

describe("docCompletenessByPendaftaran", () => {
  it("groups by pendaftaran_ppdb, done = status Diterima", () => {
    const out = docCompletenessByPendaftaran([
      { name: "D1", pendaftaran_ppdb: "PPDB-1", status: "Diterima" },
      { name: "D2", pendaftaran_ppdb: "PPDB-1", status: "Ditolak" },
      { name: "D3", pendaftaran_ppdb: "PPDB-2", status: "Diterima" },
    ]);
    expect(out["PPDB-1"]).toEqual({ done: 1, total: 2, pct: 50 });
    expect(out["PPDB-2"]).toEqual({ done: 1, total: 1, pct: 100 });
  });

  it("returns {} for empty input", () => {
    expect(docCompletenessByPendaftaran([])).toEqual({});
  });

  it("skips rows without a pendaftaran_ppdb key", () => {
    const out = docCompletenessByPendaftaran([{ name: "D1", status: "Diterima" }]);
    expect(out).toEqual({});
  });
});

describe("scoreHistogramLive", () => {
  it("buckets defined skor across 0..100 in binSize 10 by default", () => {
    const out = scoreHistogramLive([
      { name: "T1", skor: 5 },
      { name: "T2", skor: 95 },
      { name: "T3", skor: 100 },
    ]);
    expect(out).toHaveLength(10);
    expect(out[0]).toMatchObject({ label: "0-9", value: 1 });
    // 95 and the exact 100 both fold into the top bucket.
    expect(out[9]).toMatchObject({ label: "90-100", value: 2 });
  });

  it("skips undefined skor and returns full bucket set on empty input", () => {
    const out = scoreHistogramLive([{ name: "T1" }]);
    expect(out).toHaveLength(10);
    expect(out.every((d) => d.value === 0)).toBe(true);
  });

  it("honours a custom binSize", () => {
    const out = scoreHistogramLive([{ name: "T1", skor: 50 }], 25);
    expect(out).toHaveLength(4);
    expect(out[2]).toMatchObject({ value: 1 });
  });
});

describe("jalurDistributionLive", () => {
  it("counts rows per jalur in first-appearance order", () => {
    const out = jalurDistributionLive([
      { jalur: "Reguler" },
      { jalur: "Prestasi" },
      { jalur: "Reguler" },
    ]);
    expect(out[0]).toMatchObject({ label: "Reguler", value: 2 });
    expect(out[1]).toMatchObject({ label: "Prestasi", value: 1 });
    expect(out.every((d) => typeof d.tone === "string")).toBe(true);
  });

  it("ignores rows without a jalur and returns [] when all missing", () => {
    expect(jalurDistributionLive([{}, {}])).toEqual([]);
  });

  it("returns [] for empty input", () => {
    expect(jalurDistributionLive([])).toEqual([]);
  });
});
