// AkademikContextBar — period chrome for the Akademik workspace (per Tahun Ajaran).
//
// Period-first IA: the Tahun Ajaran is now chosen on the hub and fixed by the
// route path, so this bar no longer carries a TA dropdown. It shows the active TA
// as a read-only label, the period status (berjalan / lampau), the user role
// badge, and the Semester selector (the only period axis still switched in place).
//
// Renders inner content only (konteks row + optional banner); the sticky,
// full-bleed panel chrome lives in ModuleHeader so the bar and the sub-nav read
// as one cohesive header.
import { Fragment, useCallback } from "react";
import {
  Badge,
  SearchableSelect,
  SetupBanner,
  IconUsers,
  IconCalendar,
  type SearchableOption,
} from "@sekolahpro/ui";
import { useAkademikContext } from "../../lib/akademikContext";
import { useAkademikRole, ROLE_LABEL } from "../../lib/akademikRole";
import { resolvePeriodeStatus } from "../../lib/akademikPeriode";
import { PeriodeStatusBadge } from "../shell/PeriodeStatusBadge";

// Period-status vocabulary now lives in lib/akademikPeriode (single source,
// shared with the cross-module StripTahun). Re-exported here for the existing
// consumers/tests that import it from this module.
export { resolvePeriodeStatus, STATUS_LABEL } from "../../lib/akademikPeriode";

const SEMESTER_OPTIONS: SearchableOption[] = [
  { value: "Ganjil", label: "Ganjil" },
  { value: "Genap", label: "Genap" },
];

const SWITCH_CONFIRM = "Ganti semester? Perubahan yang belum disimpan akan hilang.";

/** Badge peran pengguna aktif — hanya untuk framing, tidak membatasi fitur. */
function RoleBadge() {
  const { primary } = useAkademikRole();
  return (
    <Badge tone="brand" className="gap-1">
      {/* shrink-0 so the glyph keeps its fixed size inside the flex badge */}
      <IconUsers className="h-3 w-3 shrink-0" aria-hidden />
      {ROLE_LABEL[primary]}
    </Badge>
  );
}

/**
 * Period context bar for a TA workspace. `taLabel` is the active Tahun Ajaran's
 * display name (read-only here — switching TA happens on the hub/breadcrumb).
 */
export function AkademikContextBar({ taLabel }: { taLabel?: string }) {
  const { semester, setSemester, isPastPeriod, noActiveTa, dirty } = useAkademikContext();

  // Konfirmasi sebelum ganti semester bila ada edit belum tersimpan.
  const guarded = useCallback(
    (fn: (v: string) => void) => (v: string) => {
      if (dirty && !globalThis.confirm(SWITCH_CONFIRM)) return;
      fn(v);
    },
    [dirty],
  );

  const periodeStatus = resolvePeriodeStatus(noActiveTa, isPastPeriod);

  return (
    <Fragment>
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
            Konteks Akademik
          </span>
          <PeriodeStatusBadge status={periodeStatus} />
        </div>

        {/* Tahun Ajaran aktif — read-only; ganti TA lewat menu/breadcrumb Akademik. */}
        {taLabel ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted-fg shrink-0">Tahun Ajaran</span>
            <Badge tone="neutral" className="gap-1 max-w-[12rem]">
              <IconCalendar className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{taLabel}</span>
            </Badge>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-fg shrink-0" htmlFor="akademik-semester">Semester</label>
          <SearchableSelect
            id="akademik-semester"
            value={semester}
            onChange={guarded(setSemester)}
            options={SEMESTER_OPTIONS}
            placeholder="Pilih semester…"
            className="w-36"
          />
        </div>

        {/* Peran pengguna aktif — didorong ke kanan agar terbaca sebagai konteks "siapa". */}
        <div className="ml-auto flex items-center gap-2">
          <RoleBadge />
        </div>
      </div>

      {(isPastPeriod || noActiveTa) && (
        <div className="px-4 sm:px-6 lg:px-8 pb-2.5">
          {noActiveTa ? (
            <SetupBanner
              tone="info"
              title="Belum ada Tahun Ajaran aktif"
              description="Atur Tahun Ajaran aktif di Master Data agar periode terpilih otomatis."
            />
          ) : (
            <SetupBanner
              tone="warning"
              title="Anda membuka periode lampau/ditutup"
              description="Tahun Ajaran ini sudah ditutup atau di luar rentang tanggalnya. Dibuka read-only untuk audit & cetak ulang."
            />
          )}
        </div>
      )}
    </Fragment>
  );
}
