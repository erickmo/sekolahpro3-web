/**
 * Finance-oriented SVG visualization primitives for the Keuangan hub redesign.
 *
 * Same contract as components/viz/charts.tsx: dependency-free, SSR-safe,
 * accessible (role="img" + aria-label), responsive (className passthrough), and
 * never throws on empty / out-of-range input. Kept in a separate file so
 * charts.tsx stays focused.
 */
import type { ReactNode } from "react";
import { cn } from "@sekolahpro/ui";
import { TONE_COLOR, type Tone } from "./charts";

const PCT_MAX = 100;
const PCT_MIN = 0;
const COORD_PRECISION = 2;

/** Round to a stable, compact coordinate (strip trailing zeros). */
function r2(n: number): number {
  return Math.round(n * 10 ** COORD_PRECISION) / 10 ** COORD_PRECISION;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------------ */
/* Pure geometry helpers (unit-tested directly)                       */
/* ------------------------------------------------------------------ */

export interface LinePathOpts {
  width: number;
  height: number;
  max: number;
  min?: number;
}

/**
 * Build an SVG path ("M x y L x y …") for a series of y-values spread evenly
 * across the width. Y is inverted (SVG origin top-left). Returns "" for < 2
 * points and never divides by zero when max === min.
 */
export function buildLinePath(points: readonly number[], opts: LinePathOpts): string {
  if (points.length < 2) return "";
  const { width, height, max } = opts;
  const min = opts.min ?? 0;
  const span = max - min || 1;
  const step = width / (points.length - 1);
  return points
    .map((v, i) => {
      const x = r2(i * step);
      const y = r2(height - ((v - min) / span) * height);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export interface StackFraction {
  offset: number;
  fraction: number;
}

/**
 * Convert raw segment values into cumulative {offset, fraction} pairs (each a
 * 0..1 share of the total). Returns all-zero fractions when the total is 0.
 */
export function stackFractions(values: readonly number[]): StackFraction[] {
  const total = values.reduce((a, v) => a + Math.max(0, v), 0);
  let running = 0;
  return values.map((v) => {
    if (total <= 0) return { offset: 0, fraction: 0 };
    const fraction = Math.max(0, v) / total;
    const offset = running;
    running += fraction;
    return { offset, fraction };
  });
}

export interface WaterfallBar {
  base: number;
  top: number;
  delta: number;
  balance: number;
}

/**
 * Compute the running-balance bars for a waterfall: each step's bar spans from
 * the previous balance to the new balance (base = lower, top = higher).
 */
export function waterfallLayout(start: number, deltas: readonly number[]): WaterfallBar[] {
  let balance = start;
  return deltas.map((delta) => {
    const prev = balance;
    balance = prev + delta;
    return { base: Math.min(prev, balance), top: Math.max(prev, balance), delta, balance };
  });
}

function toneColor(tone: Tone | undefined): string {
  return TONE_COLOR[tone ?? "neutral"];
}

/* ------------------------------------------------------------------ */
/* LineChart                                                          */
/* ------------------------------------------------------------------ */

export interface LineSeries {
  label: string;
  tone: Tone;
  points: number[];
}

export interface LineChartProps {
  series: LineSeries[];
  xLabels?: string[];
  height?: number;
  ariaLabel: string;
  className?: string;
}

/** Multi-series trend line (e.g. kas masuk vs keluar across months). */
export function LineChart({ series, xLabels, height = 120, ariaLabel, className }: LineChartProps): ReactNode {
  const width = 320;
  const allValues = series.flatMap((s) => s.points);
  const max = Math.max(1, ...allValues);
  return (
    <figure className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {series.map((s) => (
          <path
            key={s.label}
            className="line-series"
            d={buildLinePath(s.points, { width, height, max, min: 0 })}
            fill="none"
            stroke={toneColor(s.tone)}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted-fg">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: toneColor(s.tone) }} />
            {s.label}
          </span>
        ))}
        {xLabels && xLabels.length > 0 ? (
          <span className="sr-only">{xLabels.join(", ")}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* GaugeChart                                                          */
/* ------------------------------------------------------------------ */

export interface GaugeChartProps {
  value: number;
  label?: ReactNode;
  tone?: Tone;
  size?: number;
  ariaLabel: string;
  className?: string;
}

/** Half-circle gauge for a 0..100 percentage (e.g. budget serapan). */
export function GaugeChart({ value, label, tone = "brand", size = 140, ariaLabel, className }: GaugeChartProps): ReactNode {
  const pct = clamp(value, PCT_MIN, PCT_MAX);
  const radius = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius; // half circle
  const dash = (pct / PCT_MAX) * circumference;
  return (
    <figure className={cn("flex flex-col items-center", className)} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${size} ${size / 2 + 12}`} className="w-full max-w-[200px]">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--color-border, #e5e7eb)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={toneColor(tone)}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${r2(dash)} ${r2(circumference)}`}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-fg text-lg font-semibold" style={{ fontSize: 20 }}>
          {Math.round(pct)}%
        </text>
      </svg>
      {label ? <figcaption className="text-xs text-muted-fg">{label}</figcaption> : null}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* WaterfallChart                                                      */
/* ------------------------------------------------------------------ */

export interface WaterfallStep {
  label: string;
  delta: number;
  tone?: Tone;
}

export interface WaterfallChartProps {
  start: number;
  steps: WaterfallStep[];
  height?: number;
  ariaLabel: string;
  className?: string;
}

/** Waterfall of cash movements (saldo awal → masuk → keluar → saldo akhir). */
export function WaterfallChart({ start, steps, height = 140, ariaLabel, className }: WaterfallChartProps): ReactNode {
  const bars = waterfallLayout(start, steps.map((s) => s.delta));
  const maxTop = Math.max(start, ...bars.map((b) => b.top), 1);
  const width = 320;
  const slot = steps.length > 0 ? width / steps.length : width;
  const barW = slot * 0.6;
  return (
    <figure className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {bars.map((b, i) => {
          const step = steps[i]!;
          const y = r2(height - (b.top / maxTop) * height);
          const h = r2(((b.top - b.base) / maxTop) * height) || 1;
          const x = r2(i * slot + (slot - barW) / 2);
          const tone = step.tone ?? (b.delta >= 0 ? "emerald" : "rose");
          return (
            <rect
              key={`${step.label}-${i}`}
              className="waterfall-bar"
              x={x}
              y={y}
              width={r2(barW)}
              height={h}
              rx={2}
              fill={toneColor(tone)}
            />
          );
        })}
      </svg>
      <figcaption className="mt-2 flex justify-between text-[11px] text-muted-fg">
        {steps.map((s, i) => (
          <span key={`${s.label}-${i}`} className="truncate text-center" style={{ width: `${100 / Math.max(1, steps.length)}%` }}>
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* StackedBarChart                                                    */
/* ------------------------------------------------------------------ */

export interface StackSegment {
  value: number;
  tone: Tone;
}

export interface StackGroup {
  label: string;
  segments: StackSegment[];
}

export interface StackedBarChartProps {
  groups: StackGroup[];
  height?: number;
  ariaLabel: string;
  className?: string;
}

/** Per-period stacked bars (e.g. pemasukan vs pengeluaran per bulan). */
export function StackedBarChart({ groups, height = 140, ariaLabel, className }: StackedBarChartProps): ReactNode {
  const totals = groups.map((g) => g.segments.reduce((a, s) => a + Math.max(0, s.value), 0));
  const maxTotal = Math.max(1, ...totals);
  const width = 320;
  const slot = groups.length > 0 ? width / groups.length : width;
  const barW = slot * 0.55;
  return (
    <figure className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {groups.map((g, gi) => {
          let cursor = 0;
          const x = r2(gi * slot + (slot - barW) / 2);
          return g.segments.map((s, si) => {
            const segH = r2((Math.max(0, s.value) / maxTotal) * height);
            cursor += segH;
            const y = r2(height - cursor);
            return (
              <rect
                key={`${g.label}-${si}`}
                className="stacked-bar"
                x={x}
                y={y}
                width={r2(barW)}
                height={segH || 0}
                fill={toneColor(s.tone)}
              />
            );
          });
        })}
      </svg>
      <figcaption className="mt-2 flex justify-between text-[11px] text-muted-fg">
        {groups.map((g, i) => (
          <span key={`${g.label}-${i}`} className="truncate text-center" style={{ width: `${100 / Math.max(1, groups.length)}%` }}>
            {g.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
