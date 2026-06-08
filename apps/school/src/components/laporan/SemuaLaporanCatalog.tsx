/**
 * SemuaLaporanCatalog — the secondary "Semua Laporan" surface: a server-truth
 * catalog of every report the user may see (graft C3), sourced from the Report
 * doctype via get_list (role-filtered by Frappe) so completeness scales
 * automatically — drop a Report, it appears. Each row shows its run channel
 * (graft C2 badge) and a Desk link that runs it today; inline run + export is a
 * fast-follow (the Dinas export returns raw bytes — a BE response-shape question).
 */
import { useMemo, useState } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import { SectionCard, Badge } from "@sekolahpro/ui";
import { resolveChannel, type ReportChannel } from "../../lib/laporan/reportChannel";

interface ReportRow {
  name: string;
  module?: string;
  report_type?: string;
  disabled?: number;
}

const CHANNEL_LABEL: Record<ReportChannel, string> = {
  dinas: "Dinas (TU)",
  engine: "Engine",
  desk: "Buka di Desk",
};
const CHANNEL_TONE: Record<ReportChannel, "success" | "brand" | "neutral"> = {
  dinas: "success",
  engine: "brand",
  desk: "neutral",
};

function deskUrl(reportName: string): string {
  return `/app/query-report/${encodeURIComponent(reportName)}`;
}

export function SemuaLaporanCatalog() {
  const q = useResourceList<ReportRow>("Report", {
    fields: ["name", "module", "report_type", "disabled"],
    filters: [["disabled", "=", 0]],
    limit_page_length: 0,
  });
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const rows = (q.data ?? []).filter(
      (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
    );
    const byModule = new Map<string, ReportRow[]>();
    for (const r of rows) {
      const m = r.module ?? "Lainnya";
      const list = byModule.get(m) ?? [];
      list.push(r);
      byModule.set(m, list);
    }
    return [...byModule.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [q.data, search]);

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>Semua Laporan</span>
          <Badge tone="neutral">{q.data?.length ?? 0}</Badge>
        </span>
      }
      description="Katalog seluruh laporan (server-truth dari Report). Badge = channel run."
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari laporan…"
        className="mb-3 w-full rounded-md border border-border bg-bg px-3 py-1.5 text-sm"
      />
      {q.isLoading ? (
        <div className="py-2 text-sm text-muted-fg">Memuat katalog…</div>
      ) : grouped.length === 0 ? (
        <div className="py-2 text-sm text-muted-fg">Tidak ada laporan.</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([module, rows]) => (
            <div key={module}>
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-fg">
                {module}
              </div>
              <ul className="divide-y divide-border">
                {rows.map((r) => {
                  const ch = resolveChannel(r.name);
                  return (
                    <li key={r.name} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span className="min-w-0 truncate font-medium text-fg">{r.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge tone={CHANNEL_TONE[ch]}>{CHANNEL_LABEL[ch]}</Badge>
                        <a
                          href={deskUrl(r.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand hover:underline"
                        >
                          Buka →
                        </a>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
