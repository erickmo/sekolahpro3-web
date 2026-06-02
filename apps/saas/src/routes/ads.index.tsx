import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, SectionCard, DataTable, type Column } from "@sekolahpro/ui";
import {
  fetchAdsOverview, ctr,
  type AdsOverview, type AdsByCampaign, type AdsByProperty, type AdsDaily,
} from "../lib/ads";

/** Simple CSS bar series (no chart lib in @sekolahpro/ui). Height ∝ impressions. */
function MiniBars({ daily }: { daily: AdsDaily[] }) {
  const max = Math.max(1, ...daily.map((d) => d.impressions));
  if (!daily.length) return <div className="text-sm text-muted-fg">Belum ada data.</div>;
  return (
    <div className="flex items-end gap-1 h-32">
      {daily.map((d) => (
        <div key={d.day} className="flex-1 bg-brand/70 rounded-t" style={{ height: `${(d.impressions / max) * 100}%` }} title={`${d.day}: ${d.impressions} impr / ${d.clicks} klik`} />
      ))}
    </div>
  );
}

function AdsDashboard() {
  const [data, setData] = useState<AdsOverview | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAdsOverview().then((d) => active && setData(d)).catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  const campaignCols: Column<AdsByCampaign>[] = [
    { key: "campaign", header: "Campaign", cell: (r) => r.campaign ?? "—" },
    { key: "impressions", header: "Impression", align: "right", cell: (r) => r.impressions.toLocaleString("id-ID") },
    { key: "clicks", header: "Klik", align: "right", cell: (r) => r.clicks.toLocaleString("id-ID") },
    { key: "ctr", header: "CTR", align: "right", cell: (r) => ctr(r.impressions, r.clicks) },
  ];
  const propertyCols: Column<AdsByProperty>[] = [
    { key: "property", header: "Property (app)", cell: (r) => r.property ?? "—" },
    { key: "impressions", header: "Impression", align: "right", cell: (r) => r.impressions.toLocaleString("id-ID") },
    { key: "clicks", header: "Klik", align: "right", cell: (r) => r.clicks.toLocaleString("id-ID") },
    { key: "ctr", header: "CTR", align: "right", cell: (r) => ctr(r.impressions, r.clicks) },
  ];

  const totals = data?.totals ?? { impressions: 0, clicks: 0 };

  return (
    <>
      <PageHeader title="Ads Dashboard" description={data ? `${data.from_date} → ${data.to_date}` : "Ringkasan 30 hari terakhir"} />
      {error && <div className="mt-4 text-sm text-danger">Gagal memuat statistik iklan.</div>}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Impression" value={totals.impressions.toLocaleString("id-ID")} accent="brand" />
        <StatCard label="Klik" value={totals.clicks.toLocaleString("id-ID")} accent="emerald" />
        <StatCard label="CTR" value={ctr(totals.impressions, totals.clicks)} accent="violet" />
      </div>
      <div className="mt-6">
        <SectionCard title="Tren harian (impression)">
          <MiniBars daily={data?.daily ?? []} />
        </SectionCard>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Per Campaign" padded={false}>
          <DataTable<AdsByCampaign> data={data?.by_campaign ?? []} columns={campaignCols} rowKey={(r) => r.campaign ?? "?"} empty={<div className="p-6 text-center text-sm text-muted-fg">Belum ada data.</div>} />
        </SectionCard>
        <SectionCard title="Per Property" padded={false}>
          <DataTable<AdsByProperty> data={data?.by_property ?? []} columns={propertyCols} rowKey={(r) => r.property ?? "?"} empty={<div className="p-6 text-center text-sm text-muted-fg">Belum ada data.</div>} />
        </SectionCard>
      </div>
    </>
  );
}

export const Route = createFileRoute("/ads/")({ component: AdsDashboard });
