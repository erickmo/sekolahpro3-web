/**
 * Referensi tarif TER (PMK 168/2023) dan PPh 4(2).
 *
 * Presentation-only redesign: adds a reference guide, glossary tooltips on the
 * TER jargon, and a small bar of average TER rate per kategori computed from the
 * fetched rates. The two reference queries and tables are unchanged.
 */
import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  DataTable,
  GlossaryTooltip,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatPercent,
  formatRupiah,
  type PPh21TerRate,
  type PPh4a2Rate,
} from "../data/akuntansi";
import { KeuanganPageGuide } from "../components/keuangan";
import { BarChart, type ChartDatum } from "../components/viz";
import { defOf } from "../lib/glossary";

function TerPage() {
  const ter = useResourceList<PPh21TerRate>(DOCTYPE.PPH21_TER_RATE, {
    fields: ["name", "category", "income_from", "income_to", "rate"],
    order_by: "category asc, income_from asc",
    limit_page_length: 0,
  });
  const r4a2 = useResourceList<PPh4a2Rate>(DOCTYPE.PPH4A2_RATE, {
    fields: ["name", "kategori", "rate", "keterangan"],
    order_by: "kategori asc",
    limit_page_length: 0,
  });

  const terCols: Column<PPh21TerRate>[] = [
    { key: "category", header: "Kategori", cell: (r) => <Badge tone="brand">{r.category}</Badge>, align: "center", width: "100px" },
    { key: "income_from", header: "Income From", cell: (r) => formatRupiah(r.income_from), align: "right" },
    { key: "income_to", header: "Income To", cell: (r) => formatRupiah(r.income_to), align: "right" },
    { key: "rate", header: "Rate", cell: (r) => formatPercent(r.rate), align: "right" },
  ];
  const r4a2Cols: Column<PPh4a2Rate>[] = [
    { key: "kategori", header: "Kategori", cell: (r) => r.kategori },
    { key: "rate", header: "Rate", cell: (r) => formatPercent(r.rate), align: "right" },
    { key: "keterangan", header: "Keterangan", cell: (r) => <span className="text-xs text-muted-fg">{r.keterangan ?? "—"}</span> },
  ];

  // Rata-rata tarif TER per kategori (A/B/C) untuk visualisasi ringkas.
  const terAvgByCategory = useMemo<ChartDatum[]>(() => {
    const rows = ter.data ?? [];
    const acc = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      const cur = acc.get(r.category) ?? { sum: 0, count: 0 };
      acc.set(r.category, { sum: cur.sum + r.rate, count: cur.count + 1 });
    }
    return [...acc.entries()].map(([category, { sum, count }]) => ({
      label: category,
      value: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
      tone: "brand" as const,
    }));
  }, [ter.data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tarif TER & PPh 4(2)"
        description={<>Referensi tarif PMK 168/2023 (<GlossaryTooltip term="TER" definition={defOf("TER") ?? "Tarif Efektif Rata-rata pemotongan PPh 21 bulanan (PMK 168/2023)."} />) dan PPh 4(2).</>}
      />
      <KeuanganPageGuide
        storageId="ter-reference"
        intro="Tabel referensi tarif PPh 21 TER dan PPh 4(2). Gunakan saat menghitung potongan agar tarif yang dipakai sesuai regulasi."
        steps={[
          { title: "Pilih kategori TER", detail: "Kategori A/B/C ditentukan oleh status PTKP pegawai; cari baris income range yang sesuai.", roles: ["akuntan"] },
          { title: "Terapkan ke potongan", detail: "Pakai tarif ini saat membuat Withholding Tax Entry PPh 21/4(2).", roles: ["akuntan", "bendahara"] },
        ]}
        tips={["Tarif bersifat referensi; perubahan regulasi diperbarui oleh admin akuntansi."]}
      />
      {terAvgByCategory.length > 0 ? (
        <SectionCard title="Rata-rata Tarif TER per Kategori" description="Rerata persentase tarif efektif untuk tiap kategori PTKP.">
          <BarChart data={terAvgByCategory} valueFormatter={(v) => `${v}%`} />
        </SectionCard>
      ) : null}
      <SectionCard title="PPh 21 TER Rate" padded={false}>
        <DataTable<PPh21TerRate>
          data={ter.data ?? []} columns={terCols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{ter.isLoading ? "Memuat…" : "Tarif TER kosong."}</div>}
        />
      </SectionCard>
      <SectionCard title="PPh 4(2) Rate" padded={false}>
        <DataTable<PPh4a2Rate>
          data={r4a2.data ?? []} columns={r4a2Cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{r4a2.isLoading ? "Memuat…" : "Tarif 4(2) kosong."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/ter")({ component: TerPage });
