/**
 * opnameSession — pure types + helpers for the Stock Opname scan session
 * (layer: lib / pure).
 *
 * No React, no side-effects: just the shared types, the localStorage draft key,
 * the default header factory and the server payload builder. Split out of
 * {@link useOpnameSession} so the hook stays focused on lifecycle/state and
 * every pure piece is independently testable.
 */
import { perpToday } from "./perpFormatters";

/** Frappe doctype backing a stock-opname session. */
export const OPNAME_DOCTYPE = "Stock Opname Perpustakaan";

/** Debounce window (ms) before an autosave fires after the last change. */
export const AUTOSAVE_MS = 800;

/** One scanned eksemplar row plus the moment it was scanned. */
export type ScanRow = {
  eksemplar: string;
  status_temuan: "Hadir" | "Hilang" | "Rusak";
  lokasi_rak_aktual?: string;
  catatan?: string;
  scanned_at: number;
};

/** The full opname document header + its scanned items. */
export type Header = {
  name?: string;
  tanggal: string;
  lokasi_rak_filter: string;
  auditor: string;
  catatan: string;
  items: ScanRow[];
  docstatus?: number;
};

/** Derived per-status counts shown in the StatCard strip. */
export interface OpnameStats {
  total: number;
  hadir: number;
  hilang: number;
  rusak: number;
}

/** Auditor dropdown option. */
export interface AuditorOption {
  value: string;
  label: string;
}

/** Build a blank header for a fresh session (today's date, no items). */
export function defaultHeader(): Header {
  return {
    tanggal: perpToday(),
    lokasi_rak_filter: "",
    auditor: "",
    catatan: "",
    items: [],
  };
}

/** localStorage key for a per-doc draft backup. */
export function lsKey(name: string): string {
  return `perp:opname:draft:${name}`;
}

/**
 * Transform an in-memory header into the server save payload, computing the
 * Hilang/Rusak rollups and normalizing optional row fields to empty strings.
 */
export function buildOpnamePayload(doc: Header): Record<string, unknown> {
  return {
    tanggal: doc.tanggal,
    lokasi_rak_filter: doc.lokasi_rak_filter,
    auditor: doc.auditor,
    catatan: doc.catatan,
    total_scan: doc.items.length,
    total_hilang: doc.items.filter((i) => i.status_temuan === "Hilang").length,
    total_rusak: doc.items.filter((i) => i.status_temuan === "Rusak").length,
    items: doc.items.map((it) => ({
      eksemplar: it.eksemplar,
      status_temuan: it.status_temuan,
      lokasi_rak_aktual: it.lokasi_rak_aktual ?? "",
      catatan: it.catatan ?? "",
    })),
  };
}

/** Compute derived per-status counts from the scanned items. */
export function computeOpnameStats(items: ReadonlyArray<ScanRow>): OpnameStats {
  return {
    total: items.length,
    hadir: items.filter((i) => i.status_temuan === "Hadir").length,
    hilang: items.filter((i) => i.status_temuan === "Hilang").length,
    rusak: items.filter((i) => i.status_temuan === "Rusak").length,
  };
}
