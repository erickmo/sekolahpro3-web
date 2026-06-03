// ModuleHeader — one cohesive, full-bleed sticky header for a module layout.
//
// Modules (Akademik, Ekstrakurikuler, Perpustakaan) used to render their
// "konteks" bar and their sub-navigation as two detached blocks separated by a
// layout gap (`space-y-4` + the bar's own bottom margin). This component fuses
// them into a single sticky panel: the `context` row sits on top, a hairline
// divider splits it from the `nav` row below, and the panel's own bottom border
// closes it off. Both rows pin to the viewport top together on scroll, so the
// navigation never drifts away from its context.
//
// The context bars and nav are passed in as slots so this stays layout-only and
// router-free; callers render the konteks content and a `GroupedNavTabs`
// (variant="header") into the two slots.
//
// The negative margins make the panel bleed past the AppShell <main> padding on
// all four sides (`-mx-*` cancels the horizontal padding, `-mt-*` the top
// padding), so it sits flush under the global topbar with no gap above it.
// `-mt-6 lg:-mt-8` mirrors <main>'s `p-6 lg:p-8`. The top bleed is dropped when
// the global setup banner is present so the header does not overlap it.
import type { ReactNode } from "react";
import { cn } from "@sekolahpro/ui";
import { useSetupBannerActive } from "../lib/setupBanner";

/**
 * Sticky module header wrapping a context row and a sub-nav row as one panel.
 *
 * @param context konteks/role-framing content (already padded by the caller);
 *                omit it for config-only modules that have no context row.
 * @param nav     sub-navigation node (use GroupedNavTabs variant="header")
 */
export function ModuleHeader({ context, nav }: { context?: ReactNode; nav: ReactNode }) {
  // Skip the top bleed when the global setup banner sits above us, otherwise the
  // negative margin would pull the sticky header up over the banner.
  const bannerActive = useSetupBannerActive();
  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-4 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/75 sm:-mx-6 lg:-mx-8",
        !bannerActive && "-mt-6 lg:-mt-8",
      )}
    >
      {/* Divider between konteks and nav; the panel's outer border closes the
          bottom. Skipped when there is no context (config-only modules). */}
      {context != null ? <div className="border-b border-border">{context}</div> : null}
      <div className="px-4 py-2 sm:px-6 lg:px-8">{nav}</div>
    </div>
  );
}
