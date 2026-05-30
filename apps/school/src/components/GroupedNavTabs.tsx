import { Link } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

// Grouped sub-navigation shared by module layouts (Akademik, Master Data, ...).
// Each group renders an uppercase label above a row of Tabs; a tab is active on
// exact match or, unless `exact`, on any nested path beneath it.

export interface NavTabItem {
  to: string;
  label: string;
  exact?: boolean;
}

export interface NavTabGroup {
  label: string;
  items: NavTabItem[];
}

export function isActive(pathname: string, to: string, exact?: boolean): boolean {
  return exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
}

export function GroupedNavTabs({
  groups,
  pathname,
}: {
  groups: NavTabGroup[];
  pathname: string;
}) {
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
