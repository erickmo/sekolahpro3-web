// OrangContextBar — role-framing bar for the people-domain modules (Siswa and
// Guru & Staff). Like PerpustakaanContextBar (and unlike Akademik/Ekstrakurikuler
// which select a period), these modules have no period context; this bar instead
// anchors WHO the user is and WHAT the module's focus is, plus a slot for an
// optional primary action. Roles only frame the UI — they never hide features.
//
// DIVERGENCE FROM PerpustakaanContextBar (intentional, do not "fix" to match):
// the perpustakaan bar keys its focus line by ROLE because it is one module with
// three audiences. Here a single component serves TWO modules, so the axis that
// matters is the module (kesiswaan vs kepegawaian) — TITLE and FOCUS are keyed by
// `domain`, while the role is still surfaced via the Badge. Add a [domain][role]
// matrix later only if role-specific focus copy is needed.
//
// Renders the konteks row only; the sticky, full-bleed panel chrome lives in
// ModuleHeader so the bar and the sub-nav read as one cohesive header.
import type { ReactNode } from "react";
import { Badge, IconUsers, cn } from "@sekolahpro/ui";
import { useOrangRole, ROLE_LABEL } from "../../lib/orangRole";

/** The two people-domain modules this bar serves. */
export type OrangDomain = "siswa" | "staff";

/** Konteks label shown per module. */
const TITLE: Record<OrangDomain, string> = {
  siswa: "Konteks Kesiswaan",
  staff: "Konteks Kepegawaian",
};

/** One-line "what this module is about" framing per module. */
const FOCUS: Record<OrangDomain, string> = {
  siswa: "Fokus: data pokok, penerimaan, mutasi, dan kelulusan siswa.",
  staff: "Fokus: data pegawai, penugasan mengajar, dan administrasi kepegawaian.",
};

/**
 * Sticky context bar shown at the top of every Siswa / Staff page. `cta` is an
 * optional action slot (the layout passes a router <Link>) so this component
 * stays router-free and trivially testable.
 *
 * @param domain which people-domain module is rendering this bar
 * @param cta    optional primary-action node, pinned to the row's right edge
 */
export function OrangContextBar({ domain, cta }: { domain: OrangDomain; cta?: ReactNode }) {
  const { primary } = useOrangRole();
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
          {TITLE[domain]}
        </span>
        <Badge tone="brand" className={cn("gap-1")}>
          <IconUsers className="h-3 w-3" aria-hidden />
          {ROLE_LABEL[primary]}
        </Badge>
      </div>

      <p className="min-w-0 text-xs text-muted-fg">{FOCUS[domain]}</p>

      {cta ? <div className="ml-auto flex items-center gap-2">{cta}</div> : null}
    </div>
  );
}
