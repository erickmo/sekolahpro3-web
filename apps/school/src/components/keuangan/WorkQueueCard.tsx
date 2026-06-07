/**
 * "Pekerjaan Hari Ini" — the urgency-ranked work-queue cockpit on the hub.
 *
 * Presentational only: it takes pre-built {@link WorkItem}s (see lib/
 * keuanganWorkQueue) and renders dense single-line rows that DEEP-LINK to the
 * page that resolves each item. It performs NO mutation — bulk approve/post is a
 * deferred, guarded follow-up. Empty state gives the daily user inbox-zero
 * closure; a meter shows how much of today's queue is handled.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SectionCard } from "@sekolahpro/ui";
import { scopedLinkProps } from "../../lib/scoped";
import { formatRupiah } from "../../data/keuangan";
import { inboxProgress, type WorkItem, type WorkSeverity, type WorkType } from "../../lib/keuanganWorkQueue";

export interface WorkQueueCardProps {
  items: WorkItem[];
  sekolah: string;
  /** Ids the user has already actioned this session (drives the meter). */
  doneIds?: string[];
}

/** Dot colour per severity. */
const SEVERITY_DOT: Record<WorkSeverity, string> = {
  red: "bg-rose-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

/** Human label per work type (shown as a chip). */
const TYPE_LABEL: Record<WorkType, string> = {
  tagihan: "Tagihan",
  belanja: "Belanja",
  pajak: "Pajak",
};

/** Strip the literal scope prefix so scopedLinkProps can re-add the real param. */
function bareRoute(to: string): string {
  return to.replace("/sch/$sekolah", "");
}

/** One queue row. */
function WorkRow({ item, sekolah }: { item: WorkItem; sekolah: string }): ReactNode {
  return (
    <Link
      {...scopedLinkProps(sekolah, bareRoute(item.to))}
      className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/60 transition-colors"
    >
      <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`} />
      <span className="inline-flex shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-fg">
        {TYPE_LABEL[item.type]}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-fg">{item.label}</span>
      {item.amount > 0 ? (
        <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">{formatRupiah(item.amount)}</span>
      ) : null}
      <span className="hidden shrink-0 text-xs text-muted-fg sm:inline">{item.dueLabel}</span>
      <span className="shrink-0 text-xs text-brand">Tindak →</span>
    </Link>
  );
}

/** The work-queue card. */
export function WorkQueueCard({ items, sekolah, doneIds = [] }: WorkQueueCardProps): ReactNode {
  const { done, total } = inboxProgress(items, doneIds);
  return (
    <SectionCard
      title="Pekerjaan Hari Ini"
      description="Semua yang menunggu tindakan Anda — terurut paling mendesak"
      action={
        <span className="text-xs text-muted-fg tabular-nums">
          {done} / {total} selesai
        </span>
      }
      padded={false}
    >
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-fg">
          Kotak masuk bersih — tidak ada yang menunggu. 🎉
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={`${item.type}:${item.id}`}>
              <WorkRow item={item} sekolah={sekolah} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
