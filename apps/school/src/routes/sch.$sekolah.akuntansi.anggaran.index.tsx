/**
 * Anggaran (Budget) list page — Keuangan hub.
 *
 * Lists budgets per cost center. Presentation-only redesign: adds a role-aware
 * page guide, role chips, and a status-distribution visualization computed from
 * the already-fetched list. All data wiring (useResourceList, DOCTYPE, filters,
 * order_by) is preserved verbatim.
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
  budgetStatusBadge,
  type Budget,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { KeuanganPageGuide, KeuanganRoleChips } from "../components/keuangan";
import { useKeuanganRole, type KeuanganRole } from "../lib/keuanganRole";
import { DistributionBar, type Tone } from "../components/viz";

/** Map a budget status to a visualization tone. */
const STATUS_TONE: Record<string, Tone> = {
  Draft: "neutral",
  Submitted: "emerald",
  Amended: "amber",
};

function BudgetListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const company = useActiveCompany();
  const role = useKeuanganRole();
  const [activeRole, setActiveRole] = useState<KeuanganRole>(role.primary);

  const list = useResourceList<Budget>(DOCTYPE.BUDGET, {
    fields: ["name", "fiscal_year", "company", "cost_center", "status", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "creation desc",
    limit_page_length: 200,
  });

  const rows = useMemo(() => {
    const all = list.data ?? [];
    return all.filter((r) => {
      if (status !== "Semua" && r.status !== status) return false;
      if (q) {
        const n = q.toLowerCase();
        if (!r.name.toLowerCase().includes(n) && !(r.fiscal_year ?? "").toLowerCase().includes(n) && !(r.cost_center ?? "").toLowerCase().includes(n)) return false;
      }
      return true;
    });
  }, [list.data, q, status]);

  // Distribusi status budget dihitung dari data yang sudah diambil (read-only).
  const statusDist = useMemo(() => {
    const all = list.data ?? [];
    const counts = new Map<string, number>();
    for (const r of all) {
      const label = r.status ?? "Draft";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, value]) => ({
      label,
      value,
      tone: STATUS_TONE[label] ?? "neutral",
    }));
  }, [list.data]);

  const cols: Column<Budget>[] = [
    { key: "name", header: "No.", cell: (r) => (
        <Link to="/sch/$sekolah/akuntansi/anggaran/budget/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">{r.name}</Link>
      ), width: "180px" },
    { key: "fiscal_year", header: "Fiscal Year", cell: (r) => r.fiscal_year },
    { key: "cost_center", header: "Cost Center", cell: (r) => r.cost_center ?? "—" },
    { key: "company", header: "Company", cell: (r) => <span className="text-xs">{r.company}</span> },
    { key: "status", header: "Status", cell: (r) => { const b = budgetStatusBadge(r.status); return <Badge tone={b.tone}>{b.label}</Badge>; }, align: "center" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anggaran"
        description="Budget per cost center, dengan alokasi per bulan."
        actions={
          <Link to="/sch/$sekolah/akuntansi/anggaran/budget/new" params={{ sekolah }}>
            <Button>+ Budget Baru</Button>
          </Link>
        }
      />

      <KeuanganRoleChips active={activeRole} onSelect={setActiveRole} />

      <KeuanganPageGuide
        storageId="anggaran-list"
        intro="Halaman ini menampilkan seluruh anggaran (budget) per cost center beserta status persetujuannya."
        steps={[
          { title: "Susun rencana anggaran", detail: "Bendahara membuat budget baru dan mengisi alokasi dana per akun untuk setiap bulan dalam satu tahun anggaran (fiscal year).", roles: ["bendahara"] },
          { title: "Pastikan pencatatan akun benar", detail: "Akuntan memverifikasi akun dan cost center yang dipakai agar realisasi belanja terbaca pada laporan yang tepat.", roles: ["akuntan"] },
          { title: "Submit untuk mengunci", detail: "Setelah disetujui, budget di-submit. Budget Submitted mengontrol overspend pada transaksi (None / Warn / Stop)." },
          { title: "Pantau status anggaran", detail: "Kepala sekolah memantau berapa budget yang masih Draft, sudah Submitted, atau direvisi (Amended).", roles: ["kepala"] },
        ]}
        tips={[
          "Gunakan filter Status untuk memisahkan Draft dari budget yang sudah aktif.",
          "Revisi alokasi yang sudah Submitted dilakukan lewat menu Amandemen, bukan dengan mengubah budget asli.",
        ]}
      />

      {statusDist.length > 0 && (
        <SectionCard title="Distribusi Status Budget">
          <DistributionBar segments={statusDist} />
        </SectionCard>
      )}

      <FilterBar
        search={{ value: q, placeholder: "Cari fiscal year / cost center…", onChange: setQ }}
        filters={[
          {
            key: "status", label: "Status", value: status,
            options: [
              { value: "Semua", label: "Semua" },
              { value: "Draft", label: "Draft" },
              { value: "Submitted", label: "Submitted" },
              { value: "Amended", label: "Amended" },
            ],
            onChange: setStatus,
          },
        ]}
      />
      <SectionCard padded={false}>
        <DataTable<Budget>
          data={rows}
          columns={cols}
          rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada budget."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/anggaran/")({
  component: BudgetListPage,
});
