import { StatCard } from "@sekolahpro/ui";
import type { SummaryItem, SummaryTone } from "../lib/orang/listSummary";

// StatCard's `accent` prop is a closed union that does NOT include "neutral".
// Our SummaryItem tone DOES, to mean "no accent" — so we translate it to
// `undefined` (StatCard then falls back to its own default).
type StatAccent = "brand" | "emerald" | "amber" | "rose" | "violet";

/**
 * Map a SummaryItem tone to a StatCard accent. The "neutral" tone (and any
 * absent tone) resolves to undefined so StatCard uses its default styling.
 */
function toAccent(tone?: SummaryTone): StatAccent | undefined {
  return tone && tone !== "neutral" ? tone : undefined;
}

/**
 * Render a responsive grid of summary StatCards — one per item. Purely
 * presentational: all counting happens upstream in listSummary helpers.
 * Returns null for an empty list so callers can render it unconditionally.
 * @param items pre-computed label/value/tone cells for the strip
 */
export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const accent = toAccent(item.tone);
        return (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            {...(accent ? { accent } : {})}
            {...(item.hint ? { hint: item.hint } : {})}
          />
        );
      })}
    </div>
  );
}
