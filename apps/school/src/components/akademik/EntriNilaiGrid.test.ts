/**
 * Unit tests for EntriNilaiGrid pure helpers.
 *
 * Covers AKA-06: per-cell validation (clampNilai), weighted final-score
 * computation (computeNilaiAkhir), filled-cell counting, and the class-level
 * mastery summary (buildSummary, KKM classification).
 */
import { describe, it, expect, vi } from "vitest";

// EntriNilaiGrid imports the api-client at module scope; stub it so importing
// the module for its pure helpers never touches the network layer.
vi.mock("@sekolahpro/api-client", () => ({
  createResource: vi.fn(),
  listResource: vi.fn().mockResolvedValue([]),
  updateResource: vi.fn(),
  useResourceList: vi.fn(() => ({ data: [], isLoading: false })),
}));

import {
  clampNilai,
  computeNilaiAkhir,
  countFilledCells,
  buildSummary,
  pendingSaveRows,
  KKM_DEFAULT,
  type CellState,
  type KomponenNilai,
  type AnggotaRombel,
  type GridState,
} from "./EntriNilaiGrid";

/** Build a cell holding the given raw value. */
function cs(value: string): CellState {
  return { value, baseline: value, status: "saved" };
}

/** Build a cell with an explicit save status. */
function csStatus(value: string, status: CellState["status"]): CellState {
  return { value, baseline: value, status };
}

const K1: KomponenNilai = { name: "K1", nama: "UH", bobot: 2 };
const K2: KomponenNilai = { name: "K2", nama: "UTS", bobot: 1 };

describe("clampNilai (grid variant)", () => {
  it("keeps empty input valid", () => {
    expect(clampNilai("")).toEqual({ value: "", error: null });
  });
  it("preserves the raw value but flags non-numeric / out-of-range", () => {
    expect(clampNilai("abc")).toEqual({ value: "abc", error: "Bukan angka" });
    expect(clampNilai("150")).toEqual({ value: "150", error: "0–100" });
  });
  it("accepts a valid 0–100 value", () => {
    expect(clampNilai("80")).toEqual({ value: "80", error: null });
  });
});

describe("computeNilaiAkhir", () => {
  it("computes the bobot-weighted average", () => {
    const cells = { K1: cs("80"), K2: cs("50") };
    // (80*2 + 50*1) / (2+1) = 70
    expect(computeNilaiAkhir(cells, [K1, K2])).toBe(70);
  });

  it("skips empty and non-numeric component cells", () => {
    const cells = { K1: cs("80"), K2: cs("") };
    expect(computeNilaiAkhir(cells, [K1, K2])).toBe(80);
    const bad = { K1: cs("abc"), K2: cs("90") };
    expect(computeNilaiAkhir(bad, [K1, K2])).toBe(90);
  });

  it("ignores components whose bobot is zero or negative", () => {
    const zeroBobot: KomponenNilai = { name: "K3", nama: "Tugas", bobot: 0 };
    const cells = { K1: cs("80"), K3: cs("10") };
    expect(computeNilaiAkhir(cells, [K1, zeroBobot])).toBe(80);
  });

  it("returns null when nothing valid is present or row is missing", () => {
    expect(computeNilaiAkhir(undefined, [K1])).toBeNull();
    expect(computeNilaiAkhir({ K1: cs("") }, [K1])).toBeNull();
  });
});

describe("countFilledCells", () => {
  it("counts only valid numeric cells", () => {
    const row = { K1: cs("80"), K2: cs("abc") };
    expect(countFilledCells(row, [K1, K2])).toBe(1);
  });
  it("returns 0 for a missing row", () => {
    expect(countFilledCells(undefined, [K1])).toBe(0);
  });
});

describe("buildSummary", () => {
  it("splits the class into tuntas / belum tuntas / belum dinilai by KKM", () => {
    const anggota: AnggotaRombel[] = [{ siswa: "S1" }, { siswa: "S2" }, { siswa: "S3" }];
    const grid: GridState = {
      S1: { K1: cs("80") }, // >= KKM -> tuntas
      S2: { K1: cs("60") }, // < KKM  -> belum tuntas
      // S3 has no row -> belum dinilai
    };
    const s = buildSummary(anggota, grid, [K1]);
    expect(s.tuntas).toBe(1);
    expect(s.belumTuntas).toBe(1);
    expect(s.belumDinilai).toBe(1);
    expect(s.totalCells).toBe(3);
    expect(s.filledCells).toBe(2);
    expect(s.fillPercent).toBeCloseTo((2 / 3) * 100, 5);
  });

  it("classifies a score exactly at the KKM threshold as tuntas", () => {
    const anggota: AnggotaRombel[] = [{ siswa: "S1" }];
    const grid: GridState = { S1: { K1: cs(String(KKM_DEFAULT)) } };
    expect(buildSummary(anggota, grid, [K1]).tuntas).toBe(1);
  });

  it("guards against division by zero when there are no komponen", () => {
    const s = buildSummary([{ siswa: "S1" }], {}, []);
    expect(s.totalCells).toBe(0);
    expect(s.fillPercent).toBe(0);
  });
});

describe("pendingSaveRows", () => {
  const anggota: AnggotaRombel[] = [{ siswa: "S1" }, { siswa: "S2" }, { siswa: "S3" }];

  it("includes rows with an unsaved (dirty) cell", () => {
    const grid: GridState = { S1: { K1: csStatus("80", "dirty") } };
    expect(pendingSaveRows(anggota, grid)).toEqual(["S1"]);
  });

  it("includes rows whose previous save failed (error) so they stay retryable", () => {
    const grid: GridState = { S2: { K1: csStatus("80", "error") } };
    expect(pendingSaveRows(anggota, grid)).toEqual(["S2"]);
  });

  it("excludes rows that are fully saved or untouched", () => {
    const grid: GridState = {
      S1: { K1: csStatus("80", "saved") },
      S2: { K1: csStatus("", "idle") },
    };
    expect(pendingSaveRows(anggota, grid)).toEqual([]);
  });

  it("preserves anggota order across a mix of dirty and error rows", () => {
    const grid: GridState = {
      S3: { K1: csStatus("90", "error") },
      S1: { K1: csStatus("70", "dirty") },
    };
    expect(pendingSaveRows(anggota, grid)).toEqual(["S1", "S3"]);
  });
});
