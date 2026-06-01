import { describe, it, expect } from "vitest";
import {
  mapFeeInvoiceToTagihan,
  mapExpenseToPengeluaran,
  type FeeInvoiceDoc,
  type ExpenseDoc,
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
