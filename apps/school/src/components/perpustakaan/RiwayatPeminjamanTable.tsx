// RiwayatPeminjamanTable — presentational loan-history view for the Buku
// detail page's "Peminjaman" tab: per-status stat cards plus a DataTable of
// every loan row (peminjam, dates, status, denda, petugas). Layer: pure
// presentation. The shared PEMINJAMAN_TONE map is exported for reuse by the
// summary/overview blocks.
import {
  Badge,
  Button,
  Column,
  DataTable,
  SectionCard,
  StatCard,
  IconCheck,
  IconPlus,
  IconWallet,
} from "@sekolahpro/ui";
import { stubAction } from "../../lib/stub";
import { perpFormatRupiah, perpFormatDate } from "./perpFormatters";
import type { Buku, PeminjamanRow } from "../../data/perpustakaan";

/** Badge tone per loan status (shared with the overview's active-loan list). */
export const PEMINJAMAN_TONE: Record<PeminjamanRow["status"], "brand" | "success" | "warning" | "danger"> = {
  Aktif: "brand",
  Dikembalikan: "success",
  Terlambat: "warning",
  Hilang: "danger",
};

/** Default count used when a loan status has no rows yet. */
const ZERO_COUNT = 0;

/**
 * RiwayatPeminjamanTable renders the full loan ledger for a title. Columns,
 * per-status reduction, and stub actions are preserved verbatim from the
 * original `PeminjamanTab`.
 */
export function RiwayatPeminjamanTable({ buku }: { buku: Buku }) {
  const cols: Column<PeminjamanRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "peminjam", header: "Peminjam", cell: (r) => <span className="font-medium">{r.peminjam}</span> },
    { key: "nis", header: "NIS", cell: (r) => <span className="tabular-nums text-muted-fg">{r.nis ?? "—"}</span> },
    { key: "pinjam", header: "Tanggal Pinjam", cell: (r) => perpFormatDate(r.tanggalPinjam) },
    { key: "kembali", header: "Tanggal Kembali", cell: (r) => perpFormatDate(r.tanggalKembali) },
    { key: "status", header: "Status", cell: (r) => <Badge tone={PEMINJAMAN_TONE[r.status]} dot>{r.status}</Badge> },
    { key: "denda", header: "Denda", align: "right", cell: (r) => <span className="tabular-nums">{r.denda !== undefined ? perpFormatRupiah(r.denda) : "—"}</span> },
    { key: "petugas", header: "Petugas", cell: (r) => r.petugas },
  ];
  const counts = buku.peminjaman.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? ZERO_COUNT) + 1;
    return acc;
  }, {});
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Aktif" value={counts.Aktif ?? ZERO_COUNT} accent="brand" icon={<IconWallet />} />
        <StatCard label="Terlambat" value={counts.Terlambat ?? ZERO_COUNT} accent="amber" />
        <StatCard label="Dikembalikan" value={counts.Dikembalikan ?? ZERO_COUNT} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Hilang" value={counts.Hilang ?? ZERO_COUNT} accent="rose" />
      </div>
      <SectionCard
        title="Riwayat Peminjaman"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => stubAction("Filter Periode Peminjaman")}>Filter Periode</Button>
            <Button size="sm" onClick={() => stubAction(`Pinjamkan ${buku.judul}`)}><IconPlus className="mr-1 h-3.5 w-3.5 shrink-0" />Pinjamkan</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={buku.peminjaman} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}
