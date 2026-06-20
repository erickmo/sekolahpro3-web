import { describe, it, expect } from "vitest";
import {
  rekapMutasiSimpanan,
  rekapArusKasTeller,
  rekapKomposisiSimpanan,
  rekapKualitasPembiayaan,
  arahJenis,
} from "./laporan";

// Domain note (verified vs backend gl.py + transaksi_simpanan.py):
// Transaksi Simpanan measures MEMBER-LIABILITY movement, not koperasi cash.
// kredit = saldo grows {Setoran, Bagi Hasil, Bunga};
// debit  = saldo shrinks {Penarikan, Biaya Admin Dormant, Pelunasan Denda Perpus}.
describe("arahJenis", () => {
  it("classifies all 6 jenis correctly", () => {
    expect(arahJenis("Setoran")).toBe("kredit");
    expect(arahJenis("Bagi Hasil")).toBe("kredit");
    expect(arahJenis("Bunga")).toBe("kredit");
    expect(arahJenis("Penarikan")).toBe("debit");
    expect(arahJenis("Biaya Admin Dormant")).toBe("debit");
    expect(arahJenis("Pelunasan Denda Perpus")).toBe("debit");
  });
});

describe("rekapMutasiSimpanan", () => {
  it("returns zeros for empty input", () => {
    const r = rekapMutasiSimpanan([]);
    expect(r.perJenis).toEqual([]);
    expect(r.totalKredit).toBe(0);
    expect(r.totalDebit).toBe(0);
    expect(r.net).toBe(0);
  });

  it("groups by jenis, sums, and computes net (kredit - debit)", () => {
    const r = rekapMutasiSimpanan([
      { jenis: "Setoran", jumlah: 1000 },
      { jenis: "Setoran", jumlah: 1000 },
      { jenis: "Bagi Hasil", jumlah: 100 },
      { jenis: "Penarikan", jumlah: 500 },
      { jenis: "Biaya Admin Dormant", jumlah: 50 },
      { jenis: "Pelunasan Denda Perpus", jumlah: 30 },
    ]);
    const setoran = r.perJenis.find((p) => p.jenis === "Setoran")!;
    expect(setoran.count).toBe(2);
    expect(setoran.total).toBe(2000);
    expect(setoran.arah).toBe("kredit");
    expect(r.totalKredit).toBe(2100); // 2000 + 100
    expect(r.totalDebit).toBe(580); // 500 + 50 + 30
    expect(r.net).toBe(1520);
  });

  it("treats missing jumlah as 0", () => {
    const r = rekapMutasiSimpanan([{ jenis: "Setoran" } as { jenis: string; jumlah: number }]);
    expect(r.totalKredit).toBe(0);
  });
});

describe("rekapArusKasTeller", () => {
  it("counts only closed (Selesai) sessions and groups by teller", () => {
    const r = rekapArusKasTeller([
      { teller: "Budi", status: "Selesai", total_setoran: 1000, total_penarikan: 400, selisih: 0 },
      { teller: "Budi", status: "Selesai", total_setoran: 500, total_penarikan: 100, selisih: -50 },
      { teller: "Siti", status: "Aktif", total_setoran: 999, total_penarikan: 999, selisih: 0 },
    ]);
    expect(r.perTeller).toHaveLength(1); // Siti's open session excluded
    const budi = r.perTeller[0]!;
    expect(budi.teller).toBe("Budi");
    expect(budi.sesi).toBe(2);
    expect(budi.setoran).toBe(1500);
    expect(budi.penarikan).toBe(500);
    expect(budi.net).toBe(1000);
    expect(r.totalSetoran).toBe(1500);
    expect(r.totalPenarikan).toBe(500);
    expect(r.netKas).toBe(1000);
    expect(r.sesiBermasalah).toBe(1); // one closed session with selisih != 0
    expect(r.totalSelisih).toBe(-50);
  });

  it("treats missing cash totals as 0", () => {
    const r = rekapArusKasTeller([{ teller: "X", status: "Selesai" }]);
    expect(r.totalSetoran).toBe(0);
    expect(r.totalPenarikan).toBe(0);
    expect(r.sesiBermasalah).toBe(0);
  });

  it("returns zeros for no closed sessions", () => {
    const r = rekapArusKasTeller([{ teller: "X", status: "Aktif", total_setoran: 5 }]);
    expect(r.perTeller).toEqual([]);
    expect(r.netKas).toBe(0);
  });
});

describe("rekapKomposisiSimpanan", () => {
  it("groups rekening by status with saldo + count", () => {
    const r = rekapKomposisiSimpanan([
      { status: "Aktif", saldo: 1000 },
      { status: "Aktif", saldo: 2000 },
      { status: "Dormant", saldo: 500 },
    ]);
    const aktif = r.perStatus.find((s) => s.status === "Aktif")!;
    expect(aktif.count).toBe(2);
    expect(aktif.saldo).toBe(3000);
    expect(r.totalSaldo).toBe(3500);
    expect(r.totalRekening).toBe(3);
  });
});

describe("rekapKualitasPembiayaan", () => {
  it("computes NPF on at-risk principal (Aktif + Macet), excluding Lunas", () => {
    const r = rekapKualitasPembiayaan([
      { status: "Aktif", jumlah_pokok: 1000 },
      { status: "Aktif", jumlah_pokok: 2000 },
      { status: "Lunas", jumlah_pokok: 5000 },
      { status: "Macet", jumlah_pokok: 500 },
    ]);
    expect(r.totalPokok).toBe(8500);
    expect(r.pokokBerisiko).toBe(3500); // Aktif 3000 + Macet 500 (Lunas excluded)
    expect(r.npfRatio).toBeCloseTo(500 / 3500, 5);
  });

  it("returns npfRatio 0 when no at-risk principal (avoid divide-by-zero)", () => {
    expect(rekapKualitasPembiayaan([]).npfRatio).toBe(0);
    expect(rekapKualitasPembiayaan([{ status: "Lunas", jumlah_pokok: 9000 }]).npfRatio).toBe(0);
  });
});
