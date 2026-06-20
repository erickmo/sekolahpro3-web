import { describe, it, expect } from "vitest";
import {
  mapFeeInvoiceToTagihan,
  mapExpenseToPengeluaran,
  mapPaymentToPembayaran,
  type FeeInvoiceDoc,
  type ExpenseDoc,
  type PaymentDoc,
} from "./keuangan-live";

const INVOICE: FeeInvoiceDoc = {
  name: "TAG-2026-00001",
  posting_date: "2026-05-01",
  due_date: "2026-05-10",
  company: "SMA Cendekia",
  student: "SIS-001",
  student_name: "Andi Pratama",
  judul: "SPP Mei 2026",
  jumlah: 1_000_000,
  dibayar: 400_000,
  status: "Sebagian",
};

describe("mapFeeInvoiceToTagihan", () => {
  it("maps core fields from the Frappe doc to the UI row", () => {
    const row = mapFeeInvoiceToTagihan(INVOICE);
    expect(row.id).toBe("TAG-2026-00001");
    expect(row.siswa).toBe("Andi Pratama");
    expect(row.judul).toBe("SPP Mei 2026");
    expect(row.jatuhTempo).toBe("2026-05-10");
    expect(row.jumlah).toBe(1_000_000);
    expect(row.dibayar).toBe(400_000);
    expect(row.sekolah).toBe("SMA Cendekia");
  });

  it("falls back to the student id when student_name is absent", () => {
    const doc = { ...INVOICE };
    delete doc.student_name;
    expect(mapFeeInvoiceToTagihan(doc).siswa).toBe("SIS-001");
  });

  it("translates the doctype status to a UI StatusTagihan", () => {
    expect(mapFeeInvoiceToTagihan({ ...INVOICE, status: "Lunas" }).status).toBe("Lunas");
    expect(mapFeeInvoiceToTagihan({ ...INVOICE, status: "Sebagian" }).status).toBe("Cicilan");
    expect(mapFeeInvoiceToTagihan({ ...INVOICE, status: "Belum Dibayar" }).status).toBe("Tertunda");
    expect(mapFeeInvoiceToTagihan({ ...INVOICE, status: "Draft" }).status).toBe("Draft");
    expect(mapFeeInvoiceToTagihan({ ...INVOICE, status: "Dibatalkan" }).status).toBe("Dibatalkan");
  });
});

describe("mapExpenseToPengeluaran", () => {
  const EXP: ExpenseDoc = {
    name: "EXP-2026-00001",
    posting_date: "2026-05-02",
    company: "SMA Cendekia",
    kategori: "Operasional",
    deskripsi: "Pembelian ATK",
    jumlah: 250_000,
    penerima: "Toko ABC",
    metode: "Tunai",
    status: "Disetujui",
    approver: "Kepala Sekolah",
  };

  it("maps fields straight through (unions already align)", () => {
    const row = mapExpenseToPengeluaran(EXP);
    expect(row.id).toBe("EXP-2026-00001");
    expect(row.tanggal).toBe("2026-05-02");
    expect(row.kategori).toBe("Operasional");
    expect(row.deskripsi).toBe("Pembelian ATK");
    expect(row.jumlah).toBe(250_000);
    expect(row.penerima).toBe("Toko ABC");
    expect(row.metode).toBe("Tunai");
    expect(row.status).toBe("Disetujui");
    expect(row.approver).toBe("Kepala Sekolah");
    expect(row.sekolah).toBe("SMA Cendekia");
  });

  it("leaves approver undefined when absent", () => {
    const doc = { ...EXP };
    delete doc.approver;
    expect(mapExpenseToPengeluaran(doc).approver).toBeUndefined();
  });
});

describe("mapPaymentToPembayaran", () => {
  const PAYMENT: PaymentDoc = {
    name: "PAY-2026-00001",
    posting_date: "2026-05-03",
    company: "SMA Cendekia",
    student: "SIS-002",
    student_name: "Budi Santoso",
    judul: "SPP Mei 2026",
    invoice: "TAG-2026-00001",
    metode: "Transfer",
    jumlah: 600_000,
    ref: "TRX-9",
    penerima: "Bendahara",
  };

  it("maps core payment fields to the UI row", () => {
    const row = mapPaymentToPembayaran(PAYMENT);
    expect(row.id).toBe("PAY-2026-00001");
    expect(row.tanggal).toBe("2026-05-03");
    expect(row.siswa).toBe("Budi Santoso");
    expect(row.judul).toBe("SPP Mei 2026");
    expect(row.metode).toBe("Transfer");
    expect(row.jumlah).toBe(600_000);
    expect(row.ref).toBe("TRX-9");
    expect(row.penerima).toBe("Bendahara");
    expect(row.tagihanId).toBe("TAG-2026-00001");
    expect(row.sekolah).toBe("SMA Cendekia");
  });

  it("falls back to the student id when student_name is absent", () => {
    const doc = { ...PAYMENT };
    delete doc.student_name;
    expect(mapPaymentToPembayaran(doc).siswa).toBe("SIS-002");
  });

  it("reports class as n/a — School Fee Payment carries no kelas field", () => {
    // Regression guard: the payment doctype has no `kelas`, so the row must
    // never surface a class even if a stray value rides along on the raw object.
    const withStrayClass = { ...PAYMENT, kelas: "X-A" } as unknown as PaymentDoc;
    expect(mapPaymentToPembayaran(withStrayClass).kelas).toBe("—");
  });
});
