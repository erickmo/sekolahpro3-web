import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  /** Called with the next checked value when toggled. */
  onChange?: (next: boolean) => void;
  /** Optional text shown next to the track (reflects current state). */
  label?: string;
}

/**
 * Accessible toggle switch. Renders a `role="switch"` button so the whole
 * control is one click target — ideal for inline list cells (flip a boolean
 * without opening a detail page). Visual-only knob; state is fully controlled.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch({ checked, onChange, label, disabled, className, ...rest }, ref) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            checked ? "bg-brand" : "bg-border",
            className,
          )}
          {...rest}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
        {label && <span className="text-xs text-muted-fg select-none">{label}</span>}
      </span>
    );
  },
);
