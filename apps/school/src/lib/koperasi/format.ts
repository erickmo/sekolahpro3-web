/** Shared rupiah + date formatters for the Koperasi module UI. */

/** Format a number as Indonesian Rupiah, no decimals (e.g. "Rp 1.500.000"). */
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format an ISO date as a short Indonesian date (e.g. "01 Jun 2026"). Returns
 *  the raw input unchanged when it is not a parseable date. */
export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
