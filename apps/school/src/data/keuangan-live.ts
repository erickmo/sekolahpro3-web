/**
 * Live (Frappe-backed) data layer for the Keuangan hub.
 *
 * Wires the operasional pages to the vernon_accounting doctypes created for the
 * redesign — School Fee Invoice (Tagihan) and School Expense (Pengeluaran) —
 * and maps each Frappe document onto the existing UI row shapes so the pages
 * render unchanged. Company scoping reuses the akuntansi pattern
 * (useActiveCompany → company filter). Pembayaran / Buku Kas / dashboard stay on
 * mock fixtures until their own doctypes land.
 */
import { useResourceList } from "@sekolahpro/api-client";
import { useActiveCompany } from "../lib/akuntansi-scope";
import type {
  TagihanRow,
  PengeluaranRow,
  StatusTagihan,
  StatusPengeluaran,
  KategoriPengeluaran,
  MetodeBayar,
} from "./keuangan";

export const KEUANGAN_DOCTYPE = {
  SCHOOL_FEE_INVOICE: "School Fee Invoice",
  SCHOOL_EXPENSE: "School Expense",
} as const;

/** Raw School Fee Invoice document as returned by the Frappe REST API. */
export interface FeeInvoiceDoc {
  name: string;
  posting_date: string;
  due_date?: string;
  company: string;
  student: string;
  student_name?: string;
  judul: string;
  jumlah: number;
  dibayar?: number;
  status: string;
  kelas?: string;
  tahun_ajaran?: string;
}

/** Raw School Expense document as returned by the Frappe REST API. */
export interface ExpenseDoc {
  name: string;
  posting_date: string;
  company: string;
  kategori: KategoriPengeluaran;
  deskripsi: string;
  jumlah: number;
  penerima?: string;
  metode?: MetodeBayar;
  status: StatusPengeluaran;
  approver?: string;
}

/** Translate the doctype's payment status into the UI StatusTagihan union. */
function mapInvoiceStatus(status: string): StatusTagihan {
  switch (status) {
    case "Lunas":
      return "Lunas";
    case "Sebagian":
      return "Cicilan";
    case "Belum Dibayar":
      return "Tertunda";
    case "Dibatalkan":
      return "Dibatalkan";
    default:
      return "Draft";
  }
}

/** Map a School Fee Invoice doc onto the UI TagihanRow shape. */
export function mapFeeInvoiceToTagihan(doc: FeeInvoiceDoc): TagihanRow {
  return {
    id: doc.name,
    siswa: doc.student_name || doc.student,
    kelas: doc.kelas ?? "—",
    judul: doc.judul,
    jatuhTempo: doc.due_date ?? doc.posting_date,
    jumlah: doc.jumlah,
    dibayar: doc.dibayar ?? 0,
    status: mapInvoiceStatus(doc.status),
    tahunAjaran: doc.tahun_ajaran ?? "—",
    // `sekolah` is vestigial in live mode (scoping is done by the company filter);
    // the column union is the mock slug type, so the company string is cast.
    sekolah: doc.company as TagihanRow["sekolah"],
  };
}

/** Map a School Expense doc onto the UI PengeluaranRow shape. */
export function mapExpenseToPengeluaran(doc: ExpenseDoc): PengeluaranRow {
  return {
    id: doc.name,
    tanggal: doc.posting_date,
    kategori: doc.kategori,
    deskripsi: doc.deskripsi,
    jumlah: doc.jumlah,
    penerima: doc.penerima ?? "—",
    metode: doc.metode ?? "Tunai",
    status: doc.status,
    ...(doc.approver ? { approver: doc.approver } : {}),
    sekolah: doc.company as PengeluaranRow["sekolah"],
  };
}

/** Result shape shared by the live list hooks. */
export interface LiveListResult<T> {
  rows: T[];
  isLoading: boolean;
  isError: boolean;
}

const INVOICE_FIELDS = [
  "name",
  "posting_date",
  "due_date",
  "company",
  "student",
  "student_name",
  "judul",
  "jumlah",
  "dibayar",
  "status",
  "kelas",
  "tahun_ajaran",
];

const EXPENSE_FIELDS = [
  "name",
  "posting_date",
  "company",
  "kategori",
  "deskripsi",
  "jumlah",
  "penerima",
  "metode",
  "status",
  "approver",
];

/** Live Tagihan list, scoped to the active company. */
export function useTagihanLive(): LiveListResult<TagihanRow> {
  const company = useActiveCompany();
  const q = useResourceList<FeeInvoiceDoc>(KEUANGAN_DOCTYPE.SCHOOL_FEE_INVOICE, {
    fields: INVOICE_FIELDS,
    filters: company ? [["company", "=", company]] : [],
    order_by: "posting_date desc, creation desc",
    limit_page_length: 0,
  });
  return {
    rows: (q.data ?? []).map(mapFeeInvoiceToTagihan),
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

/** Live Pengeluaran list, scoped to the active company. */
export function usePengeluaranLive(): LiveListResult<PengeluaranRow> {
  const company = useActiveCompany();
  const q = useResourceList<ExpenseDoc>(KEUANGAN_DOCTYPE.SCHOOL_EXPENSE, {
    fields: EXPENSE_FIELDS,
    filters: company ? [["company", "=", company]] : [],
    order_by: "posting_date desc, creation desc",
    limit_page_length: 0,
  });
  return {
    rows: (q.data ?? []).map(mapExpenseToPengeluaran),
    isLoading: q.isLoading,
    isError: q.isError,
  };
}
