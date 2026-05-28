/**
 * Perpustakaan Peminjaman — unified circulation hub.
 *
 * Single list page that merges the former peminjaman / pengembalian / denda tabs.
 * Row actions trigger ReturnModal (Pengembalian Buku submit) and DendaDrawer
 * (Denda Perpustakaan inline payment). Status filter is URL-synced; default view
 * scopes the server query to in-flight loans (Aktif + Terlambat).
 *
 * See: PERP-ADR-0001, docs/superpowers/specs/2026-05-25-perpustakaan-sirkulasi-merge-design.md.
 */
import { createFileRoute, Link, useNavigate, useSearch, useParams} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import type { FilterTuple } from "@sekolahpro/api-client";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";
import { ReturnModal } from "../components/perpustakaan/ReturnModal";
import { DendaDrawer } from "../components/perpustakaan/DendaDrawer";
import { fetchDendaSummary, type DendaSummary } from "../components/perpustakaan/dendaSummary";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  anggota: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana?: string;
  status: string;
};

type DecoratedRow = Row & {
  _denda?: DendaSummary[string];
  /** True when fetchDendaSummary threw — surfaces ambiguity to user vs "no denda".
   *  See PERP-ADR-0001 audit finding: silent failure hides "Bayar Denda" action. */
  _dendaFailed?: boolean;
};

const STATUS_TONE: Record<string, "success" | "brand" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

const STATUS_OPTIONS = [
  "Semua",
  "BelumKembali",
  "Aktif",
  "Terlambat",
  "Selesai",
  "Hilang",
  "Batal",
];

const DEFAULT_STATUS = "BelumKembali";

const CREATE_FIELDS: PerpFieldDef[] = [
  {
    name: "anggota",
    label: "Anggota",
    type: "link",
    required: true,
    linkDoctype: "Anggota Perpustakaan",
    linkLabelField: "nama_lengkap",
  },
  {
    name: "buku",
    label: "Buku",
    type: "link",
    required: true,
    linkDoctype: "Buku",
    linkLabelField: "judul",
  },
  {
    name: "kopi",
    label: "Kopi",
    type: "link",
    linkDoctype: "Eksemplar Buku",
    linkLabelField: "nomor_inventaris",
  },
  { name: "tanggal_pinjam", label: "Tgl Pinjam", type: "date", required: true, defaultValue: perpToday() },
  { name: "tanggal_rencana_kembali", label: "Rencana Kembali", type: "date", required: true },
  { name: "petugas", label: "Petugas", type: "text" },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

interface Search {
  status?: string;
  denda?: "ada";
}

function statusLabel(v: string): string {
  return v === "BelumKembali" ? "Belum Kembali" : v;
}

function PeminjamanPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const search = useSearch({ from: "/$sekolah/perpustakaan/peminjaman" }) as Search;
  const [createOpen, setCreateOpen] = useState(false);
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const [dendaFor, setDendaFor] = useState<string | null>(null);

  const activeStatus = search.status ?? DEFAULT_STATUS;

  const baseFilters = useMemo<FilterTuple[]>(() => {
    if (activeStatus === "BelumKembali") return [["status", "in", ["Aktif", "Terlambat"]]];
    if (activeStatus === "Semua") return [];
    return [["status", "=", activeStatus]];
  }, [activeStatus]);

  const columns: Column<DecoratedRow>[] = [
    {
      key: "name",
      header: "No. Peminjaman",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.name}</span>,
    },
    { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota },
    { key: "tanggal_pinjam", header: "Tgl Pinjam", sortable: true, cell: (r) => r.tanggal_pinjam },
    {
      key: "tanggal_kembali_rencana",
      header: "Rencana Kembali",
      sortable: true,
      cell: (r) => r.tanggal_kembali_rencana ?? "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "total_denda",
      header: "Denda",
      align: "right",
      cell: (r) => {
        if (r._dendaFailed) return <span title="Gagal memuat denda" className="text-warning">?</span>;
        return r._denda?.total ? `Rp ${r._denda.total.toLocaleString("id-ID")}` : "—";
      },
    },
    {
      key: "_actions" as never,
      header: "",
      cell: (r) => (
        <div className="flex gap-2 justify-end">
          {(r.status === "Aktif" || r.status === "Terlambat") && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setReturnFor(r.name);
              }}
            >
              Kembalikan
            </Button>
          )}
          {r._denda?.status_bayar === "Belum Lunas" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setDendaFor(r.name);
              }}
            >
              Bayar Denda
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 inline-flex rounded-md border border-border bg-card p-1">
        <span className="rounded bg-brand px-3 py-1.5 text-sm text-white">Individu</span>
        <Link to="/$sekolah/perpustakaan/kolektif" params={{ sekolah }} className="rounded px-3 py-1.5 text-sm text-muted-fg hover:text-fg">
          Kolektif Kelas
        </Link>
      </div>
      <ResourceListPage<DecoratedRow>
        eyebrow="Perpustakaan"
        title="Peminjaman & Sirkulasi"
        description="Pinjam, kembalikan, dan denda dalam satu tempat."
        doctype="Peminjaman Buku"
        fields={["name", "anggota", "tanggal_pinjam", "tanggal_kembali_rencana", "status"]}
        rowKey={(r) => r.name}
        columns={columns}
        defaultSort={{ key: "tanggal_pinjam", dir: "desc" }}
        searchFields={["name", "anggota"]}
        baseFilters={baseFilters}
        selectFilters={[
          {
            key: "status",
            label: "Status",
            field: "status",
            options: STATUS_OPTIONS.map((v) => ({ value: v, label: statusLabel(v) })),
            value: activeStatus,
            onChange: (v) => {
              const next: Search = { ...search };
              if (v === DEFAULT_STATUS) delete next.status;
              else next.status = v;
              navigate({ to: "/$sekolah/perpustakaan/peminjaman", params: { sekolah }, search: next });
            },
          },
        ]}
        addLabel="Pinjam Baru"
        onAdd={() => setCreateOpen(true)}
        onRowClick={(r) => navigate({ to: "/$sekolah/perpustakaan/peminjaman/$name", params: { sekolah, name: r.name } })}
        decorateRows={async (rows) => {
          const names = rows.map((r) => r.name);
          let summary: DendaSummary = {};
          let failed = false;
          try {
            summary = await fetchDendaSummary(names);
          } catch (err) {
            // Per PERP-ADR-0001 audit: don't hide failure. Flag rows so
            // the Denda column renders "?" and "Bayar Denda" stays hidden
            // (we cannot know if the user owes anything).
            failed = true;
            // eslint-disable-next-line no-console
            console.warn("fetchDendaSummary failed:", err);
          }
          const enriched: DecoratedRow[] = rows.map((r) => {
            const entry = summary[r.name];
            const base: DecoratedRow = { ...r };
            if (entry) base._denda = entry;
            if (failed) base._dendaFailed = true;
            return base;
          });
          return search.denda === "ada"
            ? enriched.filter((r) => r._denda?.status_bayar === "Belum Lunas")
            : enriched;
        }}
      />

      <PerpCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        doctype="Peminjaman Buku"
        title="Pinjam Buku Baru"
        description="Catat transaksi peminjaman baru."
        fields={CREATE_FIELDS}
        submitLabel="Pinjamkan"
        onCreated={(doc) => {
          const name = (doc as { name?: string }).name;
          if (name) navigate({ to: "/$sekolah/perpustakaan/peminjaman/$name", params: { sekolah, name } });
        }}
      />

      {returnFor && (
        <ReturnModal
          open
          peminjaman={returnFor}
          onClose={() => setReturnFor(null)}
          onSuccess={() => setReturnFor(null)}
        />
      )}

      {dendaFor && <DendaDrawer open peminjaman={dendaFor} onClose={() => setDendaFor(null)} />}
    </>
  );
}

export const Route = createFileRoute("/$sekolah/perpustakaan/peminjaman")({
  component: PeminjamanPage,
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s.status === "string") out.status = s.status;
    if (s.denda === "ada") out.denda = "ada";
    return out;
  },
});
