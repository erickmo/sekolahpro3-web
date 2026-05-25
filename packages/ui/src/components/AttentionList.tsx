import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";

export type AttentionTone = "danger" | "warning" | "info" | "neutral";

export type AttentionItem = {
  id: string;
  label: string;
  description?: string;
  tone?: AttentionTone;
  badge?: string;
  href?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  meta?: ReactNode;
};

export type AttentionListProps = {
  items: AttentionItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  renderLink?: (href: string, children: ReactNode, className?: string) => ReactNode;
  maxItems?: number;
  className?: string;
};

const DEFAULT_EMPTY_TITLE = "Tidak ada yang perlu ditindak lanjuti";
const DEFAULT_EMPTY_DESCRIPTION = "Semua item dalam kondisi baik untuk saat ini.";

const dotClass: Record<AttentionTone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-brand",
  neutral: "bg-muted-fg",
};

const badgeToneMap: Record<AttentionTone, "danger" | "warning" | "brand" | "neutral"> = {
  danger: "danger",
  warning: "warning",
  info: "brand",
  neutral: "neutral",
};

const ACTION_BTN_CLASS =
  "inline-flex h-8 px-3 items-center rounded-md text-xs font-medium border border-border bg-card hover:bg-muted transition-colors";

function ItemBody({ item }: { item: AttentionItem }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium text-fg truncate">{item.label}</div>
      {item.description ? (
        <div className="text-xs text-muted-fg mt-0.5 truncate">{item.description}</div>
      ) : null}
    </div>
  );
}

function ItemAction({
  item,
  renderLink,
}: {
  item: AttentionItem;
  renderLink?: AttentionListProps["renderLink"];
}) {
  const { actionLabel, actionHref, onAction, label } = item;
  if (!actionLabel) return null;
  const ariaLabel = `${actionLabel} — ${label}`;

  if (onAction) {
    return (
      <button
        type="button"
        onClick={onAction}
        aria-label={ariaLabel}
        className={ACTION_BTN_CLASS}
      >
        {actionLabel}
      </button>
    );
  }

  if (actionHref && renderLink) {
    return (
      <>
        {renderLink(
          actionHref,
          <span aria-label={ariaLabel} className={ACTION_BTN_CLASS}>
            {actionLabel}
          </span>,
        )}
      </>
    );
  }

  if (actionHref) {
    return (
      <a href={actionHref} aria-label={ariaLabel} className={ACTION_BTN_CLASS}>
        {actionLabel}
      </a>
    );
  }

  return null;
}

export function AttentionList({
  items,
  emptyTitle = DEFAULT_EMPTY_TITLE,
  emptyDescription = DEFAULT_EMPTY_DESCRIPTION,
  renderLink,
  maxItems,
  className,
}: AttentionListProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const visible = typeof maxItems === "number" ? items.slice(0, maxItems) : items;
  const remaining = items.length - visible.length;

  return (
    <div className={className}>
      <ul role="list" className="divide-y divide-border">
        {visible.map((item) => {
          const tone: AttentionTone = item.tone ?? "warning";
          const bodyClass = "flex min-w-0 flex-1 items-center gap-3";
          const body = <ItemBody item={item} />;
          const bodyContent = item.href && renderLink ? (
            renderLink(item.href, body, "min-w-0 flex-1 hover:underline")
          ) : item.href ? (
            <a href={item.href} className="min-w-0 flex-1 hover:underline">
              {body}
            </a>
          ) : (
            body
          );

          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 px-1 py-3 rounded-md transition-colors hover:bg-muted/40",
              )}
            >
              <span
                aria-hidden="true"
                className={cn("h-2 w-2 rounded-full shrink-0", dotClass[tone])}
              />
              {item.badge ? (
                <Badge tone={badgeToneMap[tone]} className="shrink-0">
                  {item.badge}
                </Badge>
              ) : null}
              <div className={bodyClass}>{bodyContent}</div>
              {item.meta ? (
                <div className="shrink-0 text-xs text-muted-fg">{item.meta}</div>
              ) : null}
              <ItemAction item={item} renderLink={renderLink} />
            </li>
          );
        })}
      </ul>
      {remaining > 0 ? (
        <div className="px-1 pt-2 text-xs text-muted-fg">+{remaining} lainnya</div>
      ) : null}
    </div>
  );
}
