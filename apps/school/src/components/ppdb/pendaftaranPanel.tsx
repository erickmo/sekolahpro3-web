/**
 * Presentational + enrichment helpers for the Pendaftaran PPDB list page.
 *
 * Extracted from the route file so the page stays under the 300-line budget
 * (Vernon). ONLY sch.$sekolah.ppdb.daftar.tsx imports this module.
 *
 * Enrichment rationale: the live backend list is lean (name/status/gelombang/
 * calon/tanggal). To preview the richer redesign (doc-completeness + payment
 * health) before those fields land in the API, we match each row to the mock
 * {@link Pendaftar} fixture by candidate name and derive the extras locally.
 */

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Badge, Button, Modal, type Column } from "@sekolahpro/ui";
import { DistributionBar, ProgressRing } from "../viz";
import { docCompleteness, statusDistribution } from "../../lib/ppdbAnalytics";
import { TONE_BY_STATUS, type VerifikasiStatus } from "../../lib/ppdbApi";
import type { Pendaftar, PembayaranPpdbRow } from "../../data/ppdb";

// Target statuses offered by the bulk-verifikasi modal (whitelisted endpoint).
const VERIFIKASI_OPTIONS: VerifikasiStatus[] = [
  "Diverifikasi",
  "Seleksi",
  "Diterima",
  "Ditolak",
];

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
 * Reduce a pendaftar's payment rows to one aggregate health badge.
 * Priority reflects urgency: any Tertunda dominates, then Cicilan, else Lunas.
 */
export function paymentHealth(rows: PembayaranPpdbRow[]): PaymentHealth {
  if (rows.length === 0) return EMPTY_DASH;
  // Early returns by descending urgency so the dot surfaces the worst state.
  if (rows.some((r) => r.status === "Tertunda")) return "Tertunda";
  if (rows.some((r) => r.status === "Cicilan")) return "Cicilan";
  return "Lunas";
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

/** Doc-completeness mini ring cell — shows pct of accepted documents. */
function DocCell({ matched }: { matched: Pendaftar | undefined }): ReactNode {
  if (!matched) return <span className="text-xs text-muted-fg">{EMPTY_DASH}</span>;
  const { done, total, pct } = docCompleteness(matched);
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
function PaymentCell({ matched }: { matched: Pendaftar | undefined }): ReactNode {
  const health: PaymentHealth = matched ? paymentHealth(matched.pembayaran) : EMPTY_DASH;
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
 * doc-completeness ring and payment-health dot derived from the mock fixture.
 */
export function buildEnrichedColumns(
  sekolah: string,
  byName: Map<string, Pendaftar>,
): Column<PendaftaranRow>[] {
  return [
    {
      key: "name",
      header: "No. Pendaftaran",
      sortable: true,
      cell: (r) => (
        <Link
          to="/sch/$sekolah/akademik/ppdb/$noPendaftaran"
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
      cell: (r) => <DocCell matched={matchPendaftar(r, byName)} />,
    },
    {
      key: "pembayaran",
      header: "Pembayaran",
      cell: (r) => <PaymentCell matched={matchPendaftar(r, byName)} />,
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

export interface BulkVerifikasiModalProps {
  open: boolean;
  count: number;
  target: VerifikasiStatus;
  pending: boolean;
  onSelect: (status: VerifikasiStatus) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** Target-status chip — toggled selected styling, no magic class strings. */
function TargetChip({
  status, active, onClick,
}: { status: VerifikasiStatus; active: boolean; onClick: () => void }): ReactNode {
  const base = "rounded-md border px-3 py-1.5 text-xs font-medium transition ";
  const variant = active
    ? "border-brand bg-brand text-white"
    : "border-border bg-card hover:border-brand";
  return (
    <button type="button" onClick={onClick} className={base + variant}>
      {status}
    </button>
  );
}

/** Modal letting a manager pick the target status for a bulk verification. */
export function BulkVerifikasiModal({
  open, count, target, pending, onSelect, onConfirm, onClose,
}: BulkVerifikasiModalProps): ReactNode {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Verifikasi ${count} Pendaftaran`}
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? "Memproses..." : "Konfirmasi"}
          </Button>
        </div>
      }
    >
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-fg">Status Tujuan</label>
        <div className="flex flex-wrap gap-2">
          {VERIFIKASI_OPTIONS.map((s) => (
            <TargetChip key={s} status={s} active={target === s} onClick={() => onSelect(s)} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

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
