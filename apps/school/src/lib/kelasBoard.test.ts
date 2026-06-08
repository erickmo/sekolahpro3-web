import { describe, it, expect } from "vitest";
import {
  computeDefects,
  computeOrphans,
  totalDefects,
  type BoardRombelRow,
  type BoardSiswaRow,
  type BoardAnggotaRow,
} from "./kelasBoard";

const rombel = (over: Partial<BoardRombelRow>): BoardRombelRow => ({
  name: "R",
  status: "Aktif",
  kapasitas: 32,
  jumlah_siswa: 0,
  wali_kelas: "guru@s.id",
  ...over,
});

describe("kelasBoard — computeDefects", () => {
  it("flags rombel with no wali (empty or whitespace)", () => {
    const rows = [
      rombel({ name: "A", wali_kelas: "" }),
      rombel({ name: "B", wali_kelas: "   " }),
      rombel({ name: "C", wali_kelas: "guru@s.id" }),
    ];
    const d = computeDefects(rows);
    expect(d.tanpaWali.map((r) => r.name)).toEqual(["A", "B"]);
    expect(d.counts.tanpaWali).toBe(2);
  });

  it("flags over-capacity only when jumlah > kapasitas (kapasitas > 0)", () => {
    const rows = [
      rombel({ name: "A", jumlah_siswa: 33, kapasitas: 32 }), // over
      rombel({ name: "B", jumlah_siswa: 32, kapasitas: 32 }), // full, not over
      rombel({ name: "C", jumlah_siswa: 50, kapasitas: 0 }), // no cap → not counted
    ];
    const d = computeDefects(rows);
    expect(d.overKapasitas.map((r) => r.name)).toEqual(["A"]);
  });

  it("flags penuh when jumlah >= kapasitas and status Aktif", () => {
    const rows = [
      rombel({ name: "A", jumlah_siswa: 32, kapasitas: 32, status: "Aktif" }),
      rombel({ name: "B", jumlah_siswa: 40, kapasitas: 32, status: "Ditutup" }), // not Aktif
    ];
    const d = computeDefects(rows);
    expect(d.penuh.map((r) => r.name)).toEqual(["A"]);
  });
});

describe("kelasBoard — computeOrphans (audit C5/C7)", () => {
  const siswa: BoardSiswaRow[] = [
    { name: "S1", status: "Aktif" },
    { name: "S2", status: "Aktif" },
    { name: "S3", status: "Aktif" },
    { name: "S4", status: "Lulus" }, // not active → never an orphan
  ];

  it("orphan = active siswa with NO Aktif anggota row", () => {
    const anggota: BoardAnggotaRow[] = [
      { siswa: "S1", status: "Aktif" }, // placed
      { siswa: "S2", status: "Keluar" }, // left → still orphan
    ];
    // S1 placed, S2 only-Keluar → orphan, S3 no row → orphan, S4 not active → excluded
    const orphans = computeOrphans(siswa, anggota).map((s) => s.name);
    expect(orphans).toEqual(["S2", "S3"]);
  });

  it("excludes non-active siswa even with no anggota (Siswa.status filter)", () => {
    const orphans = computeOrphans(
      [{ name: "X", status: "Pindah" }],
      [],
    );
    expect(orphans).toEqual([]);
  });
});

describe("kelasBoard — totalDefects", () => {
  it("counts tanpaWali + overKapasitas + orphan, NOT penuh", () => {
    const d = computeDefects([
      rombel({ name: "A", wali_kelas: "" }), // tanpaWali
      rombel({ name: "B", jumlah_siswa: 40, kapasitas: 32 }), // over (+ penuh)
    ]);
    // d: tanpaWali=1, over=1, penuh=1 (B is Aktif & >=cap)
    expect(totalDefects(d, 3)).toBe(1 + 1 + 3); // penuh excluded
  });
});
