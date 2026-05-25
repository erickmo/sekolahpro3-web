import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconCheck } from "../icons";

export type OnboardingStep = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  done: boolean;
};

export type OnboardingChecklistProps = {
  title?: string;
  steps: OnboardingStep[];
  onDismiss?: () => void;
  renderLink?: (href: string, children: ReactNode) => ReactNode;
  className?: string;
};

export function OnboardingChecklist({
  title = "Mulai gunakan SekolahPro",
  steps,
  onDismiss,
  renderLink,
  className,
}: OnboardingChecklistProps) {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  if (total > 0 && percent === 100) return null;

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card p-5 space-y-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-fg">
            {title}{" "}
            <span className="text-muted-fg font-normal">
              ({doneCount}/{total} selesai)
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl font-semibold text-fg tabular-nums">
            {percent}%
          </span>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Sembunyikan checklist onboarding"
              className="rounded-md p-1 text-muted-fg hover:bg-muted hover:text-fg"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul role="list" className="divide-y divide-border -mx-2">
        {steps.map((step, idx) => {
          const row = (
            <div
              className={cn(
                "flex items-start gap-3 px-2 py-3 rounded-md",
                !step.done && step.href && "hover:bg-muted/40 cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  step.done
                    ? "bg-success text-white"
                    : "border border-border bg-bg text-muted-fg",
                )}
              >
                {step.done ? <IconCheck className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm",
                    step.done
                      ? "text-muted-fg line-through"
                      : "text-fg font-medium",
                  )}
                >
                  {step.label}
                </p>
                {step.description ? (
                  <p className="mt-0.5 text-xs text-muted-fg">{step.description}</p>
                ) : null}
              </div>
            </div>
          );
          return (
            <li key={step.id} role="listitem">
              {!step.done && step.href
                ? renderLink
                  ? renderLink(step.href, row)
                  : <a href={step.href} className="block">{row}</a>
                : row}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
