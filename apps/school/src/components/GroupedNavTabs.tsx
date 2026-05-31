import { Link } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

// Grouped sub-navigation shared by module layouts (Akademik, Master Data, ...).
//
// Two layouts:
// - "stacked" (default): an uppercase label above a row of Tabs, per group.
//   Suits modules with many groups.
// - "inline": a single horizontal, horizontally-scrollable pill bar. Group
//   labels are dropped; groups are separated by a thin vertical divider. Active
//   item is a solid pill. Compact, no vertical stacking.
//
// A tab is active on exact match or, unless `exact`, on any nested path beneath it.

export interface NavTabItem {
  to: string;
  label: string;
  exact?: boolean;
}

export interface NavTabGroup {
  label: string;
  items: NavTabItem[];
}

export type NavTabsVariant = "stacked" | "inline";

const PILL_BASE =
  "whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
const PILL_ACTIVE = "bg-brand text-white shadow-sm";
const PILL_IDLE = "text-muted-fg hover:bg-muted hover:text-fg";

export function isActive(pathname: string, to: string, exact?: boolean): boolean {
  return exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
}

export function GroupedNavTabs({
  groups,
  pathname,
  variant = "stacked",
}: {
  groups: NavTabGroup[];
  pathname: string;
  variant?: NavTabsVariant;
}) {
  if (variant === "inline") {
    return <InlineNavPills groups={groups} pathname={pathname} />;
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const tabs: TabItem[] = g.items.map((t) => ({
          key: t.to,
          label: t.label,
          active: isActive(pathname, t.to, t.exact),
          render: ({ className, children }) => (
            <Link to={t.to} className={className}>
              {children}
            </Link>
          ),
        }));
        return (
          <div key={g.label}>
            <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
              {g.label}
            </div>
            <Tabs items={tabs} />
          </div>
        );
      })}
    </div>
  );
}

// Single-row pill bar. Groups keep their order but lose their label; a hairline
// divider marks each group boundary. The row scrolls horizontally so additional
// menu items stay reachable without wrapping or changing layout height.
function InlineNavPills({
  groups,
  pathname,
}: {
  groups: NavTabGroup[];
  pathname: string;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-bg p-1">
      {groups.map((g, gi) => (
        <div key={g.label} className="flex items-center gap-1">
          {gi > 0 ? (
            <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
          ) : null}
          {g.items.map((t) => {
            const active = isActive(pathname, t.to, t.exact);
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active ? "page" : undefined}
                className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
