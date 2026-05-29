import { frappeFetch, FrappeError } from "@sekolahpro/api-client";
import { ChargeErrorCode } from "./error-codes";

export interface CatalogItem {
  name: string;
  nama: string;
  harga: number;
  kategori_item: string;
  aktif: boolean;
  track_stok: boolean;
  stok_qty: number | null;
}

export interface ChargeInput {
  terminal_id: string;
  card_token: string;
  items: { name: string; qty: number }[];
  amount: number;
  idempotency_key: string;
}

export interface ChargeResult {
  txn_name: string;
  nama_siswa: string;
  balance_after: number;
  void_deadline_iso: string;
  replayed?: boolean;
}

export interface MerchantTxn {
  name: string;
  kartu: string;
  nama_siswa?: string;
  nominal: number;
  items: { name: string; qty: number; price: number }[];
  merchant: string;
  terminal_id: string;
  tanggal: string;
  status: "Bayar" | "Void";
  void_deadline_iso: string;
}

export interface DailyReport {
  total_transaksi: number;
  total_nominal: number;
  by_item: { name: string; nama: string; qty: number }[];
}

export class ChargeError extends Error {
  readonly code: ChargeErrorCode;
  constructor(code: ChargeErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ChargeError";
    this.code = code;
  }
}

/**
 * The backend reports business errors as a non-2xx response whose body is
 * `{ message: { error: "CODE" } }`. `frappeFetch` turns that into a thrown
 * `FrappeError` carrying the raw body in `.payload`. Map it to a typed
 * `ChargeError`; anything unrecognised falls back to UNKNOWN.
 */
function toChargeError(e: unknown): ChargeError {
  if (e instanceof FrappeError) {
    const payload = e.payload as { message?: { error?: string } } | undefined;
    const raw = payload?.message?.error;
    const code =
      raw && raw in ChargeErrorCode
        ? (ChargeErrorCode as Record<string, ChargeErrorCode>)[raw] ?? ChargeErrorCode.UNKNOWN
        : ChargeErrorCode.UNKNOWN;
    return new ChargeError(code);
  }
  if (e instanceof ChargeError) return e;
  return new ChargeError(ChargeErrorCode.UNKNOWN, e instanceof Error ? e.message : undefined);
}

async function call<T>(method: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await frappeFetch<T>(method, args ?? {});
  } catch (e) {
    throw toChargeError(e);
  }
}

const M = "sekolahpro.koperasi.merchant";

export const merchantApi = {
  getCatalog: () => call<CatalogItem[]>(`${M}.catalog`),
  charge: (input: ChargeInput) => call<ChargeResult>(`${M}.charge`, { ...input }),
  void: (txn_name: string, reason: string) => call<{ ok: true }>(`${M}.void`, { txn_name, reason }),
  listTransaksi: () => call<MerchantTxn[]>(`${M}.transaksi`),
  dailyReport: () => call<DailyReport>(`${M}.daily_report`),
};
