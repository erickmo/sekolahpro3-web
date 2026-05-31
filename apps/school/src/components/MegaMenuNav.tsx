import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { isActive, type NavTabGroup, type NavTabItem } from "./GroupedNavTabs";

// Dropdown mega menu for module layouts (Master Data, ...). One trigger button
// opens a wide grouped panel; replaces the always-expanded GroupedNavTabs rows
// so dense master navigation stays out of the way until invoked.

const DEFAULT_TRIGGER_LABEL = "Menu";

/**
 * Pick the most specific active item across all groups for the current path.
 * Longest matching `to` wins so a nested detail route highlights its leaf, not
 * a shorter parent. Returns undefined when nothing matches.
 * @param groups grouped nav definition
 * @param pathname current router pathname
 */
export function findActiveItem(
  groups: NavTabGroup[],
  pathname: string,
): NavTabItem | undefined {
  let best: NavTabItem | undefined;
  for (const group of groups) {
    for (const item of group.items) {
      if (!isActive(pathname, item.to, item.exact)) continue;
      // Prefer the longer `to`; it is the deeper, more specific route.
      if (!best || item.to.length > best.to.length) best = item;
    }
  }
  return best;
}

/** Chevron that rotates when the menu is open. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Grouped dropdown mega menu. Click trigger to open a panel of grouped links;
 * closes on outside click, Escape, or selecting an item.
 * @param groups grouped nav definition (shared with GroupedNavTabs)
 * @param pathname current router pathname for active highlighting
 * @param triggerLabel optional label shown when no item is active
 */
export function MegaMenuNav({
  groups,
  pathname,
  triggerLabel = DEFAULT_TRIGGER_LABEL,
}: {
  groups: NavTabGroup[];
  pathname: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = findActiveItem(groups, pathname);

  // Close on outside click + Escape so the panel never traps the user.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <span>{active?.label ?? triggerLabel}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 grid w-[34rem] max-w-[90vw] grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 shadow-lg">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
                {group.label}
              </div>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const itemActive = isActive(pathname, item.to, item.exact);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`block rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                          itemActive
                            ? "bg-muted font-medium text-fg"
                            : "text-muted-fg"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
