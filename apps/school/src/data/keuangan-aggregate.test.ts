import { describe, it, expect } from "vitest";
import {
  mapPaymentToPembayaran,
  deriveKasRows,
  aggregateMonthly,
  type PaymentDoc,
} from "./keuangan-live";

describe("mapPaymentToPembayaran", () => {
  const DOC: PaymentDoc = {
    name: "PAY-2026-00001",
    posting_date: "2026-05-03",
    company: "SMA Cendekia",
    student: "SIS-001",
    student_name: "Andi",
    judul: "SPP Mei 2026",
    invoice: "TAG-2026-00001",
    metode: "Transfer",
    jumlah: 400_000,
    ref: "TRX-9",
    penerima: "Kasir",
  };

  it("maps the payment doc onto the UI row", () => {
    const row = mapPaymentToPembayaran(DOC);
    expect(row.id).toBe("PAY-2026-00001");
    expect(row.tanggal).toBe("2026-05-03");
    expect(row.siswa).toBe("Andi");
    expect(row.metode).toBe("Transfer");
    expect(row.jumlah).toBe(400_000);
    expect(row.ref).toBe("TRX-9");
    expect(row.tagihanId).toBe("TAG-2026-00001");
    expect(row.sekolah).toBe("SMA Cendekia");
  });
});

describe("deriveKasRows", () => {
  it("builds a running cash book from payments (in) and paid expenses (out)", () => {
    const rows = deriveKasRows(
      [
        { tanggal: "2026-05-01", jumlah: 100 },
        { tanggal: "2026-05-02", jumlah: 50 },
      ],
      [
        { tanggal: "2026-05-01", jumlah: 30, status: "Dibayar" },
        { tanggal: "2026-05-02", jumlah: 20, status: "Disetujui" },
      ],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ tanggal: "2026-05-01", saldoAwal: 0, masuk: 100, keluar: 30, saldoAkhir: 70 });
    // Only "Dibayar" expenses are cash out; the Disetujui one is ignored.
    expect(rows[1]).toMatchObject({ tanggal: "2026-05-02", saldoAwal: 70, masuk: 50, keluar: 0, saldoAkhir: 120 });
  });

  it("returns an empty list when there is no activity", () => {
    expect(deriveKasRows([], [])).toEqual([]);
  });
});

describe("aggregateMonthly", () => {
  it("groups payments and paid expenses by month in chronological order", () => {
    const months = aggregateMonthly(
      [
        { tanggal: "2026-05-01", jumlah: 100 },
        { tanggal: "2026-04-10", jumlah: 40 },
      ],
      [{ tanggal: "2026-05-05", jumlah: 30, status: "Dibayar" }],
    );
    expect(months.map((m) => m.bulan)).toEqual(["Apr", "Mei"]);
    expect(months[0]).toMatchObject({ bulan: "Apr", pemasukan: 40, pengeluaran: 0, saldo: 40 });
    expect(months[1]).toMatchObject({ bulan: "Mei", pemasukan: 100, pengeluaran: 30, saldo: 70 });
  });
});
