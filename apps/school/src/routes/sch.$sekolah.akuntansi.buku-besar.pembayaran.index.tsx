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
  PAYMENT_TYPES,
  type PaymentEntry,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";

const ALL = "Semua";

function PembayaranListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [q, setQ] = useState("");
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const company = useActiveCompany();

  const list = useResourceList<PaymentEntry>(DOCTYPE.PAYMENT_ENTRY, {
    fields: ["name", "posting_date", "payment_type", "party_type", "party", "party_name", "paid_amount", "received_amount", "company", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "posting_date desc, creation desc",
    limit_page_length: 200,
  });

  const rows = useMemo(() => {
    const all = list.data ?? [];
    return all.filter((r) => {
      if (type !== ALL && r.payment_type !== type) return false;
      if (status !== ALL && String(r.docstatus ?? 0) !== status) return false;
      if (q) {
        const n = q.toLowerCase();
        if (!r.name.toLowerCase().includes(n) && !(r.party_name ?? "").toLowerCase().includes(n)) return false;
      }
      return true;
    });
  }, [list.data, q, type, status]);

  const cols: Column<PaymentEntry>[] = [
    { key: "name", header: "No.", cell: (r) => (
        <Link to="/sch/$sekolah/akuntansi/buku-besar/pembayaran/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">{r.name}</Link>
      ), width: "180px" },
    { key: "posting_date", header: "Tanggal", cell: (r) => formatTanggal(r.posting_date), width: "120px" },
    { key: "payment_type", header: "Tipe", cell: (r) => <Badge tone={r.payment_type === "Receive" ? "success" : "warning"}>{r.payment_type}</Badge>, align: "center" },
    { key: "party", header: "Pihak", cell: (r) => <span className="text-xs">{r.party_name ?? r.party ?? "—"}</span> },
    { key: "paid_amount", header: "Jumlah", cell: (r) => formatRupiah(r.paid_amount ?? 0), align: "right" },
    { key: "docstatus", header: "Status", cell: (r) => { const b = docstatusBadge(r.docstatus); return <Badge tone={b.tone}>{b.label}</Badge>; }, align: "center" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pembayaran"
        description="Receive / Pay / Internal Transfer."
        actions={
          <Link to="/sch/$sekolah/akuntansi/buku-besar/pembayaran/new" params={{ sekolah }}>
            <Button>+ Pembayaran Baru</Button>
          </Link>
        }
      />
      <FilterBar
        search={{ value: q, placeholder: "Cari nomor / pihak…", onChange: setQ }}
        filters={[
          {
            key: "type", label: "Tipe", value: type,
            options: [{ value: ALL, label: ALL }, ...PAYMENT_TYPES.map((v) => ({ value: v, label: v }))],
            onChange: setType,
          },
          {
            key: "status", label: "Status", value: status,
            options: [{ value: ALL, label: ALL }, { value: "0", label: "Draft" }, { value: "1", label: "Submitted" }, { value: "2", label: "Cancelled" }],
            onChange: setStatus,
          },
        ]}
      />
      <SectionCard padded={false}>
        <DataTable<PaymentEntry>
          data={rows}
          columns={cols}
          rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada pembayaran."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/pembayaran/")({
  component: PembayaranListPage,
});
