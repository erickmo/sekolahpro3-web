import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconAlert, IconBell } from "../icons";

export type SetupBannerTone = "warning" | "danger" | "info";

export type SetupBannerProps = {
  tone?: SetupBannerTone;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  renderLink?: (href: string, children: ReactNode) => ReactNode;
  onDismiss?: () => void;
  className?: string;
};

const toneStyles: Record<SetupBannerTone, string> = {
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-brand/30 bg-brand/10 text-brand",
};

export function SetupBanner({
  tone = "warning",
  title,
  description,
  actionLabel,
  actionHref,
  renderLink,
  onDismiss,
  className,
}: SetupBannerProps) {
  const Icon = tone === "info" ? IconBell : IconAlert;

  const actionNode =
    actionLabel && actionHref ? (
      <span className="text-sm font-medium underline-offset-2 hover:underline">
        {actionLabel}
      </span>
    ) : null;

  return (
    <div
      role="status"
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-4 py-3",
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description ? (
          <p className="text-sm text-muted-fg">{description}</p>
        ) : null}
      </div>
      {actionNode ? (
        <div className="shrink-0">
          {renderLink && actionHref
            ? renderLink(actionHref, actionNode)
            : <a href={actionHref}>{actionNode}</a>}
        </div>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Sembunyikan banner"
          className="shrink-0 rounded-md p-1 text-muted-fg hover:bg-muted hover:text-fg"
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
  );
}
