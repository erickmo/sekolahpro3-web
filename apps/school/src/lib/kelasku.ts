/**
 * Pure helpers for the Wali Kelas "Kelasku" cockpit: resolve the teacher's own
 * rombel (one / zero / many), sort the seat-ordered roster, and build parent
 * contact deep-links. Kept pure + tested so the cockpit route stays thin.
 */

/** A Rombongan Belajar owned by the logged-in wali. */
export interface KelaskuRombel {
  name: string;
  nama_rombel?: string;
  tingkat?: number | string;
  wali_kelas?: string;
  status?: string;
  jumlah_siswa?: number;
}

/** An Anggota Rombel row (child) for the roster. */
export interface KelaskuAnggota {
  siswa: string;
  no_urut?: number;
  status?: string;
}

const STATUS_AKTIF = "Aktif";

/** Resolution of how many active rombel the wali owns. */
export type KelaskuResolution =
  | { kind: "none" }
  | { kind: "one"; rombel: KelaskuRombel }
  | { kind: "many"; rombels: KelaskuRombel[]; active: KelaskuRombel };

/**
 * Resolve the wali's cockpit target. `preferredName` (e.g. from a ?rombel= param)
 * picks the active one in the multi-class case; otherwise the first is active.
 */
export function resolveKelasku(
  rombels: KelaskuRombel[],
  preferredName?: string,
): KelaskuResolution {
  if (rombels.length === 0) return { kind: "none" };
  if (rombels.length === 1) return { kind: "one", rombel: rombels[0]! };
  const active = rombels.find((r) => r.name === preferredName) ?? rombels[0]!;
  return { kind: "many", rombels, active };
}

/** Active members only, sorted by seat number (no_urut) ascending. */
export function sortRoster(anggota: KelaskuAnggota[]): KelaskuAnggota[] {
  return anggota
    .filter((a) => a.status === STATUS_AKTIF)
    .slice()
    .sort((a, b) => (a.no_urut ?? Number.POSITIVE_INFINITY) - (b.no_urut ?? Number.POSITIVE_INFINITY));
}

/**
 * Normalize an Indonesian phone number to international `62…` digit form.
 * Strips non-digits, then maps a leading `0` to `62`.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

/** WhatsApp deep-link for a parent phone number. */
export function waLink(phone: string): string {
  return `https://wa.me/${normalizePhone(phone)}`;
}

/** Dialer deep-link for a parent phone number. */
export function telLink(phone: string): string {
  return `tel:+${normalizePhone(phone)}`;
}
