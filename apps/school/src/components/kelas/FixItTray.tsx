/**
 * FixItTray — a generic "drain to zero" tray for the Papan Kelas board. Each of
 * the three TU accountabilities (Tanpa Wali / Over-Penuh / Belum Berkelas) is
 * one tray: a titled card with a live count badge and a list the TU works down.
 * Presentational only — items + per-item rendering are injected by the board.
 */
import type { ReactNode } from "react";
import { SectionCard, Badge } from "@sekolahpro/ui";

export interface FixItTrayProps<T> {
  title: string;
  /** Visual urgency of this tray. */
  tone: "danger" | "warning" | "neutral";
  items: readonly T[];
  /** Render one item row. */
  renderItem: (item: T) => ReactNode;
  /** Optional description under the title. */
  description?: string;
  /** Shown when there are no items (the drained, healthy state). */
  emptyHint?: string;
}

export function FixItTray<T>({
  title,
  tone,
  items,
  renderItem,
  description,
  emptyHint = "Tidak ada yang perlu dibereskan.",
}: FixItTrayProps<T>) {
  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>{title}</span>
          <Badge tone={items.length === 0 ? "success" : tone}>{items.length}</Badge>
        </span>
      }
      description={description}
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-muted-fg">{emptyHint}</div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item, i) => (
            <li key={i} className="py-2">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
