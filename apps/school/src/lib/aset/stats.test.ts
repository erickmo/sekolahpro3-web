import { describe, it, expect } from "vitest";
import { computeAsetStats, countByStatus, overduePeminjaman, type AsetRow, type PeminjamanRow } from "./stats";

const asets: AsetRow[] = [
  { name: "A", jumlah_total: 10, jumlah_tersedia: 7, kondisi: "Baik", status: "Tersedia" },
  { name: "B", jumlah_total: 5, jumlah_tersedia: 5, kondisi: "Rusak Ringan", status: "Maintenance" },
  { name: "C", jumlah_total: 3, jumlah_tersedia: 0, kondisi: "Rusak Berat", status: "Hilang" },
  { name: "D", jumlah_total: 99, jumlah_tersedia: 99, kondisi: "Baik", status: "Dihapus" },
];

describe("computeAsetStats", () => {
  it("excludes Dihapus assets from inventory counts", () => {
    const s = computeAsetStats(asets);
    expect(s.totalAset).toBe(3); // A, B, C (D dihapus)
    expect(s.totalUnit).toBe(18); // 10 + 5 + 3
  });

  it("derives unitDipinjam as total - available", () => {
    const s = computeAsetStats(asets);
    expect(s.unitTersedia).toBe(12); // 7 + 5 + 0
    expect(s.unitDipinjam).toBe(6); // 18 - 12
  });

  it("counts rusak (non-Baik) and maintenance and hilang", () => {
    const s = computeAsetStats(asets);
    expect(s.asetRusak).toBe(2); // B, C
    expect(s.asetMaintenance).toBe(1); // B
    expect(s.asetHilang).toBe(1); // C
  });

  it("computes utilisasiPct, 0 when no units", () => {
    expect(computeAsetStats(asets).utilisasiPct).toBe(Math.round((6 / 18) * 100));
    expect(computeAsetStats([]).utilisasiPct).toBe(0);
  });
});

describe("countByStatus", () => {
  it("tallies rows by status with fallback", () => {
    const rows: PeminjamanRow[] = [{ name: "1", status: "Dipinjam" }, { name: "2", status: "Dipinjam" }, { name: "3" }];
    expect(countByStatus(rows)).toEqual({ Dipinjam: 2, "—": 1 });
  });
});

describe("overduePeminjaman", () => {
  it("returns only Dipinjam rows past the given date", () => {
    const rows: PeminjamanRow[] = [
      { name: "1", status: "Dipinjam", tanggal_kembali_rencana: "2026-06-01" },
      { name: "2", status: "Dipinjam", tanggal_kembali_rencana: "2026-06-10" },
      { name: "3", status: "Dikembalikan", tanggal_kembali_rencana: "2026-05-01" },
    ];
    const out = overduePeminjaman(rows, "2026-06-05");
    expect(out.map((r) => r.name)).toEqual(["1"]);
  });
});
