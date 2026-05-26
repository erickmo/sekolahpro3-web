import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";

export interface SearchableOption {
  value: string;
  label: string;
  hint?: string;
}

export interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string, option?: SearchableOption) => void;
  /** Static option list. Ignored when `loadOptions` is provided. */
  options?: SearchableOption[];
  /** Async loader. Called on open + on query change (debounced). */
  loadOptions?: (query: string) => Promise<SearchableOption[]>;
  placeholder?: string;
  disabled?: boolean;
  /** Optional label-only resolver for the *initial* value when async + label unknown. */
  resolveLabel?: (value: string) => Promise<string | undefined>;
  className?: string;
  emptyMessage?: ReactNode;
  /** Minimum chars before async search fires. Default 0 (load on open). */
  minQueryChars?: number;
}

function filterStatic(options: SearchableOption[], q: string): SearchableOption[] {
  if (!q) return options;
  const needle = q.toLowerCase();
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(needle) ||
      o.value.toLowerCase().includes(needle) ||
      (o.hint ?? "").toLowerCase().includes(needle),
  );
}

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    id,
    value,
    onChange,
    options,
    loadOptions,
    placeholder = "Cari…",
    disabled,
    resolveLabel,
    className,
    emptyMessage = "Tidak ada hasil.",
    minQueryChars = 0,
  } = props;

  const autoId = useId();
  const inputId = id ?? `searchsel-${autoId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchableOption[]>(options ?? []);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [label, setLabel] = useState<string>("");

  // Resolve initial label for async controlled value
  useEffect(() => {
    if (!value) {
      setLabel("");
      return;
    }
    const fromStatic = (options ?? items).find((o) => o.value === value);
    if (fromStatic) {
      setLabel(fromStatic.label);
      return;
    }
    if (resolveLabel) {
      let cancelled = false;
      resolveLabel(value).then((l) => {
        if (!cancelled && l) setLabel(l);
      });
      return () => {
        cancelled = true;
      };
    }
    // Fallback: show raw value so the user sees *something*.
    setLabel(value);
  }, [value, options, items, resolveLabel]);

  // Outside click close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Async fetch (debounced)
  useEffect(() => {
    if (!open || !loadOptions) return;
    if (query.length < minQueryChars) {
      // Trigger initial load on open
      if (query.length === 0 && minQueryChars === 0) {
        setLoading(true);
        let cancelled = false;
        loadOptions("").then((r) => {
          if (!cancelled) {
            setItems(r);
            setLoading(false);
          }
        }).catch(() => {
          if (!cancelled) setLoading(false);
        });
        return () => {
          cancelled = true;
        };
      }
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      let cancelled = false;
      loadOptions(query)
        .then((r) => {
          if (!cancelled) {
            setItems(r);
            setLoading(false);
            setHighlight(0);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, 200);
    return () => clearTimeout(t);
  }, [open, query, loadOptions, minQueryChars]);

  const visible = useMemo(() => {
    if (loadOptions) return items;
    return filterStatic(options ?? [], query);
  }, [loadOptions, items, options, query]);

  const select = useCallback(
    (opt: SearchableOption) => {
      onChange(opt.value, opt);
      setLabel(opt.label);
      setQuery("");
      setOpen(false);
    },
    [onChange],
  );

  const clear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setLabel("");
      setQuery("");
      inputRef.current?.focus();
    },
    [onChange],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(visible.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = visible[highlight];
      if (opt) select(opt);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 h-10 w-full rounded-md border border-border bg-bg px-2 text-sm",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-brand",
          disabled && "opacity-60 pointer-events-none",
        )}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={open ? query : label}
          placeholder={value ? label || placeholder : placeholder}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKey}
          className="flex-1 bg-transparent outline-none px-1 placeholder:text-muted-fg"
          aria-expanded={open}
          aria-controls={`${inputId}-listbox`}
          role="combobox"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="Kosongkan"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-fg hover:bg-muted hover:text-fg"
          >
            ×
          </button>
        )}
        <span className="text-muted-fg select-none" aria-hidden>
          ▾
        </span>
      </div>

      {open && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-bg shadow-lg"
        >
          {loading ? (
            <div className="px-3 py-2 text-xs text-muted-fg">Memuat…</div>
          ) : visible.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-fg">{emptyMessage}</div>
          ) : (
            <ul className="py-1">
              {visible.map((opt, i) => {
                const active = i === highlight;
                const selected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(opt);
                    }}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm flex items-center justify-between gap-3",
                      active && "bg-muted",
                      selected && "text-brand font-medium",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{opt.label}</div>
                      {opt.hint && (
                        <div className="text-xs text-muted-fg truncate">{opt.hint}</div>
                      )}
                    </div>
                    {selected && <span className="text-xs">✓</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
