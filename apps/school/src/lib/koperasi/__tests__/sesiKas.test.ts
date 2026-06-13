import { describe, it, expect } from "vitest";
import {
  computeTotalDenominasi,
  computeSaldoSeharusnya,
  computeSelisih,
  validateBukaSesi,
  validateTutupSesi,
  sumTransaksiSigned,
  type DenominasiItem,
} from "../sesiKas";

const denominasi = (rows: Array<[number, number]>): DenominasiItem[] =>
  rows.map(([nominal, jumlah]) => ({ nominal, jumlah }));

describe("computeTotalDenominasi", () => {
  it("returns 0 for empty list", () => {
    expect(computeTotalDenominasi([])).toBe(0);
  });

  it("sums nominal*jumlah for each row", () => {
    expect(
      computeTotalDenominasi(
        denominasi([
          [100_000, 5],
          [50_000, 10],
          [20_000, 7],
        ]),
      ),
    ).toBe(100_000 * 5 + 50_000 * 10 + 20_000 * 7);
  });

  it("treats missing jumlah as 0", () => {
    expect(
      computeTotalDenominasi([{ nominal: 100_000, jumlah: undefined as unknown as number }]),
    ).toBe(0);
  });
});

describe("computeSaldoSeharusnya", () => {
  it("equals modal + setoran - penarikan", () => {
    expect(computeSaldoSeharusnya({ modalKas: 1_000_000, totalSetoran: 500_000, totalPenarikan: 200_000 })).toBe(
      1_300_000,
    );
  });
});

describe("computeSelisih", () => {
  it("returns 0 when fisik equals saldo seharusnya", () => {
    expect(computeSelisih({ totalDenominasiTutup: 1_300_000, saldoSeharusnya: 1_300_000 })).toBe(0);
  });

  it("returns positive when fisik exceeds saldo", () => {
    expect(computeSelisih({ totalDenominasiTutup: 1_350_000, saldoSeharusnya: 1_300_000 })).toBe(50_000);
  });

  it("returns negative when fisik less than saldo", () => {
    expect(computeSelisih({ totalDenominasiTutup: 1_280_000, saldoSeharusnya: 1_300_000 })).toBe(-20_000);
  });
});

describe("validateBukaSesi", () => {
  const baseValid = {
    shift: "Pagi" as const,
    modalKas: 1_000_000,
    denominasiBuka: denominasi([
      [100_000, 5],
      [50_000, 10],
    ]),
  };

  it("returns null when valid", () => {
    expect(validateBukaSesi(baseValid)).toBeNull();
  });

  it("rejects when modal_kas != total denominasi", () => {
    const err = validateBukaSesi({ ...baseValid, modalKas: 999_000 });
    expect(err).not.toBeNull();
    expect(err).toMatch(/modal/i);
  });

  it("rejects when modal_kas <= 0", () => {
    const err = validateBukaSesi({ ...baseValid, modalKas: 0, denominasiBuka: [] });
    expect(err).toMatch(/modal/i);
  });

  it("rejects when denominasi empty", () => {
    const err = validateBukaSesi({ ...baseValid, denominasiBuka: [] });
    expect(err).toMatch(/denominasi/i);
  });
});

describe("validateTutupSesi", () => {
  const baseValid = {
    denominasiTutup: denominasi([
      [100_000, 13],
    ]),
    saldoSeharusnya: 1_300_000,
    catatanSelisih: "",
  };

  it("returns null when selisih 0 and no catatan needed", () => {
    expect(validateTutupSesi(baseValid)).toBeNull();
  });

  it("requires catatan_selisih when selisih != 0", () => {
    const err = validateTutupSesi({
      ...baseValid,
      denominasiTutup: denominasi([[100_000, 14]]),
      catatanSelisih: "",
    });
    expect(err).toMatch(/catatan/i);
  });

  it("accepts when selisih != 0 with catatan provided", () => {
    expect(
      validateTutupSesi({
        ...baseValid,
        denominasiTutup: denominasi([[100_000, 14]]),
        catatanSelisih: "Kelebihan setoran teller",
      }),
    ).toBeNull();
  });

  it("rejects when denominasi tutup empty", () => {
    expect(
      validateTutupSesi({ ...baseValid, denominasiTutup: [] }),
    ).toMatch(/denominasi/i);
  });
});

describe("sumTransaksiSigned", () => {
  it("returns zero totals for no rows", () => {
    expect(sumTransaksiSigned([])).toEqual({ totalSetoran: 0, totalPenarikan: 0 });
  });

  it("adds Setoran to setoran and Penarikan to penarikan", () => {
    const out = sumTransaksiSigned([
      { jenis: "Setoran", jumlah: 100_000 },
      { jenis: "Setoran", jumlah: 50_000 },
      { jenis: "Penarikan", jumlah: 30_000 },
    ]);
    expect(out.totalSetoran).toBe(150_000);
    expect(out.totalPenarikan).toBe(30_000);
  });

  it("counts Pelunasan Denda Perpus as cash in (setoran)", () => {
    const out = sumTransaksiSigned([{ jenis: "Pelunasan Denda Perpus", jumlah: 15_000 }]);
    expect(out).toEqual({ totalSetoran: 15_000, totalPenarikan: 0 });
  });

  it("ignores book-only jenis (Bagi Hasil, Bunga, Biaya Admin Dormant) for the drawer", () => {
    const out = sumTransaksiSigned([
      { jenis: "Bagi Hasil", jumlah: 25_000 },
      { jenis: "Bunga", jumlah: 10_000 },
      { jenis: "Biaya Admin Dormant", jumlah: 5_000 },
    ]);
    expect(out).toEqual({ totalSetoran: 0, totalPenarikan: 0 });
  });

  it("feeds computeSaldoSeharusnya so saldo reflects the day's cash", () => {
    const { totalSetoran, totalPenarikan } = sumTransaksiSigned([
      { jenis: "Setoran", jumlah: 300_000 },
      { jenis: "Penarikan", jumlah: 100_000 },
    ]);
    expect(
      computeSaldoSeharusnya({ modalKas: 1_000_000, totalSetoran, totalPenarikan }),
    ).toBe(1_200_000);
  });
});
