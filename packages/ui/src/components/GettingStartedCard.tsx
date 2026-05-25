import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type GettingStartedAction = {
  label: string;
  href: string;
};

export type GettingStartedCardProps = {
  title: string;
  description?: string;
  primaryAction: GettingStartedAction;
  secondaryAction?: GettingStartedAction;
  icon?: ReactNode;
  steps?: string[];
  renderLink?: (
    href: string,
    children: ReactNode,
    className?: string,
  ) => ReactNode;
  className?: string;
};

const PRIMARY_BTN_CLASS =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-5 bg-brand text-white hover:bg-brand/90";

const SECONDARY_BTN_CLASS =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-5 border border-border bg-transparent text-fg hover:bg-muted";

function renderAction(
  action: GettingStartedAction,
  className: string,
  renderLink?: GettingStartedCardProps["renderLink"],
): ReactNode {
  if (renderLink) {
    return renderLink(action.href, action.label, className);
  }
  return (
    <a href={action.href} className={className}>
      {action.label}
    </a>
  );
}

export function GettingStartedCard({
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  steps,
  renderLink,
  className,
}: GettingStartedCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed border-border bg-card/50 p-8 text-center",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand/5 text-brand">
            <span className="h-6 w-6">{icon}</span>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-fg">{title}</h3>
          {description ? (
            <p className="mx-auto max-w-md text-sm text-muted-fg">
              {description}
            </p>
          ) : null}
        </div>

        {steps && steps.length > 0 ? (
          <ol className="mx-auto max-w-sm list-decimal space-y-1 pl-5 text-left text-xs text-muted-fg">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {renderAction(primaryAction, PRIMARY_BTN_CLASS, renderLink)}
          {secondaryAction
            ? renderAction(secondaryAction, SECONDARY_BTN_CLASS, renderLink)
            : null}
        </div>
      </div>
    </div>
  );
}
