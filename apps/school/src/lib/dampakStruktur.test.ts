import { describe, it, expect } from "vitest";
import { computeDampak, type DampakInput } from "./dampakStruktur";

const naik = (tujuan: DampakInput["rombelTujuan"]): DampakInput => ({
  jenis: "Naik Kelas",
  rombelTujuan: tujuan,
});

describe("dampakStruktur — Naik Kelas (has a target rombel)", () => {
  it("reports headroom and no warning when the target has room", () => {
    const v = computeDampak(naik({ name: "X", kapasitas: 32, jumlah_siswa: 30, status: "Aktif" }));
    expect(v.hasTarget).toBe(true);
    expect(v.destructive).toBe(false);
    expect(v.overCapacity).toBe(false);
    expect(v.headroom).toBe(2);
    expect(v.warnings).toHaveLength(0);
  });

  it("warns when adding the student would exceed kapasitas", () => {
    const v = computeDampak(naik({ name: "X", kapasitas: 32, jumlah_siswa: 32, status: "Aktif" }));
    expect(v.overCapacity).toBe(true);
    expect(v.warnings.join(" ")).toMatch(/kapasitas/i);
  });

  it("warns when the target rombel is Ditutup", () => {
    const v = computeDampak(naik({ name: "X", kapasitas: 32, jumlah_siswa: 10, status: "Ditutup" }));
    expect(v.targetDitutup).toBe(true);
    expect(v.warnings.join(" ")).toMatch(/ditutup/i);
  });
});

describe("dampakStruktur — destructive jenis (C6: no headroom chip)", () => {
  it("flags Pindah Keluar as destructive with no target headroom", () => {
    const v = computeDampak({ jenis: "Pindah Keluar" });
    expect(v.destructive).toBe(true);
    expect(v.hasTarget).toBe(false);
    expect(v.overCapacity).toBeUndefined();
    expect(v.warnings.join(" ")).toMatch(/destruktif|keluar/i);
  });

  it("flags Drop Out as destructive", () => {
    const v = computeDampak({ jenis: "Drop Out" });
    expect(v.destructive).toBe(true);
    expect(v.hasTarget).toBe(false);
  });
});
