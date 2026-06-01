/**
 * Daftar Tax Template (template pajak transaksi: PPN + PPh).
 *
 * Presentation-only redesign: adds a workflow guide, a default/non-default
 * distribution bar, and glossary tooltips. The list query, filters, and columns
 * are unchanged.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  DataTable,
  FilterBar,
  GlossaryTooltip,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { DOCTYPE, type TaxTemplate } from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { defOf } from "../lib/glossary";

function TaxTemplatePage() {
  const [q, setQ] = useState("");
  const company = useActiveCompany();
  const list = useResourceList<TaxTemplate>(DOCTYPE.TAX_TEMPLATE, {
    fields: ["name", "template_name", "company", "is_default"],
    filters: withCompanyFilter(undefined, company),
    order_by: "name asc",
    limit_page_length: 200,
  });
  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.template_name?.toLowerCase().includes(n) || r.name.toLowerCase().includes(n));
  }, [list.data, q]);

  const cols: Column<TaxTemplate>[] = [
    { key: "name", header: "Nama", cell: (r) => r.template_name },
    { key: "company", header: "Company", cell: (r) => r.company ?? "—" },
    { key: "is_default", header: "Default", cell: (r) => r.is_default ? <Badge tone="success">Default</Badge> : "—", align: "center" },
  ];

  // Distribusi template default vs non-default untuk visualisasi ringkas.
  const defaultDist = useMemo<DistributionSegment[]>(() => {
    const all = list.data ?? [];
    const def = all.filter((r) => r.is_default).length;
    return [
      { label: "Default", value: def, tone: "emerald" },
      { label: "Non-default", value: all.length - def, tone: "neutral" },
    ];
  }, [list.data]);
  const hasTemplates = (list.data ?? []).length > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tax Template"
        description={<>Template pajak transaksi (<GlossaryTooltip term="PPN" definition={defOf("PPN") ?? "Pajak Pertambahan Nilai."} /> + PPh).</>}
      />
      <KeuanganPageGuide
        storageId="tax-template-list"
        intro="Template pajak menentukan komposisi PPN dan PPh yang otomatis diterapkan saat membuat transaksi penjualan/pembelian."
        steps={[
          { title: "Tinjau template", detail: "Lihat daftar template pajak per company dan tandai mana yang dipakai sebagai default." },
          { title: "Gunakan default", detail: "Template Default akan terpilih otomatis pada transaksi baru tanpa pilih manual." },
        ]}
        tips={["Pastikan ada satu template Default per company agar transaksi konsisten."]}
      />
      {hasTemplates ? (
        <SectionCard title="Distribusi Template" description="Perbandingan template default dan non-default.">
          <DistributionBar segments={defaultDist} />
        </SectionCard>
      ) : null}
      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<TaxTemplate>
          data={rows} columns={cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada template."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/template")({ component: TaxTemplatePage });
