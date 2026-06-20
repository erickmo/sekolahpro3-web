// School sidebar item factory. Extracted from routes/__root.tsx so the scoped-Link
// wiring (active-state matching + optional `?search` query) is unit-testable
// without rendering the full authenticated root shell. The koperasi sibling
// (`mkKop`) stays inline in __root — it is not under test and uses the /kop scope.
//
// Layer: presentation helper (pure given slug + pathname; no session/IO).
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { type SidebarNavSection } from "@sekolahpro/ui";
import { scopedActivePath, scopedParams, scopedTo } from "./scoped";

/** A SidebarNav item enriched with the bare route `to` it points at. */
export type SidebarItem = SidebarNavSection["items"][number] & { to: string };

/**
 * Build an `mk(to, label, icon, badge?, search?)` sidebar-item factory bound to the
 * active school `slug` and current `pathname`.
 *
 * Each produced item renders a scoped `<Link>`:
 *  - active-state highlights the parent on nested routes (`/akademik/**`), except
 *    "/" (Dashboard) which must match exactly so it does not light up everywhere;
 *  - when a `search` object is given it is forwarded as the Link query (e.g. the
 *    Akademik item forces the TA-hub picker open with `{ pick: 1 }`); omitted
 *    entirely otherwise so other items link to a bare path;
 *  - with no slug the item degrades to a link to `/pilih` (school not yet chosen).
 *
 * @param slug - Active school slug (kode_pendek), or undefined before selection.
 * @param pathname - Current router pathname, for active-state comparison.
 * @returns The `mk` factory used to build each sidebar item.
 */
export function makeMk(slug: string | undefined, pathname: string) {
  return (
    to: string,
    label: string,
    icon: ReactNode,
    badge?: string | number,
    search?: Record<string, unknown>,
  ): SidebarItem => {
    const livePath = scopedActivePath(slug, to);
    const isActive =
      to === "/" ? pathname === livePath : pathname === livePath || pathname.startsWith(`${livePath}/`);
    return {
      to,
      label,
      icon,
      badge,
      active: slug ? isActive : false,
      render: ({ className, children }: { className: string; children: ReactNode }) =>
        slug ? (
          <Link
            to={scopedTo(slug, to)}
            params={scopedParams(slug)}
            // Spread the query only when present so `exactOptionalPropertyTypes`
            // never sees an explicit `search={undefined}` on bare-path items.
            {...(search ? { search: search as never } : {})}
            className={className}
          >
            {children}
          </Link>
        ) : (
          <Link to="/pilih" className={className}>
            {children}
          </Link>
        ),
    };
  };
}
