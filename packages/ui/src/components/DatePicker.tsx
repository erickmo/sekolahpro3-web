import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "../lib/cn";

export interface DatePickerProps {
  id?: string;
  /** ISO date string (yyyy-MM-dd) or "" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  min?: string;
  max?: string;
  /** Display format. Default: dd MMM yyyy */
  displayFormat?: string;
  /** Caption layout. "dropdown" enables month + year dropdowns for fast jumping. */
  captionLayout?: "buttons" | "dropdown" | "dropdown-buttons";
  /** Earliest selectable year (enables year dropdown range). */
  fromYear?: number;
  /** Latest selectable year (enables year dropdown range). */
  toYear?: number;
}

const ISO = "yyyy-MM-dd";

function toDate(v: string): Date | undefined {
  if (!v) return undefined;
  const d = parse(v, ISO, new Date());
  return isValid(d) ? d : undefined;
}

function toIso(d: Date | undefined): string {
  return d ? format(d, ISO) : "";
}

export function DatePicker(props: DatePickerProps) {
  const {
    id,
    value,
    onChange,
    placeholder = "Pilih tanggal",
    disabled,
    required,
    name,
    className,
    min,
    max,
    displayFormat = "dd MMM yyyy",
    captionLayout,
    fromYear,
    toYear,
  } = props;

  const autoId = useId();
  const inputId = id ?? `dp-${autoId}`;
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const selected = useMemo(() => toDate(value), [value]);
  const display = selected ? format(selected, displayFormat, { locale: localeId }) : "";

  const updatePos = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const minDate = useMemo(() => toDate(min ?? ""), [min]);
  const maxDate = useMemo(() => toDate(max ?? ""), [max]);

  // With dropdown caption layouts react-day-picker renders BOTH the month/year
  // <select>s AND a textual caption_label ("Mei 2024"). Showing the label too
  // duplicates the caption, so collapse it to screen-reader-only in that case.
  const usesDropdown = captionLayout === "dropdown" || captionLayout === "dropdown-buttons";
  const captionLabelClass = usesDropdown ? "sr-only" : "text-sm font-medium";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id={inputId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-bg px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !display && "text-muted-fg",
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{display || placeholder}</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0 text-muted-fg"
        >
          <path d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.5A2.25 2.25 0 0118 6.25v9.5A2.25 2.25 0 0115.75 18H4.25A2.25 2.25 0 012 15.75v-9.5A2.25 2.25 0 014.25 4H5V2.75A.75.75 0 015.75 2zM3.5 8v7.75c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75V8h-13z" />
        </svg>
      </button>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popRef}
              role="dialog"
              style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
              className="rounded-md border border-border bg-bg p-2 shadow-xl"
            >
              <DayPicker
                mode="single"
                locale={localeId}
                {...(captionLayout ? { captionLayout } : {})}
                {...(fromYear ? { fromYear } : {})}
                {...(toYear ? { toYear } : {})}
                {...(selected ? { selected, defaultMonth: selected } : {})}
                {...(minDate || maxDate
                  ? {
                      disabled: [
                        ...(minDate ? [{ before: minDate }] : []),
                        ...(maxDate ? [{ after: maxDate }] : []),
                      ],
                    }
                  : {})}
                onSelect={(d) => {
                  onChange(toIso(d));
                  setOpen(false);
                }}
                showOutsideDays
                classNames={{
                  caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
                  caption_label: captionLabelClass,
                  caption_dropdowns: "flex gap-1",
                  dropdown:
                    "appearance-none rounded border border-border bg-bg px-1.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand",
                  dropdown_month: "relative",
                  dropdown_year: "relative",
                  vhidden: "sr-only",
                  nav: "space-x-1 flex items-center",
                  nav_button:
                    "h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-fg w-9 font-normal text-xs",
                  row: "flex w-full mt-1",
                  cell: "h-9 w-9 text-center text-sm p-0 relative",
                  day: "h-9 w-9 p-0 rounded hover:bg-muted aria-selected:opacity-100 inline-flex items-center justify-center",
                  day_selected:
                    "bg-brand text-white hover:bg-brand focus:bg-brand",
                  day_today: "font-semibold text-brand",
                  day_outside: "text-muted-fg/50",
                  day_disabled: "text-muted-fg/40 cursor-not-allowed",
                  day_hidden: "invisible",
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
