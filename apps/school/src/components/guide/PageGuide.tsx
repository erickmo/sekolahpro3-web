/**
 * In-app page guide / tutorial card.
 *
 * A collapsible "Cara pakai halaman ini" panel that explains how to use a page:
 * an intro, a numbered list of steps (each optionally scoped to roles), and a
 * block of tips. Its open/collapsed state is remembered per `storageId` in
 * localStorage so users only see the full guide until they dismiss it.
 *
 * Role labels are module-agnostic: a caller may pass either a `roleLabels` map
 * (Akademik, Perpustakaan, ...) or a `roleLabel` resolver function (Keuangan).
 * Both fall back to the academic labels, then the raw key, so existing call
 * sites keep working without passing anything.
 */
import { useState, type ReactNode } from "react";
import { Badge, SectionCard, IconBook, cn } from "@sekolahpro/ui";
import { ROLE_LABEL as AKADEMIK_ROLE_LABEL } from "../../lib/akademikRole";

/** Resolve a role key to its display label. */
export type RoleLabelFn = (role: string) => string;

/** A single step in the guide. `roles` are raw role keys, resolved to labels. */
export interface PageGuideStep {
  title: ReactNode;
  detail?: ReactNode;
  /** Coarse role keys this step is most relevant to (presentation hint only). */
  roles?: string[];
}

export interface PageGuideProps {
  storageId: string;
  title?: string;
  intro?: ReactNode;
  steps?: PageGuideStep[];
  tips?: ReactNode[];
  defaultOpen?: boolean;
  className?: string;
  /** Maps a role key to its label (map form). Falls back to akademik, then raw. */
  roleLabels?: Record<string, string>;
  /** Maps a role key to its label (function form). Takes precedence over roleLabels. */
  roleLabel?: RoleLabelFn;
  /** localStorage namespace prefix; lets modules avoid key collisions. */
  storageNamespace?: string;
}

const DEFAULT_STORAGE_PREFIX = "akademik-guide:";
const DEFAULT_TITLE = "Cara pakai halaman ini";
const DEFAULT_OPEN = true;
/** Muted hint shown next to the chevron to signal the collapse action. */
const HINT_WHEN_OPEN = "Sembunyikan";
/** Muted hint shown next to the chevron to signal the expand action. */
const HINT_WHEN_COLLAPSED = "Tampilkan";

/**
 * Resolve a role key to its display label across the fallback chain:
 * the `roleLabel` function, then the `roleLabels` map, then the academic
 * labels, then the raw key.
 */
function resolveRoleLabel(
  role: string,
  roleLabel: RoleLabelFn | undefined,
  roleLabels: Record<string, string> | undefined,
): string {
  if (roleLabel) return roleLabel(role);
  return (
    roleLabels?.[role] ??
    AKADEMIK_ROLE_LABEL[role as keyof typeof AKADEMIK_ROLE_LABEL] ??
    role
  );
}

/** Build the namespaced localStorage key for a guide instance. */
function storageKey(prefix: string, storageId: string): string {
  return prefix + storageId;
}

/**
 * Read the persisted open state for a guide, guarding SSR (no window).
 * Falls back to `fallback` when nothing is stored or storage is unavailable.
 */
function readStored(prefix: string, storageId: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(prefix, storageId));
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

/** Persist the open state for a guide, guarding SSR and storage errors. */
function writeStored(prefix: string, storageId: string, open: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(prefix, storageId), open ? "1" : "0");
  } catch {
    // Ignore storage failures (private mode, quota); state stays in memory.
  }
}

/** Chevron glyph that rotates with the open state. */
function Chevron({ open }: { open: boolean }): ReactNode {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("transition-transform", open ? "rotate-180" : "rotate-0")}
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Role badges rendered for a step that is scoped to specific roles. */
function StepRoles({ roles, resolve }: { roles: string[]; resolve: RoleLabelFn }): ReactNode {
  return (
    <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
      {roles.map((role) => (
        <Badge key={role} tone="brand">
          {resolve(role)}
        </Badge>
      ))}
    </span>
  );
}

/** The ordered list of numbered steps. */
function StepList({ steps, resolve }: { steps: PageGuideStep[]; resolve: RoleLabelFn }): ReactNode {
  return (
    <ol className="mt-3 space-y-2">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
            {index + 1}
          </span>
          <div className="min-w-0 text-sm">
            <span className="font-semibold text-fg">{step.title}</span>
            {step.roles && step.roles.length > 0 ? (
              <StepRoles roles={step.roles} resolve={resolve} />
            ) : null}
            {step.detail ? (
              <p className="mt-0.5 text-xs text-muted-fg">{step.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The bulleted tips block with a subtle accent. */
function TipsBlock({ tips }: { tips: ReactNode[] }): ReactNode {
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <ul className="space-y-1">
        {tips.map((tip, index) => (
          <li key={index} className="flex gap-2 text-xs text-amber-900">
            <span aria-hidden="true">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Collapsible guide card. Persists its open/collapsed state per `storageId`.
 * Honors `defaultOpen` only on first visit; afterwards the saved state wins.
 */
export function PageGuide({
  storageId,
  title = DEFAULT_TITLE,
  intro,
  steps,
  tips,
  defaultOpen,
  className,
  roleLabels,
  roleLabel,
  storageNamespace = DEFAULT_STORAGE_PREFIX,
}: PageGuideProps): ReactNode {
  const initialFallback = defaultOpen ?? DEFAULT_OPEN;
  const [open, setOpen] = useState<boolean>(() =>
    readStored(storageNamespace, storageId, initialFallback),
  );
  const resolve: RoleLabelFn = (role) => resolveRoleLabel(role, roleLabel, roleLabels);

  /** Toggle the panel and persist the new state. */
  function toggle(): void {
    setOpen((prev) => {
      const next = !prev;
      writeStored(storageNamespace, storageId, next);
      return next;
    });
  }

  const hasSteps = steps !== undefined && steps.length > 0;
  const hasTips = tips !== undefined && tips.length > 0;

  return (
    <SectionCard className={cn("border-brand/20", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="group flex w-full cursor-pointer items-center justify-between gap-3 text-left transition-colors hover:text-brand"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-fg transition-colors group-hover:text-brand">
          <IconBook className="h-4 w-4 shrink-0 text-brand" />
          {title}
        </span>
        {/* Always-visible affordance: muted hint label + rotating chevron. */}
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-fg transition-colors group-hover:text-brand">
          <span>{open ? HINT_WHEN_OPEN : HINT_WHEN_COLLAPSED}</span>
          <Chevron open={open} />
        </span>
      </button>

      {open ? (
        <div className="mt-3">
          {intro ? <p className="text-sm text-muted-fg">{intro}</p> : null}
          {hasSteps ? <StepList steps={steps} resolve={resolve} /> : null}
          {hasTips ? <TipsBlock tips={tips} /> : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
