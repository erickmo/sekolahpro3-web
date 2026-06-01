/**
 * Presentational + enrichment helpers for the Pendaftaran PPDB list page.
 *
 * Extracted from the route file so the page stays under the 300-line budget
 * (Vernon). ONLY sch.$sekolah.ppdb.daftar.tsx imports this module.
 *
 * Enrichment source (GAP 4): the doc-completeness ring and payment-health dot
 * are derived from the LIVE Dokumen PPDB + Pembayaran PPDB lists, keyed by
 * `pendaftaran_ppdb` = row.name. When live has no entry for a given row we fall
 * back to matching the mock {@link Pendaftar} fixture by candidate name, so the
 * table never goes blank when the backend returns nothing for that pendaftaran.
 */

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { DistributionBar, ProgressRing } from "../viz";
import { docCompleteness, statusDistribution } from "../../lib/ppdbAnalytics";
import { TONE_BY_STATUS } from "../../lib/ppdbApi";
import type { PembayaranLiveRow } from "../../lib/ppdbLive";
import type { Pendaftar } from "../../data/ppdb";

/** Lean row shape returned by the Pendaftaran PPDB list endpoint. */
export interface PendaftaranRow {
  name: string;
  status?: string;
  gelombang_ppdb?: string;
  calon_siswa?: string;
  tanggal_daftar?: string;
}

/** Aggregate payment health derived from a pendaftar's payment rows. */
type PaymentHealth = "Lunas" | "Cicilan" | "Tertunda" | "—";

/** A resolved doc-completeness ring value (live- or mock-derived). */
type DocStats = { done: number; total: number; pct: number };

/** Live enrichment maps keyed by pendaftaran_ppdb (= row.name). */
export interface LiveEnrichment {
  /** Per-pendaftaran doc completeness from useDokumenLive (empty when none). */
  docByPendaftaran: Record<string, DocStats>;
  /** Per-pendaftaran payment health from usePembayaranLive (empty when none). */
  paymentByPendaftaran: Record<string, PaymentHealth>;
}

// Payment-status strings shared by mock + live rows (backend vocabulary).
const STATUS_TERTUNDA = "Tertunda";
const STATUS_CICILAN = "Cicilan";
const STATUS_LUNAS = "Lunas";

// Dot color per payment health — Tailwind theme tokens, never raw hex.
const PAYMENT_DOT_CLASS: Record<PaymentHealth, string> = {
  Lunas: "bg-emerald-500",
  Cicilan: "bg-amber-500",
  Tertunda: "bg-rose-500",
  "—": "bg-muted-fg/30",
};

const EMPTY_DASH = "—";
const RING_SIZE = 40;
const RING_THICKNESS = 5;

/**
 * Reduce payment rows (mock OR live — both carry a `status` field) to one
 * aggregate health. Priority reflects urgency: any Tertunda dominates, then
 * Cicilan, else Lunas. Empty input yields the em-dash placeholder.
 */
export function paymentHealth(rows: { status?: string }[]): PaymentHealth {
  if (rows.length === 0) return EMPTY_DASH;
  // Early returns by descending urgency so the dot surfaces the worst state.
  if (rows.some((r) => r.status === STATUS_TERTUNDA)) return STATUS_TERTUNDA;
  if (rows.some((r) => r.status === STATUS_CICILAN)) return STATUS_CICILAN;
  return STATUS_LUNAS;
}

/**
 * Build a pendaftaran_ppdb → payment-health map from live Pembayaran rows.
 * Rows are bucketed by their owning pendaftaran, then each bucket reduced via
 * {@link paymentHealth}. Rows without a pendaftaran_ppdb key are skipped.
 */
export function paymentHealthByPendaftaranLive(
  rows: PembayaranLiveRow[],
): Record<string, PaymentHealth> {
  const buckets = new Map<string, PembayaranLiveRow[]>();
  for (const row of rows) {
    const key = row.pendaftaran_ppdb;
    if (!key) continue; // unattributed payment — cannot key a dot.
    const list = buckets.get(key) ?? [];
    list.push(row);
    buckets.set(key, list);
  }
  const out: Record<string, PaymentHealth> = {};
  for (const [key, list] of buckets) out[key] = paymentHealth(list);
  return out;
}

/** Build a name → mock Pendaftar lookup so enrichment is O(1) per row. */
export function indexByName(list: Pendaftar[]): Map<string, Pendaftar> {
  const index = new Map<string, Pendaftar>();
  for (const p of list) {
    // First write wins; duplicate display names are rare in the fixture.
    if (!index.has(p.namaLengkap)) index.set(p.namaLengkap, p);
  }
  return index;
}

/** Resolve the mock pendaftar matching a live row by candidate name. */
function matchPendaftar(
  row: PendaftaranRow,
  byName: Map<string, Pendaftar>,
): Pendaftar | undefined {
  const key = row.calon_siswa;
  if (!key) return undefined;
  return byName.get(key);
}

/** Doc-completeness for a row: LIVE map (by row.name) first, else mock match. */
function resolveDocStats(
  row: PendaftaranRow,
  live: Record<string, DocStats>,
  byName: Map<string, Pendaftar>,
): DocStats | undefined {
  const liveStats = live[row.name];
  // Live wins when present (total > 0 means the backend actually returned docs).
  if (liveStats && liveStats.total > 0) return liveStats;
  const matched = matchPendaftar(row, byName);
  return matched ? docCompleteness(matched) : undefined;
}

/** Payment health for a row: LIVE map (by row.name) first, else mock, else —. */
function resolvePaymentHealth(
  row: PendaftaranRow,
  live: Record<string, PaymentHealth>,
  byName: Map<string, Pendaftar>,
): PaymentHealth {
  const liveHealth = live[row.name];
  if (liveHealth) return liveHealth;
  const matched = matchPendaftar(row, byName);
  return matched ? paymentHealth(matched.pembayaran) : EMPTY_DASH;
}

/** Doc-completeness mini ring cell — shows pct of accepted documents. */
function DocCell({ stats }: { stats: DocStats | undefined }): ReactNode {
  if (!stats) return <span className="text-xs text-muted-fg">{EMPTY_DASH}</span>;
  const { done, total, pct } = stats;
  return (
    <div className="flex items-center gap-2">
      <ProgressRing value={pct} size={RING_SIZE} thickness={RING_THICKNESS} />
      <span className="text-xs text-muted-fg tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}

/** Payment-health dot cell — single colored dot summarizing payment state. */
function PaymentCell({ health }: { health: PaymentHealth }): ReactNode {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${PAYMENT_DOT_CLASS[health]}`}
        aria-hidden="true"
      />
      <span className="text-xs text-muted-fg">{health}</span>
    </span>
  );
}

/**
 * Column set for the enriched Pendaftaran table: base identity columns plus the
 * doc-completeness ring and payment-health dot. Enrichment reads the LIVE maps
 * first (keyed by row.name) and falls back to the mock fixture by candidate name.
 */
export function buildEnrichedColumns(
  sekolah: string,
  byName: Map<string, Pendaftar>,
  live: LiveEnrichment,
): Column<PendaftaranRow>[] {
  return [
    {
      key: "name",
      header: "No. Pendaftaran",
      sortable: true,
      cell: (r) => (
        <Link
          to="/sch/$sekolah/ppdb/$noPendaftaran"
          params={{ sekolah, noPendaftaran: r.name }}
          className="font-mono text-xs text-brand hover:underline"
        >
          {r.name}
        </Link>
      ),
    },
    { key: "calon_siswa", header: "Calon Siswa", sortable: true, cell: (r) => r.calon_siswa ?? EMPTY_DASH },
    { key: "gelombang_ppdb", header: "Gelombang", cell: (r) => r.gelombang_ppdb ?? EMPTY_DASH },
    {
      key: "dokumen",
      header: "Dokumen",
      cell: (r) => <DocCell stats={resolveDocStats(r, live.docByPendaftaran, byName)} />,
    },
    {
      key: "pembayaran",
      header: "Pembayaran",
      cell: (r) => (
        <PaymentCell health={resolvePaymentHealth(r, live.paymentByPendaftaran, byName)} />
      ),
    },
    { key: "tanggal_daftar", header: "Tanggal Daftar", sortable: true, cell: (r) => r.tanggal_daftar ?? EMPTY_DASH },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={TONE_BY_STATUS[r.status ?? ""] ?? "neutral"} dot>
          {r.status ?? EMPTY_DASH}
        </Badge>
      ),
    },
  ];
}

/**
 * Status distribution strip rendered above the table. Counts each pipeline
 * stage across the visible rows; renders nothing when there are no rows so the
 * page does not show an empty bar.
 */
export function StatusDistributionStrip({ rows }: { rows: PendaftaranRow[] }): ReactNode {
  if (rows.length === 0) return null;
  const segments = statusDistribution(rows);
  return (
    <div className="border-b border-border px-4 py-3">
      <p className="mb-2 text-xs font-medium text-muted-fg">Komposisi status</p>
      <DistributionBar segments={segments} />
    </div>
  );
}

export interface BulkActionBarProps {
  count: number;
  canAjukan: boolean;
  ajukanPending: boolean;
  verifikasiPending: boolean;
  onAjukan: () => void;
  onVerifikasi: () => void;
  onCancel: () => void;
}

// Tooltip shown when Ajukan Massal is disabled (non-Draft rows in selection).
const AJUKAN_DISABLED_HINT = "Hanya pendaftaran berstatus Draft yang bisa diajukan";

/** Selection toolbar above the table — bulk Ajukan/Verifikasi/Batal actions. */
export function BulkActionBar({
  count, canAjukan, ajukanPending, verifikasiPending, onAjukan, onVerifikasi, onCancel,
}: BulkActionBarProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-3 border-y border-border bg-brand/5 px-4 py-3">
      <span className="text-sm text-fg">
        <strong className="tabular-nums">{count}</strong> dipilih
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button
          size="sm" variant="outline"
          disabled={!canAjukan || ajukanPending}
          onClick={onAjukan}
          title={canAjukan ? "" : AJUKAN_DISABLED_HINT}
        >
          Ajukan Massal
        </Button>
        <Button size="sm" variant="outline" disabled={verifikasiPending} onClick={onVerifikasi}>
          Verifikasi Massal
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  );
}

// Bulk-verification modal lives in its own file (Vernon 300-line budget);
// re-exported here so the route imports everything from one panel module.
export {
  BulkVerifikasiModal,
  type BulkVerifikasiModalProps,
} from "./bulkVerifikasiModal";

// Static guide content — Bahasa Indonesia UI strings, no inline magic strings.
export const PENDAFTARAN_GUIDE = {
  intro:
    "Halaman ini mengelola seluruh pendaftaran calon siswa: tambah pendaftar, ajukan, verifikasi, dan pantau kelengkapan dokumen serta pembayaran.",
  steps: [
    { title: "Tambah pendaftar", detail: "Gunakan tombol Tambah Pendaftar untuk memilih calon siswa dan gelombang aktif." },
    { title: "Pilih beberapa baris", detail: "Centang baris untuk mengaktifkan aksi massal Ajukan atau Verifikasi." },
    { title: "Pantau kelengkapan", detail: "Kolom Dokumen menampilkan persentase berkas diterima; titik Pembayaran menandai status tagihan." },
  ],
  tips: [
    "Hanya pendaftaran berstatus Draft yang dapat diajukan secara massal.",
    "Strip komposisi status di atas tabel meringkas sebaran seluruh baris yang tampil.",
  ],
} as const;
