/**
 * Column definitions, totals footers, and CSV row mappers for the four koperasi
 * detail reports. Kept out of the route so kop.$sekolah.laporan.tsx stays a thin
 * shell (date state + fetch + aggregate + render). Display uses formatRupiah;
 * CSV rows stay raw numeric so the export is spreadsheet-usable.
 */
import { Badge, type Column } from "@sekolahpro/ui";
import { formatRupiah } from "../../lib/koperasi/format";
import type {
  ArusKasRekap,
  ArusKasTeller,
  KomposisiRekap,
  KomposisiStatus,
  KualitasRekap,
  KualitasStatus,
  MutasiJenis,
  MutasiSimpananRekap,
} from "../../lib/koperasi/laporan";

/** Render a number as a right-aligned rupiah cell. */
function rp(n: number) {
  return <span className="tabular-nums">{formatRupiah(n)}</span>;
}

/** Format a 0..1 ratio as a percentage string (e.g. 0.1428 → "14,29%"). */
export function formatPersen(ratio: number): string {
  return `${(ratio * 100).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;
}

interface FooterItem {
  label: string;
  value: string;
  tone?: "default" | "danger" | "success";
}

/** Totals strip rendered under a report table via DataTable's footer slot. */
export function FooterStrip({ items }: { items: FooterItem[] }) {
  const toneClass = { default: "text-fg", danger: "text-danger", success: "text-success" } as const;
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border bg-muted/30 px-4 py-3 text-sm">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className="text-xs text-muted-fg">{it.label}</span>
          <span className={`font-semibold tabular-nums ${toneClass[it.tone ?? "default"]}`}>{it.value}</span>
        </span>
      ))}
    </div>
  );
}

// ── Mutasi Simpanan ────────────────────────────────────────────────────────
export const MUTASI_COLUMNS: Column<MutasiJenis>[] = [
  { key: "jenis", header: "Jenis", cell: (r) => r.jenis },
  {
    key: "arah",
    header: "Arah",
    cell: (r) => (
      <Badge tone={r.arah === "kredit" ? "success" : "warning"}>
        {r.arah === "kredit" ? "Kredit" : "Debit"}
      </Badge>
    ),
  },
  { key: "count", header: "Transaksi", align: "right", cell: (r) => <span className="tabular-nums">{r.count}</span> },
  { key: "total", header: "Total", align: "right", cell: (r) => rp(r.total) },
];

export function MutasiFooter({ rekap }: { rekap: MutasiSimpananRekap }) {
  return (
    <FooterStrip
      items={[
        { label: "Kredit", value: formatRupiah(rekap.totalKredit), tone: "success" },
        { label: "Debit", value: formatRupiah(rekap.totalDebit), tone: "danger" },
        { label: "Net", value: formatRupiah(rekap.net), tone: rekap.net >= 0 ? "success" : "danger" },
      ]}
    />
  );
}

export function csvMutasi(rekap: MutasiSimpananRekap): Record<string, unknown>[] {
  return rekap.perJenis.map((p) => ({
    Jenis: p.jenis,
    Arah: p.arah,
    "Jumlah Transaksi": p.count,
    Total: p.total,
  }));
}

// ── Arus Kas Teller ────────────────────────────────────────────────────────
export const ARUS_COLUMNS: Column<ArusKasTeller>[] = [
  { key: "teller", header: "Teller", cell: (r) => r.teller },
  { key: "sesi", header: "Sesi", align: "right", cell: (r) => <span className="tabular-nums">{r.sesi}</span> },
  { key: "setoran", header: "Setoran", align: "right", cell: (r) => rp(r.setoran) },
  { key: "penarikan", header: "Penarikan", align: "right", cell: (r) => rp(r.penarikan) },
  { key: "net", header: "Net Kas", align: "right", cell: (r) => rp(r.net) },
];

export function ArusFooter({ rekap }: { rekap: ArusKasRekap }) {
  return (
    <FooterStrip
      items={[
        { label: "Setoran", value: formatRupiah(rekap.totalSetoran), tone: "success" },
        { label: "Penarikan", value: formatRupiah(rekap.totalPenarikan), tone: "danger" },
        { label: "Net Kas", value: formatRupiah(rekap.netKas) },
        {
          label: "Selisih",
          value: `${formatRupiah(rekap.totalSelisih)} · ${rekap.sesiBermasalah} sesi`,
          tone: rekap.totalSelisih === 0 ? "success" : "danger",
        },
      ]}
    />
  );
}

export function csvArus(rekap: ArusKasRekap): Record<string, unknown>[] {
  return rekap.perTeller.map((t) => ({
    Teller: t.teller,
    Sesi: t.sesi,
    Setoran: t.setoran,
    Penarikan: t.penarikan,
    "Net Kas": t.net,
  }));
}

// ── Komposisi Simpanan ─────────────────────────────────────────────────────
export const KOMPOSISI_COLUMNS: Column<KomposisiStatus>[] = [
  { key: "status", header: "Status", cell: (r) => r.status },
  { key: "count", header: "Rekening", align: "right", cell: (r) => <span className="tabular-nums">{r.count}</span> },
  { key: "saldo", header: "Saldo", align: "right", cell: (r) => rp(r.saldo) },
];

export function KomposisiFooter({ rekap }: { rekap: KomposisiRekap }) {
  return (
    <FooterStrip
      items={[
        { label: "Total Rekening", value: rekap.totalRekening.toLocaleString("id-ID") },
        { label: "Total Saldo", value: formatRupiah(rekap.totalSaldo), tone: "success" },
      ]}
    />
  );
}

export function csvKomposisi(rekap: KomposisiRekap): Record<string, unknown>[] {
  return rekap.perStatus.map((s) => ({
    Status: s.status,
    "Jumlah Rekening": s.count,
    Saldo: s.saldo,
  }));
}

// ── Kualitas Pembiayaan ────────────────────────────────────────────────────
export const KUALITAS_COLUMNS: Column<KualitasStatus>[] = [
  { key: "status", header: "Status", cell: (r) => r.status },
  { key: "count", header: "Akad", align: "right", cell: (r) => <span className="tabular-nums">{r.count}</span> },
  { key: "pokok", header: "Pokok", align: "right", cell: (r) => rp(r.pokok) },
];

export function KualitasFooter({ rekap }: { rekap: KualitasRekap }) {
  return (
    <FooterStrip
      items={[
        { label: "Total Pokok", value: formatRupiah(rekap.totalPokok) },
        { label: "Pokok Berisiko", value: formatRupiah(rekap.pokokBerisiko) },
        { label: "NPF (basis pokok awal)", value: formatPersen(rekap.npfRatio), tone: rekap.npfRatio > 0 ? "danger" : "success" },
      ]}
    />
  );
}

export function csvKualitas(rekap: KualitasRekap): Record<string, unknown>[] {
  return rekap.perStatus.map((s) => ({
    Status: s.status,
    "Jumlah Akad": s.count,
    "Pokok (Rp)": s.pokok,
  }));
}
