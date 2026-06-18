/**
 * ModuleShell — config-driven layout chrome shared by every module.
 *
 * Wraps the sticky, full-bleed {@link ModuleHeader} (context row + sub-nav row)
 * and the page outlet into the one cohesive shell used by the ekstrakurikuler
 * reference. Three context modes:
 *   - period/custom: pass a `context` node (akademik/ekstrakurikuler period bars);
 *   - role/framing:  pass `label` (+ optional framing/roleLabel/cta) → renders
 *     the shared {@link ModuleContextBar};
 *   - config-only:   pass neither → the context row is omitted entirely.
 *
 * The sub-nav is always the header-variant {@link GroupedNavTabs} built from
 * `navGroups`, so every module reads as the same pill row under one sticky panel.
 */
import type { ReactNode } from "react";
import { ModuleHeader } from "../ModuleHeader";
import { GroupedNavTabs, type NavTabGroup } from "../GroupedNavTabs";
import { ModuleContextBar, type ModuleContextBarProps } from "./ModuleContextBar";

export interface ModuleShellProps {
  /** Sub-navigation groups rendered as the header pill row. Ignored when `navSlot` is set. */
  navGroups?: NavTabGroup[];
  /**
   * Custom navigation node rendered in the header instead of the grouped pills.
   * Used by Akademik to render one unified dropdown bar across every sub-module
   * so the menu reads identically everywhere.
   */
  navSlot?: ReactNode;
  /** Current router pathname for active-tab detection. */
  pathname: string;
  /** Override the context row with a custom node (e.g. a period bar). */
  context?: ReactNode;
  /** Module name for the default ModuleContextBar (ignored when `context` set). */
  label?: string;
  /** Optional framing line for the default context bar. */
  framing?: string;
  /** Optional role badge text for the default context bar. */
  roleLabel?: string;
  /** Optional CTA slot for the default context bar. */
  cta?: ReactNode;
  /** Page content (the route <Outlet />). */
  children?: ReactNode;
}

export function ModuleShell({
  navGroups,
  navSlot,
  pathname,
  context,
  label,
  framing,
  roleLabel,
  cta,
  children,
}: ModuleShellProps) {
  // Context precedence: explicit custom node → default bar (when label given) →
  // nothing (config-only modules render header + nav with no context row).
  // Optional bar props are spread conditionally so we never pass an explicit
  // `undefined` (the repo runs tsc with exactOptionalPropertyTypes).
  let contextNode: ReactNode = context;
  if (contextNode == null && label != null) {
    const barProps: ModuleContextBarProps = {
      label,
      ...(framing != null ? { framing } : {}),
      ...(roleLabel != null ? { roleLabel } : {}),
      ...(cta != null ? { cta } : {}),
    };
    contextNode = <ModuleContextBar {...barProps} />;
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        context={contextNode}
        nav={navSlot ?? <GroupedNavTabs groups={navGroups ?? []} pathname={pathname} variant="header" />}
      />
      {children}
    </div>
  );
}
