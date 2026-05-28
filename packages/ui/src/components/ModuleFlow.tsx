import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { SectionCard } from "./SectionCard";

export type ModuleFlowStep = {
  key: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
};

interface Props {
  title?: ReactNode;
  description?: string;
  steps: ModuleFlowStep[];
  renderLink?: (href: string, children: ReactNode) => ReactNode;
  className?: string;
}

function StepBody({ step, idx }: { step: ModuleFlowStep; idx: number }) {
  return (
    <div className="flex h-full w-full items-start gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-brand">
        {idx + 1}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
          {step.icon ? <span className="h-4 w-4 text-brand">{step.icon}</span> : null}
          <span className="truncate">{step.label}</span>
        </div>
        {step.hint ? (
          <div className="mt-0.5 text-[11px] leading-tight text-muted-fg">{step.hint}</div>
        ) : null}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <span
      aria-hidden
      className="hidden lg:flex shrink-0 items-center text-muted-fg/60"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}

export function ModuleFlow({
  title = "Alur Penggunaan",
  description = "Ikuti langkah-langkah berikut untuk mengoperasikan modul ini.",
  steps,
  renderLink,
  className,
}: Props) {
  return (
    <SectionCard title={title} description={description} className={className}>
      <ol className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch lg:gap-1.5">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const interactive = !!(step.href || step.onClick);
          const inner = (
            <div
              className={cn(
                "group h-full rounded-lg border border-border bg-card p-3 transition-colors",
                interactive ? "hover:border-brand hover:bg-muted/30 cursor-pointer" : "",
              )}
            >
              <StepBody step={step} idx={idx} />
            </div>
          );
          const node = step.href && renderLink
            ? renderLink(step.href, inner)
            : step.href
              ? <a href={step.href}>{inner}</a>
              : step.onClick
                ? <button type="button" onClick={step.onClick} className="text-left w-full">{inner}</button>
                : inner;
          return (
            <li key={step.key} className="flex flex-1 items-center gap-1.5">
              <div className="flex-1">{node}</div>
              {!isLast ? <Arrow /> : null}
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
