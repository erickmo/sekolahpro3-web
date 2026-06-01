/**
 * Advanced, dependency-free SVG visualization primitives for the PPDB redesign.
 * Like the base charts: SSR-safe, accessible (role="img" + summarizing
 * aria-label), responsive (className passthrough), and degrades on empty/zero
 * input — never throws. Builds on ./charts tones but keeps its own geometry
 * helpers so charts.tsx stays untouched.
 */
import type { ReactNode } from "react";
import { cn } from "@sekolahpro/ui";
import { TONE_COLOR, type Tone } from "./charts";

const PERCENT_MAX = 100;
const PERCENT_MIN = 0;
const DEG_TO_RAD = Math.PI / 180;
const SEMICIRCLE_DEG = 180;
const DEFAULT_FALLBACK_TONE: Tone = "neutral";

/** Clamp a number into the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Resolve a tone to its concrete color, falling back to neutral. */
function toneColor(tone: Tone | undefined): string {
  return TONE_COLOR[tone ?? DEFAULT_FALLBACK_TONE];
}

/** Percentage of `value` against `total` as an integer (0 when total <= 0). */
function percentOf(value: number, total: number): number {
  // Guard against divide-by-zero so empty data yields 0% instead of NaN.
  if (total <= 0) return 0;
  return Math.round((Math.max(0, value) / total) * PERCENT_MAX);
}

const EMPTY_CLASS =
  "flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-fg";

/** Dashed placeholder shown by charts when there is nothing to draw. */
function EmptyChart({
  ariaLabel, className,
}: { ariaLabel: string; className?: string | undefined }): ReactNode {
  return (
    <div className={cn(EMPTY_CLASS, className)} role="img" aria-label={ariaLabel}>Belum ada data</div>
  );
}

/** Convert a polar point (angle in deg) to cartesian SVG coordinates. */
function polarToCartesian(
  cx: number, cy: number, radius: number, angleDeg: number,
): { x: number; y: number } {
  const rad = angleDeg * DEG_TO_RAD;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/** Build an SVG arc path between two angles (deg) on a circle (gauge sweep). */
function describeArc(
  cx: number, cy: number, radius: number, startDeg: number, endDeg: number,
): string {
  const start = polarToCartesian(cx, cy, radius, startDeg);
  const end = polarToCartesian(cx, cy, radius, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) <= SEMICIRCLE_DEG ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/* --- FunnelChart --- */

/** A single funnel stage: a labelled, toned count. */
export interface FunnelStage {
  label: string;
  value: number;
  tone?: Tone;
}

export interface FunnelChartProps {
  stages: FunnelStage[];
  className?: string;
}

const FUNNEL_MIN_WIDTH_PCT = 12; // floor so a zero/tiny stage stays visible
const FUNNEL_ROW_HEIGHT = 34;

/** Build the human-readable aria summary for a funnel. */
function funnelSummary(stages: FunnelStage[]): string {
  return stages.map((s) => `${s.label}: ${s.value}`).join(", ");
}

/** A single rendered funnel row: tapering bar + count and percent labels. */
function FunnelRow({
  stage, baseline,
}: { stage: FunnelStage; baseline: number }): ReactNode {
  const pct = percentOf(stage.value, baseline);
  // Bar width tracks share of the first stage but never collapses fully.
  const widthPct = Math.max(FUNNEL_MIN_WIDTH_PCT, pct);
  const barStyle = {
    width: `${widthPct}%`,
    height: FUNNEL_ROW_HEIGHT,
    background: toneColor(stage.tone),
  };
  return (
    <li className="flex flex-col items-center gap-1">
      <div className="flex w-full items-center justify-between text-xs">
        <span className="truncate text-muted-fg" title={stage.label}>{stage.label}</span>
        <span className="shrink-0 text-fg">
          <span className="font-medium tabular-nums">{stage.value}</span>{" "}
          <span className="text-muted-fg tabular-nums">({pct}%)</span>
        </span>
      </div>
      <div className="rounded-md" style={barStyle} />
    </li>
  );
}

/**
 * Vertical conversion funnel: tapering bars ∝ each stage's share of the FIRST
 * stage, with count + percent-of-first. Empty placeholder when no stages.
 */
export function FunnelChart({ stages, className }: FunnelChartProps): ReactNode {
  if (stages.length === 0) {
    return <EmptyChart ariaLabel="Diagram corong tanpa data" className={className} />;
  }
  // Baseline is the first stage; min 1 keeps percentages finite on all-zero.
  const baseline = Math.max(1, stages[0]?.value ?? 0);
  return (
    <ul
      className={cn("flex flex-col gap-3", className)}
      role="img"
      aria-label={`Diagram corong. ${funnelSummary(stages)}`}
    >
      {stages.map((stage) => (
        <FunnelRow key={stage.label} stage={stage} baseline={baseline} />
      ))}
    </ul>
  );
}

/* --- GaugeArc --- */

export interface GaugeArcProps {
  value: number;
  max: number;
  tone?: Tone;
  size?: number;
  label?: ReactNode;
  className?: string;
}

const GAUGE_DEFAULT_SIZE = 160;
const GAUGE_THICKNESS = 14;
const GAUGE_START_DEG = 180; // left end of the semicircle
const GAUGE_END_DEG = 360; // right end of the semicircle (full sweep)

/** One stroked arc of the gauge (shared by track and fill to avoid dupes). */
function GaugeArcPath({ d, stroke }: { d: string; stroke: string }): ReactNode {
  return (
    <path d={d} fill="none" stroke={stroke} strokeWidth={GAUGE_THICKNESS} strokeLinecap="round" />
  );
}

/** Geometry derived once for a gauge of a given size. */
function gaugeGeometry(
  size: number,
): { cx: number; cy: number; radius: number; height: number } {
  const cx = size / 2;
  const radius = cx - GAUGE_THICKNESS / 2;
  // Semicircle only needs half the height plus the stroke for the baseline.
  const height = cx + GAUGE_THICKNESS;
  return { cx, cy: cx, radius, height };
}

/**
 * 180° semicircular gauge. Filled arc sweeps from the left ∝ value/max (clamped
 * to [0, max]); center shows value/max + percent. Safe on max <= 0 (0%).
 */
export function GaugeArc({
  value, max, tone = "brand", size = GAUGE_DEFAULT_SIZE, label, className,
}: GaugeArcProps): ReactNode {
  const { cx, cy, radius, height } = gaugeGeometry(size);
  const safeValue = clamp(value, PERCENT_MIN, Math.max(0, max));
  const pct = percentOf(safeValue, max);
  // Fraction of the 180° sweep that should be filled.
  const fillEndDeg = GAUGE_START_DEG + (pct / PERCENT_MAX) * SEMICIRCLE_DEG;
  const trackPath = describeArc(cx, cy, radius, GAUGE_START_DEG, GAUGE_END_DEG);
  const fillPath = describeArc(cx, cy, radius, GAUGE_START_DEG, fillEndDeg);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height }}>
        <svg
          width={size} height={height} viewBox={`0 0 ${size} ${height}`} role="img"
          aria-label={`Pengukur ${safeValue} dari ${max}, ${pct} persen`}
        >
          <GaugeArcPath d={trackPath} stroke="var(--color-muted, #e5e7eb)" />
          {pct > 0 ? <GaugeArcPath d={fillPath} stroke={toneColor(tone)} /> : null}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-2xl font-semibold text-fg tabular-nums">
            {safeValue}<span className="text-base text-muted-fg">/{max}</span>
          </span>
          <span className="text-xs text-muted-fg tabular-nums">{pct}%</span>
        </div>
      </div>
      {label ? <span className="mt-1 text-xs text-muted-fg">{label}</span> : null}
    </div>
  );
}

/* --- TrendArea --- */

export interface TrendAreaProps {
  points: number[];
  labels?: string[];
  tone?: Tone;
  height?: number;
  className?: string;
}

const TREND_DEFAULT_HEIGHT = 80;
const TREND_WIDTH = 240;
const TREND_PADDING = 4;
const TREND_AREA_OPACITY = 0.18;
const TREND_MIN_POINTS = 2;

/** Map data points to "x,y" coordinate strings for the line polyline. */
function trendCoords(
  points: number[], width: number, height: number,
): { x: number; y: number }[] {
  const min = Math.min(...points);
  const max = Math.max(...points);
  // span min 1 avoids divide-by-zero when every point is identical.
  const span = max - min || 1;
  const step = (width - TREND_PADDING * 2) / (points.length - 1);
  const usable = height - TREND_PADDING * 2;
  return points.map((p, i) => ({
    x: TREND_PADDING + i * step,
    y: TREND_PADDING + usable - ((p - min) / span) * usable,
  }));
}

/** Build the line + closed area path strings from coordinates. */
function trendPaths(
  coords: { x: number; y: number }[], height: number,
): { line: string; area: string } {
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];
  // Guard for the empty/degenerate case; callers only invoke this with >=2
  // points, but the compiler cannot prove the array is non-empty.
  if (!first || !last) return { line, area: line };
  const baseY = height - TREND_PADDING;
  // Close the polygon down to the baseline to fill the area beneath the line.
  const area = `${first.x.toFixed(1)},${baseY} ${line} ${last.x.toFixed(1)},${baseY}`;
  return { line, area };
}

/** Optional x-axis labels rendered beneath the area. */
function TrendLabels({ labels }: { labels: string[] }): ReactNode {
  return (
    <div className="mt-1 flex justify-between text-[10px] text-muted-fg">
      {labels.map((l, i) => (
        <span key={`${l}-${i}`} className="truncate">{l}</span>
      ))}
    </div>
  );
}

/**
 * Filled area trend line over a numeric series, with optional x-axis labels.
 * Renders an empty placeholder when fewer than two points are supplied.
 */
export function TrendArea({
  points, labels, tone = "brand", height = TREND_DEFAULT_HEIGHT, className,
}: TrendAreaProps): ReactNode {
  const hasTrend = points.length >= TREND_MIN_POINTS;
  const color = toneColor(tone);
  const coords = hasTrend ? trendCoords(points, TREND_WIDTH, height) : [];
  const paths = hasTrend ? trendPaths(coords, height) : null;

  return (
    <div className={cn("w-full", className)}>
      <svg
        width="100%" height={height} viewBox={`0 0 ${TREND_WIDTH} ${height}`}
        preserveAspectRatio="none" className="overflow-visible" role="img"
        aria-label={
          hasTrend ? `Area tren dengan ${points.length} titik data` : "Area tren tanpa data"
        }
      >
        {paths ? (
          <>
            <polygon points={paths.area} fill={color} opacity={TREND_AREA_OPACITY} />
            <polyline
              points={paths.line} fill="none" stroke={color} strokeWidth={2}
              strokeLinejoin="round" strokeLinecap="round"
            />
          </>
        ) : null}
      </svg>
      {labels && labels.length > 0 ? <TrendLabels labels={labels} /> : null}
    </div>
  );
}
