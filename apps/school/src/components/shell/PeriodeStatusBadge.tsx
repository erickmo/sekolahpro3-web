// PeriodeStatusBadge — small status pill for the period (Tahun Ajaran) chrome.
//
// Presentational + props-only. Shared by AkademikContextBar and the cross-module
// StripTahun so the period-status vocabulary (tone + label + icon) lives in one
// place. The status vocabulary itself is pure data in lib/akademikPeriode.
import { Badge, IconCheck, IconClock } from "@sekolahpro/ui";
import { STATUS_TONE, STATUS_LABEL, type PeriodeStatus } from "../../lib/akademikPeriode";

/** Badge kecil penanda status periode (berjalan / lampau / belum-aktif). */
export function PeriodeStatusBadge({ status }: { status: PeriodeStatus }) {
  const Icon = status === "aktif" ? IconCheck : IconClock;
  return (
    <Badge tone={STATUS_TONE[status]} className="gap-1">
      {/* shrink-0 so the glyph keeps its fixed size inside the flex badge */}
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
