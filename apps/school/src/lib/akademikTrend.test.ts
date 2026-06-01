/**
 * Unit tests for the academic achievement trend aggregation (AKA-20).
 */
import { describe, it, expect } from "vitest";
import { buildNilaiTrend } from "./akademikTrend";

describe("buildNilaiTrend", () => {
  it("averages nilai_akhir per period, ordered oldest → newest", () => {
    const trend = buildNilaiTrend([
      { tahun_ajaran: "S-2024", semester: "Ganjil", nilai_akhir: 70 },
      { tahun_ajaran: "S-2024", semester: "Ganjil", nilai_akhir: 80 },
      { tahun_ajaran: "S-2024", semester: "Genap", nilai_akhir: 90 },
      { tahun_ajaran: "S-2025", semester: "Ganjil", nilai_akhir: 85 },
    ]);
    expect(trend.labels).toEqual(["S-2024 Ganjil", "S-2024 Genap", "S-2025 Ganjil"]);
    expect(trend.points).toEqual([75, 90, 85]);
  });

  it("orders Ganjil before Genap within the same tahun ajaran", () => {
    const trend = buildNilaiTrend([
      { tahun_ajaran: "S-2024", semester: "Genap", nilai_akhir: 60 },
      { tahun_ajaran: "S-2024", semester: "Ganjil", nilai_akhir: 70 },
    ]);
    expect(trend.labels).toEqual(["S-2024 Ganjil", "S-2024 Genap"]);
    expect(trend.points).toEqual([70, 60]);
  });

  it("ignores rows without a numeric nilai_akhir", () => {
    const trend = buildNilaiTrend([
      { tahun_ajaran: "S-2024", semester: "Ganjil" },
      { tahun_ajaran: "S-2024", semester: "Ganjil", nilai_akhir: 80 },
    ]);
    expect(trend.points).toEqual([80]);
  });

  it("returns empty arrays when there is no graded data", () => {
    expect(buildNilaiTrend([])).toEqual({ points: [], labels: [] });
  });

  it("keeps only the most recent six periods", () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({
      tahun_ajaran: `S-20${10 + i}`,
      semester: "Ganjil",
      nilai_akhir: i,
    }));
    const trend = buildNilaiTrend(rows);
    expect(trend.points).toHaveLength(6);
    // Oldest three (S-2010..S-2012) dropped; newest retained, ordered ascending.
    expect(trend.labels[0]).toBe("S-2013 Ganjil");
    expect(trend.labels[5]).toBe("S-2018 Ganjil");
  });
});
