import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface FormFieldProps {
  label: string;
  htmlFor?: string | undefined;
  required?: boolean | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function FormField({ label, htmlFor, required, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-fg">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-fg">{hint}</p>
      ) : null}
    </div>
  );
}

interface FormGridProps {
  cols?: 1 | 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}

export function FormGrid({ cols = 2, className, children }: FormGridProps) {
  const colsClass =
    cols === 1 ? "grid-cols-1"
    : cols === 2 ? "grid-cols-1 sm:grid-cols-2"
    : cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return <div className={cn("grid gap-4", colsClass, className)}>{children}</div>;
}
