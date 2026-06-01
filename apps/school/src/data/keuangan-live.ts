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
  PembayaranRow,
  PengeluaranRow,
  KasRow,
  RingkasanBulan,
  StatusTagihan,
  StatusPengeluaran,
  KategoriPengeluaran,
  MetodeBayar,
} from "./keuangan";

export const KEUANGAN_DOCTYPE = {
  SCHOOL_FEE_INVOICE: "School Fee Invoice",
  SCHOOL_FEE_PAYMENT: "School Fee Payment",
  SCHOOL_EXPENSE: "School Expense",
} as const;

/** Indonesian short month names, indexed 1..12. */
const BULAN_SINGKAT = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

/** A paid expense is one whose status marks cash actually leaving. */
const CASH_OUT_STATUS = "Dibayar";

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
  /** Re-fetch the underlying list (e.g. after a create). */
  refetch: () => void;
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
    refetch: () => void q.refetch(),
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
    refetch: () => void q.refetch(),
  };
}

/** Raw School Fee Payment document as returned by the Frappe REST API. */
export interface PaymentDoc {
  name: string;
  posting_date: string;
  company: string;
  student: string;
  student_name?: string;
  judul?: string;
  invoice?: string;
  metode?: MetodeBayar;
  jumlah: number;
  ref?: string;
  penerima?: string;
  kelas?: string;
}

/** Map a School Fee Payment doc onto the UI PembayaranRow shape. */
export function mapPaymentToPembayaran(doc: PaymentDoc): PembayaranRow {
  return {
    id: doc.name,
    tanggal: doc.posting_date,
    siswa: doc.student_name || doc.student,
    kelas: doc.kelas ?? "—",
    judul: doc.judul ?? "—",
    metode: doc.metode ?? "Tunai",
    jumlah: doc.jumlah,
    ref: doc.ref ?? "—",
    penerima: doc.penerima ?? "—",
    tagihanId: doc.invoice ?? "",
    sekolah: doc.company as PembayaranRow["sekolah"],
  };
}

const PAYMENT_FIELDS = [
  "name",
  "posting_date",
  "company",
  "student",
  "student_name",
  "judul",
  "invoice",
  "metode",
  "jumlah",
  "ref",
  "penerima",
];

/** Live Pembayaran list, scoped to the active company. */
export function usePembayaranLive(): LiveListResult<PembayaranRow> {
  const company = useActiveCompany();
  const q = useResourceList<PaymentDoc>(KEUANGAN_DOCTYPE.SCHOOL_FEE_PAYMENT, {
    fields: PAYMENT_FIELDS,
    filters: company ? [["company", "=", company]] : [],
    order_by: "posting_date desc, creation desc",
    limit_page_length: 0,
  });
  return {
    rows: (q.data ?? []).map(mapPaymentToPembayaran),
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => void q.refetch(),
  };
}

/** Minimal shape needed to roll up a day of cash / a month of activity. */
interface DatedAmount {
  tanggal: string;
  jumlah: number;
}
interface DatedExpense extends DatedAmount {
  status: string;
}

/** Sum amounts by ISO date into a map. */
function sumByDate(rows: ReadonlyArray<DatedAmount>): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.tanggal, (m.get(r.tanggal) ?? 0) + r.jumlah);
  return m;
}

/**
 * Derive a daily cash book from payments (cash in) and PAID expenses (cash out),
 * carrying a running balance. Days with no activity are omitted.
 */
export function deriveKasRows(
  payments: ReadonlyArray<DatedAmount>,
  expenses: ReadonlyArray<DatedExpense>,
): KasRow[] {
  const masukByDate = sumByDate(payments);
  const keluarByDate = sumByDate(expenses.filter((e) => e.status === CASH_OUT_STATUS));
  const dates = [...new Set([...masukByDate.keys(), ...keluarByDate.keys()])].sort();

  let saldo = 0;
  return dates.map((tanggal) => {
    const masuk = masukByDate.get(tanggal) ?? 0;
    const keluar = keluarByDate.get(tanggal) ?? 0;
    const saldoAwal = saldo;
    const saldoAkhir = saldoAwal + masuk - keluar;
    saldo = saldoAkhir;
    return {
      tanggal,
      saldoAwal,
      masuk,
      keluar,
      saldoAkhir,
      sekolah: "" as KasRow["sekolah"],
    };
  });
}

/** Roll up payments (income) and paid expenses by month, chronologically. */
export function aggregateMonthly(
  payments: ReadonlyArray<DatedAmount>,
  expenses: ReadonlyArray<DatedExpense>,
): RingkasanBulan[] {
  const months = new Map<string, { pemasukan: number; pengeluaran: number }>();
  const bucket = (key: string) => {
    const existing = months.get(key);
    if (existing) return existing;
    const created = { pemasukan: 0, pengeluaran: 0 };
    months.set(key, created);
    return created;
  };
  for (const p of payments) bucket(p.tanggal.slice(0, 7)).pemasukan += p.jumlah;
  for (const e of expenses) {
    if (e.status === CASH_OUT_STATUS) bucket(e.tanggal.slice(0, 7)).pengeluaran += e.jumlah;
  }
  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const monthIndex = Number(key.slice(5, 7));
      return {
        bulan: BULAN_SINGKAT[monthIndex] ?? key,
        pemasukan: v.pemasukan,
        pengeluaran: v.pengeluaran,
        saldo: v.pemasukan - v.pengeluaran,
      };
    });
}

/** Live daily cash book, derived from live payments + paid expenses. */
export function useKasLive(): LiveListResult<KasRow> {
  const pay = usePembayaranLive();
  const exp = usePengeluaranLive();
  return {
    rows: deriveKasRows(pay.rows, exp.rows),
    isLoading: pay.isLoading || exp.isLoading,
    isError: pay.isError || exp.isError,
    refetch: () => { pay.refetch(); exp.refetch(); },
  };
}
