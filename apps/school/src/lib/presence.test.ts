import { describe, it, expect } from "vitest";
import { aggregatePresence, type AbsensiDetailRow } from "./presence";

const rows: AbsensiDetailRow[] = [
  { siswa: "A", status: "Hadir" },
  { siswa: "B", status: "Hadir" },
  { siswa: "C", status: "Sakit" },
  { siswa: "D", status: "Izin" },
  { siswa: "E", status: "Alpha" },
  { siswa: "F", status: "Terlambat" },
];

describe("presence — aggregatePresence", () => {
  it("counts each status and the total", () => {
    const p = aggregatePresence(rows);
    expect(p.hadir).toBe(2);
    expect(p.sakit).toBe(1);
    expect(p.izin).toBe(1);
    expect(p.alpha).toBe(1);
    expect(p.terlambat).toBe(1);
    expect(p.total).toBe(6);
  });

  it("lists the names of students marked Alpha (absent)", () => {
    expect(aggregatePresence(rows).absent).toEqual(["E"]);
  });

  it("returns an all-zero summary for an empty (not-yet-taken) day", () => {
    const p = aggregatePresence([]);
    expect(p.total).toBe(0);
    expect(p.absent).toEqual([]);
  });
});
