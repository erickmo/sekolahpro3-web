/**
 * Lightweight, dependency-free SVG/CSS visualization primitives for the
 * academic redesign. Every chart is SSR-safe, accessible (role="img" with an
 * aria-label that summarizes the data), responsive (className passthrough), and
 * degrades gracefully on empty or all-zero input — they never throw.
 *
 * No external charting library: pure SVG + Tailwind theme tokens.
 */
import type { ReactNode } from "react";
import { cn } from "@sekolahpro/ui";

/** Semantic color tone shared by all charts. */
export type Tone =
  | "brand"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "sky"
  | "neutral";

/** Maps a {@link Tone} to a concrete CSS color value. */
export const TONE_COLOR: Record<Tone, string> = {
  brand: "var(--color-brand, currentColor)",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
  neutral: "#94a3b8",
};

/** A single labelled datum, optionally toned. */
export interface ChartDatum {
  label: string;
  value: number;
  tone?: Tone;
}

/** A segment of a stacked distribution bar. */
export interface DistributionSegment {
  label: string;
  value: number;
  tone: Tone;
}

const FULL_CIRCLE_DEG = 360;
const RIGHT_ANGLE_DEG = 90;
const DEG_TO_RAD = Math.PI / 180;
const PERCENT_MAX = 100;
const PERCENT_MIN = 0;
const DEFAULT_FALLBACK_TONE: Tone = "neutral";

/** Clamp a number into the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Resolve a datum/segment tone to its color, falling back to neutral. */
function toneColor(tone: Tone | undefined): string {
  return TONE_COLOR[tone ?? DEFAULT_FALLBACK_TONE];
}

/** Sum the numeric values of a datum list (negatives floored to 0). */
function sumValues(data: ReadonlyArray<{ value: number }>): number {
  return data.reduce((acc, d) => acc + Math.max(0, d.value), 0);
}

/** Convert a polar point on a circle to cartesian SVG coordinates. */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg - RIGHT_ANGLE_DEG) * DEG_TO_RAD;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/** Build an SVG arc path for a ring slice between two angles. */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endDeg);
  const end = polarToCartesian(cx, cy, radius, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Format a percentage of total as an integer string (0 when total is 0). */
function percentOf(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.max(0, value) / total) * PERCENT_MAX);
}

/* ------------------------------------------------------------------ */
/* DonutChart                                                          */
/* ------------------------------------------------------------------ */

export interface DonutChartProps {
  data: ChartDatum[];
  size?: number;
  thickness?: number;
  centerTop?: ReactNode;
  centerBottom?: ReactNode;
  className?: string;
}

/** Small legend row used by DonutChart and DistributionBar. */
function LegendRow({ items }: { items: ChartDatum[]; }): ReactNode {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((d) => (
        <li key={d.label} className="flex items-center gap-1.5 text-xs text-muted-fg">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: toneColor(d.tone) }}
          />
          <span className="text-fg">{d.label}</span>
          <span className="tabular-nums">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Render the SVG ring slices for a donut. Extracted so DonutChart stays small.
 */
function DonutSlices({
  data,
  total,
  cx,
  radius,
  thickness,
}: {
  data: ChartDatum[];
  total: number;
  cx: number;
  radius: number;
  thickness: number;
}): ReactNode {
  let cursor = 0;
  return (
    <>
      {data.map((d) => {
        const fraction = Math.max(0, d.value) / total;
        const start = cursor * FULL_CIRCLE_DEG;
        const end = (cursor + fraction) * FULL_CIRCLE_DEG;
        cursor += fraction;
        if (fraction <= 0) return null;
        const path =
          fraction >= 1
            ? describeArc(cx, cx, radius, 0, FULL_CIRCLE_DEG - 0.01)
            : describeArc(cx, cx, radius, start, end);
        return (
          <path
            key={d.label}
            d={path}
            fill="none"
            stroke={toneColor(d.tone)}
            strokeWidth={thickness}
          />
        );
      })}
    </>
  );
}

/**
 * Donut ring split proportionally by `data` values, with a centered label
 * stack and optional legend. Renders an empty neutral ring when total is 0.
 */
export function DonutChart({
  data,
  size = 140,
  thickness = 16,
  centerTop,
  centerBottom,
  className,
}: DonutChartProps): ReactNode {
  const cx = size / 2;
  const radius = cx - thickness / 2;
  const total = sumValues(data);
  const summary = data
    .map((d) => `${d.label}: ${d.value}`)
    .join(", ");

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={total > 0 ? `Diagram donat. ${summary}` : "Diagram donat tanpa data"}
        >
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="var(--color-muted, #e5e7eb)"
            strokeWidth={thickness}
          />
          {total > 0 ? (
            <DonutSlices
              data={data}
              total={total}
              cx={cx}
              radius={radius}
              thickness={thickness}
            />
          ) : null}
        </svg>
        {centerTop || centerBottom ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerTop ? (
              <span className="text-xl font-semibold text-fg">{centerTop}</span>
            ) : null}
            {centerBottom ? (
              <span className="text-xs text-muted-fg">{centerBottom}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      {data.length > 0 ? <LegendRow items={data} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressRing                                                        */
/* ------------------------------------------------------------------ */

export interface ProgressRingProps {
  value: number;
  size?: number;
  thickness?: number;
  label?: ReactNode;
  tone?: Tone;
  className?: string;
}

/**
 * Single-arc progress ring (0..100) with a large centered percentage and an
 * optional label beneath. Value is clamped to [0, 100].
 */
export function ProgressRing({
  value,
  size = 120,
  thickness = 12,
  label,
  tone = "brand",
  className,
}: ProgressRingProps): ReactNode {
  const pct = clamp(Math.round(value), PERCENT_MIN, PERCENT_MAX);
  const cx = size / 2;
  const radius = cx - thickness / 2;
  const endDeg = (pct / PERCENT_MAX) * FULL_CIRCLE_DEG;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Lingkaran progres ${pct} persen`}
        >
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="var(--color-muted, #e5e7eb)"
            strokeWidth={thickness}
          />
          {pct > 0 ? (
            <path
              d={
                pct >= PERCENT_MAX
                  ? describeArc(cx, cx, radius, 0, FULL_CIRCLE_DEG - 0.01)
                  : describeArc(cx, cx, radius, 0, endDeg)
              }
              fill="none"
              stroke={toneColor(tone)}
              strokeWidth={thickness}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-fg tabular-nums">{pct}%</span>
        </div>
      </div>
      {label ? <span className="mt-2 text-xs text-muted-fg">{label}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BarChart                                                            */
/* ------------------------------------------------------------------ */

export interface BarChartProps {
  data: ChartDatum[];
  max?: number;
  height?: number;
  valueFormatter?: (value: number) => string;
  className?: string;
}

const DEFAULT_BAR_TONE: Tone = "brand";

/** Resolve the chart max: explicit prop, else the largest value (min 1). */
function resolveMax(data: ReadonlyArray<{ value: number }>, max?: number): number {
  if (typeof max === "number" && max > 0) return max;
  const peak = data.reduce((acc, d) => Math.max(acc, d.value), 0);
  return peak > 0 ? peak : 1;
}

/**
 * Vertical bar chart with value labels on top and category labels beneath.
 * Auto-scales to the largest value when `max` is omitted.
 */
export function BarChart({
  data,
  max,
  height = 160,
  valueFormatter = String,
  className,
}: BarChartProps): ReactNode {
  const ceiling = resolveMax(data, max);
  const summary = data.map((d) => `${d.label}: ${d.value}`).join(", ");

  if (data.length === 0) {
    return <EmptyViz className={className} label="Belum ada data" />;
  }

  return (
    <div
      className={cn("flex items-end gap-3", className)}
      role="img"
      aria-label={`Diagram batang. ${summary}`}
    >
      {data.map((d) => {
        const ratio = clamp(d.value / ceiling, 0, 1);
        return (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium text-fg tabular-nums">
              {valueFormatter(d.value)}
            </span>
            <div className="flex w-full items-end justify-center" style={{ height }}>
              <div
                className="w-full max-w-[40px] rounded-t-md"
                style={{
                  height: `${ratio * height}px`,
                  background: toneColor(d.tone ?? DEFAULT_BAR_TONE),
                }}
              />
            </div>
            <span className="w-full truncate text-center text-xs text-muted-fg">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HBarChart                                                           */
/* ------------------------------------------------------------------ */

export interface HBarChartProps {
  data: ChartDatum[];
  max?: number;
  valueFormatter?: (value: number) => string;
  className?: string;
}

/**
 * Horizontal bar chart: label on the left, proportional bar, value on the
 * right. Suited to long category labels. Auto-scales when `max` is omitted.
 */
export function HBarChart({
  data,
  max,
  valueFormatter = String,
  className,
}: HBarChartProps): ReactNode {
  const ceiling = resolveMax(data, max);
  const summary = data.map((d) => `${d.label}: ${d.value}`).join(", ");

  if (data.length === 0) {
    return <EmptyViz className={className} label="Belum ada data" />;
  }

  return (
    <ul
      className={cn("flex flex-col gap-2", className)}
      role="img"
      aria-label={`Diagram batang horizontal. ${summary}`}
    >
      {data.map((d) => {
        const ratio = clamp(d.value / ceiling, 0, 1);
        return (
          <li key={d.label} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 truncate text-muted-fg" title={d.label}>
              {d.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${ratio * PERCENT_MAX}%`,
                  background: toneColor(d.tone ?? DEFAULT_BAR_TONE),
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-medium text-fg tabular-nums">
              {valueFormatter(d.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

export interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  tone?: Tone;
  className?: string;
}

const SPARK_PADDING = 2;

/** Build the smoothed polyline points string for a sparkline. */
function sparkPath(points: number[], width: number, height: number): string {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = points.length > 1 ? (width - SPARK_PADDING * 2) / (points.length - 1) : 0;
  const usable = height - SPARK_PADDING * 2;
  return points
    .map((p, i) => {
      const x = SPARK_PADDING + i * step;
      const y = SPARK_PADDING + usable - ((p - min) / span) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Minimal trend sparkline: a smooth polyline with no axes. Renders nothing
 * meaningful (empty box) when given fewer than two points.
 */
export function Sparkline({
  points,
  width = 120,
  height = 36,
  tone = "brand",
  className,
}: SparklineProps): ReactNode {
  const hasTrend = points.length >= 2;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={
        hasTrend
          ? `Garis tren dengan ${points.length} titik data`
          : "Garis tren tanpa data"
      }
    >
      {hasTrend ? (
        <polyline
          points={sparkPath(points, width, height)}
          fill="none"
          stroke={toneColor(tone)}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* DistributionBar                                                     */
/* ------------------------------------------------------------------ */

export interface DistributionBarProps {
  segments: DistributionSegment[];
  showLegend?: boolean;
  className?: string;
}

/**
 * Full-width 100% stacked horizontal bar. Segments are sized proportionally to
 * their share of the total; an optional legend lists label, value and percent.
 * Renders an empty neutral track when every value is 0.
 */
export function DistributionBar({
  segments,
  showLegend = true,
  className,
}: DistributionBarProps): ReactNode {
  const total = sumValues(segments);
  const summary = segments
    .map((s) => `${s.label}: ${s.value} (${percentOf(s.value, total)}%)`)
    .join(", ");

  return (
    <div className={cn("w-full", className)}>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={
          total > 0 ? `Distribusi. ${summary}` : "Distribusi tanpa data"
        }
      >
        {total > 0
          ? segments.map((s) => {
              const width = (Math.max(0, s.value) / total) * PERCENT_MAX;
              if (width <= 0) return null;
              return (
                <div
                  key={s.label}
                  style={{ width: `${width}%`, background: toneColor(s.tone) }}
                />
              );
            })
          : null}
      </div>
      {showLegend && segments.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((s) => (
            <li
              key={s.label}
              className="flex items-center gap-1.5 text-xs text-muted-fg"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: toneColor(s.tone) }}
              />
              <span className="text-fg">{s.label}</span>
              <span className="tabular-nums">
                {s.value} ({percentOf(s.value, total)}%)
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared empty state                                                  */
/* ------------------------------------------------------------------ */

/** Tiny placeholder shown by bar charts when there is no data. */
function EmptyViz({
  label,
  className,
}: {
  label: string;
  className?: string | undefined;
}): ReactNode {
  return (
    <div
      className={cn(
        "flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-fg",
        className,
      )}
      role="img"
      aria-label={label}
    >
      {label}
    </div>
  );
}
