// TahunChip — passive, read-only Tahun Ajaran chip for date-driven surfaces
// (daily attendance: dashboard / Harian / Pelajaran).
//
// Presentational + props-only. Unlike StripTahun it renders NO clickable control
// and no status/setup banner — just a compact badge so the active year is
// VISIBLE without competing with the page's primary action (mark-present). This
// is the "passive chip" the debate (critic #1) mandates for daily flows where a
// switchable TA selector would be a beginner trap.
import { Badge, IconCalendar, IconUsers } from "@sekolahpro/ui";

export interface TahunChipProps {
  /** Active Tahun Ajaran display name. */
  label: string;
  /** Optional microcopy clarifying the chip is passive (e.g. "otomatis ikut tanggal"). */
  hint?: string;
  /** Optional right-aligned role label (framing only). */
  roleLabel?: string;
}

/** Passive Tahun Ajaran chip — see file header. */
export function TahunChip({ label, hint, roleLabel }: TahunChipProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-fg">
      <Badge tone="neutral" className="gap-1">
        <IconCalendar className="h-3 w-3 shrink-0" aria-hidden />
        TA {label}
      </Badge>
      {hint ? <span>{hint}</span> : null}
      {roleLabel ? (
        <span className="ml-auto">
          <Badge tone="brand" className="gap-1">
            <IconUsers className="h-3 w-3 shrink-0" aria-hidden />
            {roleLabel}
          </Badge>
        </span>
      ) : null}
    </div>
  );
}
