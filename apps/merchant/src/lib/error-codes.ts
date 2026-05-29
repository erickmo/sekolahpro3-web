export const ChargeErrorCode = {
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",
  KATEGORI_BLOCKED: "KATEGORI_BLOCKED",
  CARD_INVALID: "CARD_INVALID",
  CARD_EXPIRED: "CARD_EXPIRED",
  TERMINAL_INACTIVE: "TERMINAL_INACTIVE",
  RATE_LIMITED: "RATE_LIMITED",
  OFFLINE: "OFFLINE",
  NETWORK: "NETWORK",
  STOCK_EMPTY: "STOCK_EMPTY",
  UNKNOWN: "UNKNOWN",
} as const;
export type ChargeErrorCode = typeof ChargeErrorCode[keyof typeof ChargeErrorCode];

const MESSAGES: Record<ChargeErrorCode, string> = {
  INSUFFICIENT_FUNDS: "Saldo tidak cukup dan postpaid tidak aktif.",
  DAILY_LIMIT_EXCEEDED: "Limit harian siswa terlampaui.",
  KATEGORI_BLOCKED: "Kategori merchant diblokir ortu.",
  CARD_INVALID: "Kartu tidak valid.",
  CARD_EXPIRED: "Token kartu kedaluwarsa, tap ulang.",
  TERMINAL_INACTIVE: "Terminal tidak aktif.",
  RATE_LIMITED: "Terlalu banyak transaksi, tunggu sebentar.",
  OFFLINE: "Tidak ada koneksi internet.",
  NETWORK: "Gagal menghubungi server.",
  STOCK_EMPTY: "Stok produk habis.",
  UNKNOWN: "Kesalahan tidak diketahui.",
};

export function chargeErrorMessage(code: ChargeErrorCode): string {
  return MESSAGES[code] ?? "Kesalahan tidak diketahui.";
}
