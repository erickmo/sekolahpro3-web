import { describe, it, expect } from "vitest";
import {
  buildKategoriBars,
  buildSirkulasiSegments,
  buildTrenPeminjaman,
  computeKesehatanSirkulasi,
} from "../dashboardViz";

describe("buildKategoriBars", () => {
  it("returns empty array for empty input", () => {
    expect(buildKategoriBars([])).toEqual([]);
  });

  it("counts titles per category, sorted descending", () => {
    const bars = buildKategoriBars([
      { kategori: "Fiksi" },
      { kategori: "Fiksi" },
      { kategori: "Pelajaran" },
      { kategori: "Fiksi" },
      { kategori: "Pelajaran" },
    ]);
    expect(bars[0]).toMatchObject({ label: "Fiksi", value: 3 });
    expect(bars[1]).toMatchObject({ label: "Pelajaran", value: 2 });
    expect(bars[0]!.tone).toBeTruthy();
  });

  it("buckets missing category under a fallback label", () => {
    const bars = buildKategoriBars([{}, { kategori: "" }]);
    expect(bars[0]).toMatchObject({ label: "Tanpa Kategori", value: 2 });
  });

  it("limits to topN categories", () => {
    const rows = ["A", "B", "C", "D", "E"].map((k) => ({ kategori: k }));
    expect(buildKategoriBars(rows, 3)).toHaveLength(3);
  });
});

describe("buildSirkulasiSegments", () => {
  it("returns empty array for empty input", () => {
    expect(buildSirkulasiSegments([])).toEqual([]);
  });

  it("maps statuses to canonical toned segments and drops zero buckets", () => {
    const segs = buildSirkulasiSegments([
      { status: "Aktif" },
      { status: "Aktif" },
      { status: "Terlambat" },
      { status: "Selesai" },
    ]);
    const aktif = segs.find((s) => s.label === "Aktif");
    const terlambat = segs.find((s) => s.label === "Terlambat");
    expect(aktif).toMatchObject({ value: 2, tone: "brand" });
    expect(terlambat).toMatchObject({ value: 1, tone: "amber" });
    expect(segs.find((s) => s.label === "Hilang")).toBeUndefined();
  });

  it("collects unknown statuses under Lainnya", () => {
    const segs = buildSirkulasiSegments([{ status: "Weird" }, { status: undefined }]);
    expect(segs.find((s) => s.label === "Lainnya")).toMatchObject({ value: 2, tone: "neutral" });
  });
});

describe("buildTrenPeminjaman", () => {
  it("returns one datum per day window ending at the reference date", () => {
    const tren = buildTrenPeminjaman([], "2026-05-25", 7);
    expect(tren).toHaveLength(7);
    expect(tren.every((d) => d.value === 0)).toBe(true);
  });

  it("counts loans on each day in the window", () => {
    const tren = buildTrenPeminjaman(
      [
        { tanggal_pinjam: "2026-05-25" },
        { tanggal_pinjam: "2026-05-25" },
        { tanggal_pinjam: "2026-05-24" },
        { tanggal_pinjam: "2026-01-01" }, // outside window → ignored
      ],
      "2026-05-25",
      7,
    );
    expect(tren[tren.length - 1]).toMatchObject({ value: 2 }); // today
    expect(tren[tren.length - 2]).toMatchObject({ value: 1 }); // yesterday
  });
});

describe("computeKesehatanSirkulasi", () => {
  it("reports zero health when there are no active loans", () => {
    const h = computeKesehatanSirkulasi([{ status: "Selesai" }]);
    expect(h).toMatchObject({ total: 0, aktif: 0, terlambat: 0, percentTepatWaktu: 0 });
  });

  it("computes the on-time percentage of active loans", () => {
    const h = computeKesehatanSirkulasi([
      { status: "Aktif" },
      { status: "Aktif" },
      { status: "Aktif" },
      { status: "Terlambat" },
    ]);
    expect(h).toMatchObject({ total: 4, aktif: 3, terlambat: 1, percentTepatWaktu: 75 });
  });
});
