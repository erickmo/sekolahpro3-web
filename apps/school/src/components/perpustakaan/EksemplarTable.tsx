// EksemplarTable — presentational per-copy (eksemplar) list for the Buku
// detail page's "Kopi" tab: a DataTable of copy codes, condition + status
// badges, and a "Tambah Kopi" stub action. Layer: pure presentation.
import {
  Badge,
  Button,
  Column,
  DataTable,
  SectionCard,
  IconPlus,
} from "@sekolahpro/ui";
import { stubAction } from "../../lib/stub";
import type { Buku, KopiRow } from "../../data/perpustakaan";
import { STATUS_TONE } from "./BukuDetailHeader";

/** Badge tone per copy condition. */
const KONDISI_TONE: Record<KopiRow["kondisi"], "success" | "warning" | "danger" | "neutral"> = {
  Baik: "success",
  "Rusak Ringan": "warning",
  "Rusak Berat": "danger",
  Hilang: "danger",
};

/**
 * EksemplarTable renders the list of physical copies for a title. Columns and
 * stub actions are preserved verbatim from the original `KopiTab`.
 */
export function EksemplarTable({ buku }: { buku: Buku }) {
  const cols: Column<KopiRow>[] = [
    { key: "kode", header: "Kode Kopi", cell: (r) => <span className="tabular-nums font-medium">{r.kodeKopi}</span> },
    { key: "kondisi", header: "Kondisi", cell: (r) => <Badge tone={KONDISI_TONE[r.kondisi]} dot>{r.kondisi}</Badge> },
    { key: "lokasi", header: "Lokasi", cell: (r) => r.lokasi },
    { key: "status", header: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  return (
    <SectionCard
      title="Daftar Kopi"
      description={`${buku.jumlahKopi} eksemplar`}
      action={<Button size="sm" onClick={() => stubAction(`Tambah Kopi ${buku.kodeBuku}`)}><IconPlus className="mr-1 h-3.5 w-3.5 shrink-0" />Tambah Kopi</Button>}
      padded={false}
    >
      <DataTable data={buku.kopi} columns={cols} rowKey={(r) => r.kodeKopi} />
    </SectionCard>
  );
}
