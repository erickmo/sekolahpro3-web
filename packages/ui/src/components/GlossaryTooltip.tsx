import { useId } from "react";
import { cn } from "../lib/cn";

export type GlossaryTooltipProps = {
  /** Visible text (e.g., "KKM"). */
  term: string;
  /** Tooltip content shown on hover/focus. */
  definition: string;
  className?: string;
};

/**
 * Inline glossary term with a CSS-only tooltip card.
 *
 * Render a `<span>` with a dotted underline. On hover or keyboard focus,
 * a floating card appears above with the definition. A11y: an `sr-only`
 * description is wired through `aria-describedby` so screen readers always
 * announce the definition; the wrapper is keyboard-focusable.
 */
export function GlossaryTooltip({ term, definition, className }: GlossaryTooltipProps) {
  const descId = useId();
  return (
    <span
      className={cn(
        "group relative inline-block cursor-help border-b border-dashed border-muted-fg/50 text-fg",
        className,
      )}
      tabIndex={0}
      aria-describedby={descId}
    >
      {term}
      <span id={descId} className="sr-only">
        {definition}
      </span>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2",
          "w-max max-w-xs rounded-md border border-border bg-card px-3 py-2",
          "text-xs font-normal normal-case tracking-normal text-muted-fg shadow-lg",
          "opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100",
        )}
      >
        {definition}
      </span>
    </span>
  );
}
