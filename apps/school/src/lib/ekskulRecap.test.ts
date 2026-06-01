/**
 * Unit tests for ekskulRecap pure aggregations (EKS-10/EKS-recap):
 * attendance tally, percent (zero-session + rounding), distribution segments,
 * program stats, and kategori chart grouping.
 */
import { describe, it, expect } from "vitest";
import {
  tallyKehadiran,
  totalKehadiran,
  persentaseHadir,
  kehadiranSegments,
  programStats,
  kategoriChart,
} from "./ekskulRecap";

describe("tallyKehadiran", () => {
  it("counts each status bucket and ignores unknowns", () => {
    const t = tallyKehadiran([
      { status: "Hadir" },
      { status: "Hadir" },
      { status: "Sakit" },
      { status: "Bolos" },
      { status: undefined },
    ]);
    expect(t).toEqual({ Hadir: 2, Izin: 0, Sakit: 1, Alpha: 0 });
    expect(totalKehadiran(t)).toBe(3);
  });
});

describe("persentaseHadir", () => {
  it("returns 0 for zero sessions (never NaN)", () => {
    expect(persentaseHadir(0, 0)).toBe(0);
    expect(persentaseHadir(5, 0)).toBe(0);
  });

  it("rounds to one decimal", () => {
    expect(persentaseHadir(2, 3)).toBe(66.7);
    expect(persentaseHadir(1, 1)).toBe(100);
    expect(persentaseHadir(1, 8)).toBe(12.5);
  });
});

describe("kehadiranSegments", () => {
  it("maps the tally to four toned segments in order", () => {
    const seg = kehadiranSegments({ Hadir: 3, Izin: 1, Sakit: 2, Alpha: 4 });
    expect(seg.map((s) => s.label)).toEqual(["Hadir", "Izin", "Sakit", "Alpha"]);
    expect(seg.map((s) => s.value)).toEqual([3, 1, 2, 4]);
    expect(seg[0]?.tone).toBe("emerald");
  });
});

describe("programStats", () => {
  it("splits aktif vs nonaktif", () => {
    const s = programStats([
      { name: "a", status: "Aktif" },
      { name: "b", status: "Nonaktif" },
      { name: "c", status: "Aktif" },
    ]);
    expect(s).toEqual({ total: 3, aktif: 2, nonaktif: 1 });
  });

  it("handles an empty list", () => {
    expect(programStats([])).toEqual({ total: 0, aktif: 0, nonaktif: 0 });
  });
});

describe("kategoriChart", () => {
  it("groups by kategori, sorts desc, defaults blank to Lainnya", () => {
    const c = kategoriChart([
      { name: "1", kategori: "Olahraga" },
      { name: "2", kategori: "Olahraga" },
      { name: "3", kategori: "Seni Budaya" },
      { name: "4", kategori: "" },
    ]);
    expect(c[0]).toMatchObject({ label: "Olahraga", value: 2 });
    expect(c.find((d) => d.label === "Lainnya")?.value).toBe(1);
    expect(c.every((d) => !!d.tone)).toBe(true);
  });
});
