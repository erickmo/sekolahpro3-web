import { describe, it, expect } from "vitest";
import {
  computePersenKehadiran,
  computeSaldoTagihan,
  feeInvoiceToTagihanRow,
  feePaymentToPembayaranRow,
  mapRiwayatAbsensi,
} from "./siswaRelations";
import type { FeeInvoiceDoc, PaymentDoc } from "../../data/keuangan-live";

const inv = (over: Partial<FeeInvoiceDoc>): FeeInvoiceDoc => ({
  name: "TAG-1", posting_date: "2026-05-01", company: "C", student: "20240001",
  judul: "SPP Mei", jumlah: 750000, status: "Belum Dibayar", ...over,
});

describe("feeInvoiceToTagihanRow", () => {
  it("maps fields and status onto the Siswa TagihanRow", () => {
    const row = feeInvoiceToTagihanRow(inv({ due_date: "2026-05-10", dibayar: 0 }));
    expect(row.id).toBe("TAG-1");
    expect(row.judul).toBe("SPP Mei");
    expect(row.jatuhTempo).toBe("2026-05-10");
    expect(row.status).toBe("Tertunda");
  });

  it("maps Lunas and Sebagian statuses", () => {
    expect(feeInvoiceToTagihanRow(inv({ status: "Lunas" })).status).toBe("Lunas");
    expect(feeInvoiceToTagihanRow(inv({ status: "Sebagian" })).status).toBe("Cicilan");
  });

  it("falls back jatuhTempo to posting_date when due_date is absent", () => {
    expect(feeInvoiceToTagihanRow(inv({})).jatuhTempo).toBe("2026-05-01");
  });
});

describe("feePaymentToPembayaranRow", () => {
  const pay = (over: Partial<PaymentDoc>): PaymentDoc => ({
    name: "PAY-1", posting_date: "2026-04-12", company: "C", student: "20240001",
    jumlah: 750000, ...over,
  });
  it("maps a payment and coerces EDC to Transfer", () => {
    const row = feePaymentToPembayaranRow(pay({ metode: "EDC", ref: "X1", penerima: "TU" }));
    expect(row.metode).toBe("Transfer");
    expect(row.ref).toBe("X1");
    expect(row.penerima).toBe("TU");
  });
  it("passes QRIS through and defaults missing fields", () => {
    const row = feePaymentToPembayaranRow(pay({ metode: "QRIS" }));
    expect(row.metode).toBe("QRIS");
    expect(row.ref).toBe("—");
  });
});

describe("computeSaldoTagihan", () => {
  it("sums unpaid remainder, ignoring settled invoices", () => {
    const saldo = computeSaldoTagihan([
      { id: "1", judul: "a", jatuhTempo: "x", jumlah: 1000, status: "Tertunda", dibayar: 200 },
      { id: "2", judul: "b", jatuhTempo: "x", jumlah: 500, status: "Lunas", dibayar: 500 },
      { id: "3", judul: "c", jatuhTempo: "x", jumlah: 300, status: "Cicilan" },
    ]);
    expect(saldo).toBe(800 + 300);
  });
});

describe("mapRiwayatAbsensi / computePersenKehadiran", () => {
  it("normalizes Alpha to Alpa and keeps keterangan", () => {
    const rows = mapRiwayatAbsensi([
      { tanggal: "2026-05-01", status: "Alpha", keterangan: "tanpa kabar", pencatat: "Wali" },
      { tanggal: "2026-05-02", status: "Hadir" },
    ]);
    expect(rows[0]!.status).toBe("Alpa");
    expect(rows[0]!.keterangan).toBe("tanpa kabar");
    expect(rows[1]!.pencatat).toBe("—");
  });

  it("computes attendance percentage", () => {
    const rows = mapRiwayatAbsensi([
      { tanggal: "1", status: "Hadir" },
      { tanggal: "2", status: "Hadir" },
      { tanggal: "3", status: "Sakit" },
      { tanggal: "4", status: "Alpha" },
    ]);
    expect(computePersenKehadiran(rows)).toBe(50);
    expect(computePersenKehadiran([])).toBe(0);
  });
});
