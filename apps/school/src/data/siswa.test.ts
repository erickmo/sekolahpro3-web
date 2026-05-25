import { describe, expect, it } from "vitest";
import { SISWA_LIST, findSiswa, formatRupiah, umur } from "./siswa";

describe("siswa fixture", () => {
  it("emits 40 unique NIS", () => {
    expect(SISWA_LIST).toHaveLength(40);
    const ids = new Set(SISWA_LIST.map((s) => s.nis));
    expect(ids.size).toBe(40);
  });

  it("findSiswa returns by NIS", () => {
    const first = SISWA_LIST[0]!;
    expect(findSiswa(first.nis)?.namaLengkap).toBe(first.namaLengkap);
    expect(findSiswa("ZZZ")).toBeUndefined();
  });

  it("every siswa has minimum relasi rows", () => {
    for (const s of SISWA_LIST) {
      expect(s.nilai.length).toBeGreaterThan(0);
      expect(s.absensi.length).toBeGreaterThan(0);
      expect(s.tagihan.length).toBeGreaterThan(0);
      expect(s.wali.length).toBeGreaterThan(0);
      expect(s.dokumen.length).toBeGreaterThan(0);
    }
  });

  it("formatRupiah uses IDR", () => {
    expect(formatRupiah(750000)).toMatch(/Rp/);
  });

  it("umur computes from ISO date", () => {
    expect(umur("2008-05-24")).toBe(18);
    expect(umur("invalid")).toBe(0);
  });
});
