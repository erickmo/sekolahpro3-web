/**
 * Pure helpers + constants for the inbound "Masuk" lane (public-contact inbox).
 *
 * Extracted verbatim from the original sch.$sekolah.pesan.tsx route so the same logic
 * is shared by the TU MasukDesk and the Kepsek oversight panel, and is unit-testable
 * without React. Behavior is unchanged from the pre-split route.
 */

/** Backend doctype: inbound public-contact messages. */
export const INBOX_DOCTYPE = "Contact Inbox SekolahPro";
/** Backend doctype: append-only outbound dispatch queue. */
export const OUTBOX_DOCTYPE = "Mobile Outbox Entry";

/** A row of the public-contact inbox. */
export interface InboxRow {
  name: string;
  nama: string;
  email?: string;
  telepon?: string;
  pesan?: string;
  status?: "Baru" | "Dibalas" | "Selesai";
  submitted_at?: string;
  creation?: string;
}

/** Badge tone per inbox status. */
export const STATUS_TONE: Record<string, "warning" | "brand" | "success" | "neutral"> = {
  Baru: "warning",
  Dibalas: "brand",
  Selesai: "success",
};

/** Status filter pills (Semua = no filter). */
export const FILTERS = ["Semua", "Baru", "Dibalas", "Selesai"] as const;
export type FilterKey = (typeof FILTERS)[number];

/** Counts of each inbox status, for the StatCards / SLA panel. */
export interface InboxStats {
  total: number;
  baru: number;
  dibalas: number;
  selesai: number;
}

/** Format an ISO timestamp as a compact id-ID date-time, or "—"/raw on bad input. */
export function formatWaktu(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Strip HTML tags for safe text rendering (backend stores Text Editor HTML). */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

/** Filter inbox rows by free-text search (nama+email+pesan) and status pill. */
export function filterInbox(
  items: readonly InboxRow[],
  search: string,
  filter: FilterKey,
): InboxRow[] {
  const q = search.trim().toLowerCase();
  return items.filter((p) => {
    if (q && !`${p.nama} ${p.email ?? ""} ${p.pesan ?? ""}`.toLowerCase().includes(q)) return false;
    if (filter !== "Semua" && p.status !== filter) return false;
    return true;
  });
}

/** Tally inbox rows by status. */
export function computeInboxStats(items: readonly InboxRow[]): InboxStats {
  return {
    total: items.length,
    baru: items.filter((p) => p.status === "Baru").length,
    dibalas: items.filter((p) => p.status === "Dibalas").length,
    selesai: items.filter((p) => p.status === "Selesai").length,
  };
}
