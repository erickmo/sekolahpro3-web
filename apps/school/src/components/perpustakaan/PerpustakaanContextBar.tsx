// PerpustakaanContextBar — role-framing bar for the Perpustakaan module. Unlike
// Akademik (which selects a period), the library desk has no period context;
// this bar instead anchors WHO the user is and WHAT their daily focus is, plus a
// slot for the primary action (open the circulation terminal). Roles only frame
// the UI — they never hide functionality.
//
// Renders the konteks row only; the sticky, full-bleed panel chrome lives in
// ModuleHeader so the bar and the sub-nav read as one cohesive header.
import type { ReactNode } from "react";
import { Badge, IconUsers, cn } from "@sekolahpro/ui";
import { usePerpustakaanRole, ROLE_LABEL, type PerpustakaanRole } from "../../lib/perpustakaanRole";

/** One-line "what you focus on" framing per role, written for the daily desk. */
const ROLE_FOCUS: Record<PerpustakaanRole, string> = {
  petugas: "Fokus: sirkulasi harian — pinjam, kembali, reservasi, dan denda.",
  pustakawan: "Fokus: pengawasan koleksi, approval insiden, dan laporan.",
  admin: "Fokus: katalog, kategori, pengadaan, dan inventaris.",
};

/**
 * Sticky context bar shown at the top of every Perpustakaan page. `cta` is an
 * optional action slot (the layout passes a router <Link>) so this component
 * stays router-free and trivially testable.
 */
export function PerpustakaanContextBar({ cta }: { cta?: ReactNode }) {
  const { primary } = usePerpustakaanRole();
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
          Konteks Perpustakaan
        </span>
        <Badge tone="brand" className={cn("gap-1")}>
          <IconUsers className="h-3 w-3" aria-hidden />
          {ROLE_LABEL[primary]}
        </Badge>
      </div>

      <p className="min-w-0 text-xs text-muted-fg">{ROLE_FOCUS[primary]}</p>

      {cta ? <div className="ml-auto flex items-center gap-2">{cta}</div> : null}
    </div>
  );
}
