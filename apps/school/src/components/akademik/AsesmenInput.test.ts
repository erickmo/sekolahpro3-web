/**
 * Unit tests for AsesmenInput pure helpers.
 *
 * Covers AKA-05: nilai validation (clampNilai), cell construction from
 * anggota+siswa+nilai (buildCells), and the summary/grade-band aggregation
 * (deriveSummary). The interactive grid + autosave wiring stays in the
 * component; these are the pure functions that drive its correctness.
 */
import { describe, it, expect, vi } from "vitest";

// AsesmenInput imports the api-client at module scope; stub it so importing the
// module for its pure helpers never touches the network layer.
vi.mock("@sekolahpro/api-client", () => ({
  getResource: vi.fn(),
  listResource: vi.fn().mockResolvedValue([]),
  updateResource: vi.fn(),
}));

import {
  clampNilai,
  buildCells,
  deriveSummary,
  type SiswaCell,
  type AnggotaRow,
  type SiswaInfo,
  type NilaiRow,
} from "./AsesmenInput";

/** Build a minimal saved cell with the given raw value. */
function cell(value: string): SiswaCell {
  return { siswa: `S-${value}`, nama: value, value, baseline: value, status: "saved" };
}

describe("clampNilai", () => {
  it("treats empty / whitespace as valid (belum dinilai)", () => {
    expect(clampNilai("")).toEqual({ ok: true, error: null });
    expect(clampNilai("   ")).toEqual({ ok: true, error: null });
  });

  it("accepts integers and decimals within 0–100", () => {
    expect(clampNilai("0").ok).toBe(true);
    expect(clampNilai("100").ok).toBe(true);
    expect(clampNilai("85.5").ok).toBe(true);
    expect(clampNilai(" 50 ").ok).toBe(true);
  });

  it("rejects non-numeric input", () => {
    const r = clampNilai("abc");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Bukan angka");
  });

  it("rejects out-of-range values", () => {
    expect(clampNilai("-1").ok).toBe(false);
    expect(clampNilai("101").ok).toBe(false);
    expect(clampNilai("100.5").ok).toBe(false);
  });
});

describe("buildCells", () => {
  const anggota: AnggotaRow[] = [
    { siswa: "S1", no_urut: 1 },
    { siswa: "S2", no_urut: 2 },
    { siswa: "S3", no_urut: 3 },
  ];
  const siswaMap = new Map<string, SiswaInfo>([
    ["S1", { name: "S1", nama_lengkap: "Andi", nis: "001" }],
    ["S2", { name: "S2", nama_lengkap: "Budi" }],
  ]);
  const nilaiMap = new Map<string, NilaiRow>([
    ["S1", { siswa: "S1", nilai: 80 }],
    ["S3", { siswa: "S3", nilai: null }],
  ]);

  it("hydrates value, baseline and saved status from stored nilai", () => {
    const cells = buildCells(anggota, siswaMap, nilaiMap);
    expect(cells).toHaveLength(3);
    expect(cells[0]).toMatchObject({ siswa: "S1", nama: "Andi", nis: "001", value: "80", baseline: "80", status: "saved" });
  });

  it("falls back to the siswa id as name and omits nis when info is missing", () => {
    const cells = buildCells(anggota, siswaMap, nilaiMap);
    expect(cells[1]).toMatchObject({ nama: "Budi", value: "" });
    expect(cells[1]!.nis).toBeUndefined();
    // S3 has no info row at all -> name falls back to the id.
    expect(cells[2]!.nama).toBe("S3");
  });

  it("renders a null stored nilai as an empty (belum dinilai) cell", () => {
    const cells = buildCells(anggota, siswaMap, nilaiMap);
    expect(cells[2]!.value).toBe("");
  });
});

describe("deriveSummary", () => {
  it("counts filled cells, averages and maxes only valid in-range values", () => {
    const cells = [cell("90"), cell("80"), cell("60"), cell("40"), cell(""), cell("abc"), cell("150")];
    const s = deriveSummary(cells);
    expect(s.total).toBe(7);
    // "abc" and "150" are non-empty so they count as filled, but are excluded
    // from avg/max/segments because they are not valid 0–100 numbers.
    expect(s.filled).toBe(6);
    expect(s.empty).toBe(1);
    expect(s.avg).toBe((90 + 80 + 60 + 40) / 4);
    expect(s.max).toBe(90);
  });

  it("segments values into non-overlapping grade bands (A/B/C/D)", () => {
    const cells = [cell("90"), cell("80"), cell("60"), cell("40")];
    const s = deriveSummary(cells);
    const byLabel = Object.fromEntries(s.gradeSegments.map((g) => [g.label, g.value]));
    expect(byLabel["85–100 (A)"]).toBe(1);
    expect(byLabel["70–84 (B)"]).toBe(1);
    expect(byLabel["55–69 (C)"]).toBe(1);
    expect(byLabel["0–54 (D)"]).toBe(1);
  });

  it("returns null avg/max when nothing is filled", () => {
    const s = deriveSummary([cell(""), cell("   ")]);
    expect(s.filled).toBe(0);
    expect(s.avg).toBeNull();
    expect(s.max).toBeNull();
  });
});
