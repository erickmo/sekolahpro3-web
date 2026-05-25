// Shared formatters for perpustakaan sub-routes (P2).

export function perpFormatRupiah(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export function perpFormatDate(value: string | undefined | null): string {
  if (!value) return "—";
  return value;
}

export function perpToday(): string {
  return new Date().toISOString().slice(0, 10);
}
