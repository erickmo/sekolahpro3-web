// StripTahun — read-only Tahun Ajaran context strip; the period-flavoured
// sibling of ModuleContextBar.
//
// Presentational + props-only (no React context, no router), so any
// period-aware module (Jadwal / Kelas / Absensi) can feed it into ModuleShell's
// `context` slot. It makes the active school year VISIBLE without forcing a
// choice; it does NOT itself filter any data — pass `note` to say so when the
// page below is unfiltered. Status vocabulary is shared via lib/akademikPeriode.
import { Fragment } from "react";
import {
  Badge,
  SearchableSelect,
  SetupBanner,
  IconUsers,
  IconCalendar,
  type SearchableOption,
} from "@sekolahpro/ui";
import { resolvePeriodeStatus } from "../../lib/akademikPeriode";
import { PeriodeStatusBadge } from "./PeriodeStatusBadge";

/** A dropdown the strip can switch (TA or Semester); handlers come from the layout. */
export interface PeriodSwitch {
  value: string;
  options: SearchableOption[];
  onChange: (v: string) => void;
}

export interface StripTahunProps {
  /** Module name, rendered as the "Konteks {moduleLabel}" eyebrow. */
  moduleLabel: string;
  /** Active Tahun Ajaran display name (read-only badge). Ignored when taSwitch is set. */
  taLabel?: string;
  /** When set, render the TA as a dropdown (archive-switchable) instead of a read-only badge. */
  taSwitch?: PeriodSwitch;
  /** When set, render a Semester dropdown next to the TA. */
  semesterSwitch?: PeriodSwitch;
  /** Whether the active period is past/closed (drives 'lampau' + archive banner). */
  isPastPeriod: boolean;
  /** Whether the school has no active TA set (drives 'belum-aktif' + setup nudge). */
  noActiveTa: boolean;
  /** Optional right-aligned role label (framing only, never gates features). */
  roleLabel?: string;
  /** Optional clarifying line below the row (e.g. that the list is not filtered). */
  note?: string;
}

/** Read-only period context strip — see file header. */
export function StripTahun({
  moduleLabel,
  taLabel,
  taSwitch,
  semesterSwitch,
  isPastPeriod,
  noActiveTa,
  roleLabel,
  note,
}: StripTahunProps) {
  const status = resolvePeriodeStatus(noActiveTa, isPastPeriod);
  return (
    <Fragment>
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
            Konteks {moduleLabel}
          </span>
          <PeriodeStatusBadge status={status} />
        </div>

        {/* Tahun Ajaran — a dropdown when switchable, else a read-only badge. */}
        {taSwitch || taLabel ? (
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs text-muted-fg shrink-0" htmlFor="strip-tahun-ta">
              Tahun Ajaran
            </label>
            {taSwitch ? (
              <SearchableSelect
                id="strip-tahun-ta"
                value={taSwitch.value}
                onChange={taSwitch.onChange}
                options={taSwitch.options}
                placeholder="Pilih TA…"
                className="w-48"
              />
            ) : (
              <Badge tone="neutral" className="gap-1 max-w-[12rem]">
                <IconCalendar className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{taLabel}</span>
              </Badge>
            )}
          </div>
        ) : null}

        {semesterSwitch ? (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-fg shrink-0" htmlFor="strip-tahun-semester">
              Semester
            </label>
            <SearchableSelect
              id="strip-tahun-semester"
              value={semesterSwitch.value}
              onChange={semesterSwitch.onChange}
              options={semesterSwitch.options}
              placeholder="Pilih semester…"
              className="w-44"
            />
          </div>
        ) : null}

        {roleLabel ? (
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="brand" className="gap-1">
              <IconUsers className="h-3 w-3 shrink-0" aria-hidden />
              {roleLabel}
            </Badge>
          </div>
        ) : null}
      </div>

      {note ? (
        <div className="px-4 sm:px-6 lg:px-8 -mt-1 pb-2">
          <p className="text-xs text-muted-fg">{note}</p>
        </div>
      ) : null}

      {isPastPeriod || noActiveTa ? (
        <div className="px-4 sm:px-6 lg:px-8 pb-2.5">
          {noActiveTa ? (
            <SetupBanner
              tone="info"
              title="Belum ada Tahun Ajaran aktif"
              description="Atur Tahun Ajaran aktif di Master Data agar tahun ajaran berjalan tampil di sini."
            />
          ) : (
            <SetupBanner
              tone="warning"
              title="Anda membuka periode lampau/ditutup"
              description="Tahun Ajaran ini sudah ditutup atau di luar rentang tanggalnya. Dibuka read-only untuk audit & cetak ulang."
            />
          )}
        </div>
      ) : null}
    </Fragment>
  );
}
