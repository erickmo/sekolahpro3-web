/**
 * "Hari Saya" — the always-on my-day strip of the role-adaptive Beranda.
 *
 * Pure presentational: shows the persona's day at a glance (kepala: today's
 * published agenda; bendahara: money deadlines; guru: next slots — v2). Kept
 * always-on so the screen is never empty on a quiet day. Renders an honest
 * empty-state rather than fabricating rows.
 */
import type { ReactNode } from "react";
import { SectionCard } from "@sekolahpro/ui";
import type { HariSayaItem } from "../../lib/beranda/scope";

export interface HariSayaProps {
  title: string;
  items: HariSayaItem[];
  emptyText?: string;
}

export function HariSaya({ title, items, emptyText = "Tidak ada agenda hari ini." }: HariSayaProps): ReactNode {
  return (
    <SectionCard title={title} padded={items.length === 0}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-fg">{emptyText}</p>
      ) : (
        <ul role="list" className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-5 py-3 first:pt-0 last:pb-0">
              {item.time ? (
                <span className="w-12 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-brand">{item.time}</span>
              ) : null}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-fg">{item.title}</div>
                {item.subtitle ? <div className="text-xs text-muted-fg">{item.subtitle}</div> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
