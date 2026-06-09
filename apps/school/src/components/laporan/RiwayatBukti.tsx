/**
 * RiwayatBukti — read-only audit trail of compliance packet submissions
 * (graft C2/C3). Lists Laporan Submission Receipt records: what packet, periode,
 * target, who, when — the "what did I send last month, with proof for an auditor"
 * surface. Needs the Laporan Submission Receipt doctype (BE); degrades gracefully.
 */
import { useResourceList } from "@sekolahpro/api-client";
import { SectionCard, Badge } from "@sekolahpro/ui";

interface ReceiptRow {
  name: string;
  nama_paket?: string;
  periode?: string;
  target?: string;
  owner?: string;
  creation?: string;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function RiwayatBukti() {
  const q = useResourceList<ReceiptRow>("Laporan Submission Receipt", {
    fields: ["name", "nama_paket", "periode", "target", "owner", "creation"],
    order_by: "creation desc",
    limit_page_length: 10,
  });
  const rows = q.data ?? [];

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>Riwayat & Bukti</span>
          <Badge tone="neutral">{rows.length}</Badge>
        </span>
      }
      description="Bukti pengiriman paket laporan (audit)."
    >
      {q.isLoading ? (
        <div className="py-2 text-sm text-muted-fg">Memuat riwayat…</div>
      ) : rows.length === 0 ? (
        <div className="py-2 text-sm text-muted-fg">Belum ada riwayat pengiriman.</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium text-fg">{r.nama_paket ?? "—"}</span>
                <span className="block truncate text-xs text-muted-fg">
                  {r.periode ?? ""} · {r.owner ?? ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge tone="neutral">{r.target ?? "Internal"}</Badge>
                <span className="text-xs tabular-nums text-muted-fg">{fmtDate(r.creation)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
