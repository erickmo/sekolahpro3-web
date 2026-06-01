/**
 * Perpustakaan dashboard — attention & recent-activity block (presentational).
 *
 * Two side-by-side panels: "Perlu Perhatian" (overdue / lost / due-today loans
 * via the shared AttentionList) and "Aktivitas Terbaru" (the latest loan rows).
 * The route computes both lists and passes them in; this component renders them
 * and wires its action links. No fetching, no aggregation here.
 */
import { Link } from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  SectionCard,
  type AttentionItem,
} from "@sekolahpro/ui";
import type { PerpRenderLink } from "./PerpDashboardStats";

/** Maximum number of items shown in the "Perlu Perhatian" list. */
const ATTENTION_LIMIT = 5;

/** Loan row fields the recent-activity list renders. */
export interface PerpRecentLoanRow {
  name: string;
  anggota?: string | undefined;
  tanggal_pinjam?: string | undefined;
  status?: string | undefined;
}

/** Badge tone per loan status (mirrors the status palette used elsewhere). */
const PINJAM_TONE: Record<string, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

export interface PerpDashboardAttentionProps {
  /** Resolved `$sekolah` segment for the router-bound "Lihat semua" links. */
  sekolah: string;
  /** Items for the AttentionList (overdue / lost / due-today). */
  perluPerhatianItems: AttentionItem[];
  /** Latest loan rows for the recent-activity panel. */
  aktivitasTerbaru: PerpRecentLoanRow[];
  /** True while the loan query is still loading. */
  loading: boolean;
  renderLink: PerpRenderLink;
}

/** Renders the attention queue and the recent-activity list, side by side. */
export function PerpDashboardAttention({
  sekolah,
  perluPerhatianItems,
  aktivitasTerbaru,
  loading,
  renderLink,
}: PerpDashboardAttentionProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        title="Perlu Perhatian"
        description="Peminjaman terlambat, hilang, atau jatuh tempo hari ini."
        action={
          <Link to="/sch/$sekolah/perpustakaan/peminjaman" params={{ sekolah }} search={{ denda: "ada" }} className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {loading ? (
          <div className="text-sm text-muted-fg">Memuat...</div>
        ) : (
          <AttentionList
            items={perluPerhatianItems}
            maxItems={ATTENTION_LIMIT}
            renderLink={renderLink}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Aktivitas Terbaru"
        description="5 peminjaman terakhir tercatat."
        action={
          <Link to="/sch/$sekolah/perpustakaan/peminjaman" params={{ sekolah }} className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {loading ? (
          <div className="text-sm text-muted-fg">Memuat...</div>
        ) : aktivitasTerbaru.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
            Belum ada aktivitas peminjaman.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {aktivitasTerbaru.map((p) => (
              <li key={p.name} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="font-medium text-fg truncate">{p.name}</div>
                  <div className="text-xs text-muted-fg truncate">{p.anggota ?? "—"}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs tabular-nums text-muted-fg">{p.tanggal_pinjam ?? "—"}</span>
                  <Badge tone={PINJAM_TONE[p.status ?? ""] ?? "neutral"} dot>
                    {p.status ?? "—"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
