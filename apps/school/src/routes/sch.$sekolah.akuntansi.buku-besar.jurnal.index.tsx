/**
 * Jurnal Umum — daftar Journal Entry vernon_accounting.
 *
 * Tambahan presentasi: panduan workflow draft → submit dan distribusi status
 * dokumen di atas tabel. Hook list, filter, dan order_by dipertahankan apa adanya.
 */
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
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { DistributionBar, type DistributionSegment, type Tone } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";

const STATUS_OPTIONS = [
  { value: "Semua", label: "Semua" },
  { value: "0", label: "Draft" },
  { value: "1", label: "Submitted" },
  { value: "2", label: "Cancelled" },
];

const STATUS_LABELS: Record<number, string> = { 0: "Draft", 1: "Submitted", 2: "Cancelled" };
const STATUS_TONES: Record<number, Tone> = { 0: "amber", 1: "emerald", 2: "rose" };

const GUIDE_STEPS = [
  { title: "Pahami alur dokumen", detail: "Jurnal dibuat sebagai Draft, lalu di-Submit agar mengalir ke GL. Cancelled berarti dibatalkan." },
  { title: "Buat jurnal baru", detail: "Klik '+ Jurnal Baru', isi baris debit/kredit yang seimbang, lalu simpan atau submit.", roles: ["akuntan"] },
  { title: "Pantau status", detail: "Gunakan filter Status atau distribusi di atas untuk melihat berapa banyak jurnal yang masih draft.", roles: ["kepala", "akuntan"] },
];

const GUIDE_TIPS = ["Hanya jurnal Submitted yang berpengaruh ke saldo buku besar."];

function JurnalListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const company = useActiveCompany();

  const list = useResourceList<JournalEntry>(DOCTYPE.JOURNAL_ENTRY, {
    fields: ["name", "posting_date", "company", "total_debit", "total_credit", "docstatus", "remarks"],
    filters: withCompanyFilter(undefined, company),
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

  /** Document-status distribution across all loaded journals. */
  const statusDistribution = useMemo<DistributionSegment[]>(() => {
    const counts = new Map<number, number>();
    for (const r of list.data ?? []) {
      const ds = r.docstatus ?? 0;
      counts.set(ds, (counts.get(ds) ?? 0) + 1);
    }
    return [0, 1, 2]
      .filter((ds) => (counts.get(ds) ?? 0) > 0)
      .map((ds) => ({
        label: STATUS_LABELS[ds] ?? String(ds),
        value: counts.get(ds) ?? 0,
        tone: STATUS_TONES[ds] ?? "neutral",
      }));
  }, [list.data]);

  const cols: Column<JournalEntry>[] = [
    { key: "name", header: "No. Jurnal", cell: (r) => (
        <Link to="/sch/$sekolah/akuntansi/buku-besar/jurnal/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">{r.name}</Link>
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
          <Link to="/sch/$sekolah/akuntansi/buku-besar/jurnal/new" params={{ sekolah }}>
            <Button>+ Jurnal Baru</Button>
          </Link>
        }
      />
      <KeuanganPageGuide
        storageId="jurnal-list"
        intro="Jurnal Umum mencatat posting manual debit/kredit. Pahami statusnya sebelum membuat yang baru."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />
      {statusDistribution.length > 0 && (
        <SectionCard title="Distribusi Status Jurnal" description={`Total ${list.data?.length ?? 0} jurnal`}>
          <DistributionBar segments={statusDistribution} />
        </SectionCard>
      )}
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

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/jurnal/")({
  component: JurnalListPage,
});
