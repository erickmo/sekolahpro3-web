/**
 * In-app page guide / tutorial card.
 *
 * A collapsible "Cara pakai halaman ini" panel that explains how to use a page:
 * an intro, a numbered list of steps (each optionally scoped to roles), and a
 * block of tips. Its open/collapsed state is remembered per `storageId` in
 * localStorage so users only see the full guide until they dismiss it.
 */
import { useState, type ReactNode } from "react";
import { Badge, SectionCard, IconBook, cn } from "@sekolahpro/ui";
import { ROLE_LABEL, type AkademikRole } from "../../lib/akademikRole";

/** A single step in the guide. */
export interface PageGuideStep {
  title: ReactNode;
  detail?: ReactNode;
  roles?: AkademikRole[];
}

export interface PageGuideProps {
  storageId: string;
  title?: string;
  intro?: ReactNode;
  steps?: PageGuideStep[];
  tips?: ReactNode[];
  defaultOpen?: boolean;
  className?: string;
}

const STORAGE_PREFIX = "akademik-guide:";
const DEFAULT_TITLE = "Cara pakai halaman ini";
const DEFAULT_OPEN = true;

/** Build the namespaced localStorage key for a guide instance. */
function storageKey(storageId: string): string {
  return STORAGE_PREFIX + storageId;
}

/**
 * Read the persisted open state for a guide, guarding SSR (no window).
 * Falls back to `fallback` when nothing is stored or storage is unavailable.
 */
function readStored(storageId: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(storageId));
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

/** Persist the open state for a guide, guarding SSR and storage errors. */
function writeStored(storageId: string, open: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(storageId), open ? "1" : "0");
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
function StepRoles({ roles }: { roles: AkademikRole[] }): ReactNode {
  return (
    <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
      {roles.map((role) => (
        <Badge key={role} tone="brand">
          {ROLE_LABEL[role]}
        </Badge>
      ))}
    </span>
  );
}

/** The ordered list of numbered steps. */
function StepList({ steps }: { steps: PageGuideStep[] }): ReactNode {
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
              <StepRoles roles={step.roles} />
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
}: PageGuideProps): ReactNode {
  const initialFallback = defaultOpen ?? DEFAULT_OPEN;
  const [open, setOpen] = useState<boolean>(() =>
    readStored(storageId, initialFallback),
  );

  /** Toggle the panel and persist the new state. */
  function toggle(): void {
    setOpen((prev) => {
      const next = !prev;
      writeStored(storageId, next);
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
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-fg">
          <IconBook className="text-brand" />
          {title}
        </span>
        <span className="text-muted-fg">
          <Chevron open={open} />
        </span>
      </button>

      {open ? (
        <div className="mt-3">
          {intro ? <p className="text-sm text-muted-fg">{intro}</p> : null}
          {hasSteps ? <StepList steps={steps} /> : null}
          {hasTips ? <TipsBlock tips={tips} /> : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
