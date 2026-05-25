import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type Urgency = "normal" | "warn" | "critical";

interface Props {
  label: ReactNode;
  value: ReactNode;
  delta?: { value: string; trend?: "up" | "down" | "flat" };
  icon?: ReactNode;
  accent?: "brand" | "emerald" | "amber" | "rose" | "violet";
  hint?: string;
  className?: string;
  urgency?: Urgency;
  actionHref?: string;
  renderLink?: (href: string, children: ReactNode) => ReactNode;
}

const accentMap: Record<NonNullable<Props["accent"]>, string> = {
  brand: "from-brand/15 to-brand/0 text-brand",
  emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
  amber: "from-amber-500/15 to-amber-500/0 text-amber-600",
  rose: "from-rose-500/15 to-rose-500/0 text-rose-600",
  violet: "from-violet-500/15 to-violet-500/0 text-violet-600",
};

const urgencyBorder: Record<Urgency, string> = {
  normal: "",
  warn: "border-l-4 border-l-warning",
  critical: "border-l-4 border-l-danger",
};

const urgencyValueColor: Record<Urgency, string> = {
  normal: "text-fg",
  warn: "text-warning",
  critical: "text-danger",
};

export function StatCard({
  label,
  value,
  delta,
  icon,
  accent = "brand",
  hint,
  className,
  urgency = "normal",
  actionHref,
  renderLink,
}: Props) {
  const trend = delta?.trend ?? "flat";
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-fg";
  const trendGlyph = trend === "up" ? "▲" : trend === "down" ? "▼" : "•";

  const interactive = actionHref ? "block cursor-pointer hover:shadow-md transition-shadow" : "";

  const inner = (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-70",
          accentMap[accent],
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">
            {label}
          </div>
          <div
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums",
              urgencyValueColor[urgency],
            )}
          >
            {value}
          </div>
          {(delta || hint) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {delta ? (
                <span className={cn("font-medium", trendColor)}>
                  {trendGlyph} {delta.value}
                </span>
              ) : null}
              {hint ? <span className="text-muted-fg">{hint}</span> : null}
            </div>
          )}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
              accentMap[accent],
            )}
          >
            <span className="h-5 w-5">{icon}</span>
          </div>
        ) : null}
      </div>
    </>
  );

  const wrapperClass = cn(
    "relative overflow-hidden rounded-xl border border-border bg-bg p-5 shadow-sm",
    urgencyBorder[urgency],
    interactive,
    className,
  );

  if (actionHref && renderLink) {
    return renderLink(actionHref, <div className={wrapperClass}>{inner}</div>);
  }
  if (actionHref) {
    return (
      <a href={actionHref} className={wrapperClass}>
        {inner}
      </a>
    );
  }
  return <div className={wrapperClass}>{inner}</div>;
}
