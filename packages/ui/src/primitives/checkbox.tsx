import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, label, hint, id, ...rest }, ref) {
    const autoId = id ?? `cb-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <label htmlFor={autoId} className="inline-flex items-start gap-2 cursor-pointer select-none">
        <input
          ref={ref}
          id={autoId}
          type="checkbox"
          className={cn(
            "h-4 w-4 mt-0.5 rounded border-border text-brand focus:ring-brand focus:ring-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          )}
          {...rest}
        />
        {(label || hint) && (
          <span className="text-sm">
            {label && <span className="text-fg block leading-tight">{label}</span>}
            {hint && <span className="text-xs text-muted-fg block mt-0.5">{hint}</span>}
          </span>
        )}
      </label>
    );
  },
);
