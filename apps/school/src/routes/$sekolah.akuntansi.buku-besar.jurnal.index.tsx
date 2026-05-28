import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  docstatusBadge,
  formatRupiah,
  formatTanggal,
  type JournalEntry,
} from "../data/akuntansi";

const STATUS_OPTIONS = [
  { value: "Semua", label: "Semua" },
  { value: "0", label: "Draft" },
  { value: "1", label: "Submitted" },
  { value: "2", label: "Cancelled" },
];

function JurnalListPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");

  const list = useResourceList<JournalEntry>(DOCTYPE.JOURNAL_ENTRY, {
    fields: ["name", "posting_date", "company", "total_debit", "total_credit", "docstatus", "remarks"],
    order_by: "posting_date desc, creation desc",
    limit_page_length: 200,
  });

  const rows = useMemo(() => {
    const all = list.data ?? [];
    return all.filter((r) => {
      if (status !== "Semua" && String(r.docstatus ?? 0) !== status) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!r.name.toLowerCase().includes(needle) && !(r.remarks ?? "").toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [list.data, q, status]);

  const cols: Column<JournalEntry>[] = [
    { key: "name", header: "No. Jurnal", cell: (r) => (
        <Link to="/$sekolah/akuntansi/buku-besar/jurnal/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">{r.name}</Link>
      ), width: "180px" },
    { key: "posting_date", header: "Tanggal", cell: (r) => formatTanggal(r.posting_date), width: "120px" },
    { key: "company", header: "Company", cell: (r) => <span className="text-xs">{r.company ?? "—"}</span> },
    { key: "total_debit", header: "Debit", cell: (r) => formatRupiah(r.total_debit ?? 0), align: "right" },
    { key: "total_credit", header: "Kredit", cell: (r) => formatRupiah(r.total_credit ?? 0), align: "right" },
    { key: "docstatus", header: "Status", cell: (r) => {
        const b = docstatusBadge(r.docstatus);
        return <Badge tone={b.tone}>{b.label}</Badge>;
      }, align: "center" },
    { key: "remarks", header: "Keterangan", cell: (r) => <span className="text-xs text-muted-fg truncate block max-w-[260px]">{r.remarks ?? "—"}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Jurnal Umum"
        description="Posting manual debit/kredit."
        actions={
          <Link to="/$sekolah/akuntansi/buku-besar/jurnal/new" params={{ sekolah }}>
            <Button>+ Jurnal Baru</Button>
          </Link>
        }
      />
      <FilterBar
        search={{ value: q, placeholder: "Cari nomor / keterangan…", onChange: setQ }}
        filters={[{ key: "status", label: "Status", value: status, options: STATUS_OPTIONS, onChange: setStatus }]}
      />
      <SectionCard padded={false}>
        <DataTable<JournalEntry>
          data={rows}
          columns={cols}
          rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada jurnal."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/akuntansi/buku-besar/jurnal/")({
  component: JurnalListPage,
});
