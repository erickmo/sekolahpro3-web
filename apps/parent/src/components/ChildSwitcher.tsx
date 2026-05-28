import { useEffect, useRef, useState } from "react";
import { useActiveChild } from "../lib/activeChild";

export function ChildSwitcher() {
  const { activeNis, setActiveNis, children, isLoading } = useActiveChild();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (isLoading) return <div className="text-xs text-muted-fg">Memuat anak…</div>;
  if (children.length === 0) {
    return <div className="text-xs text-amber-600">Belum ada siswa tertaut</div>;
  }
  const active = children.find((c) => c.nis === activeNis) ?? children[0]!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Pilih anak"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm hover:bg-muted"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
          {active.nama.charAt(0)}
        </span>
        <span className="font-medium text-fg">{active.nama}</span>
        <span className="text-[11px] text-muted-fg">· {active.kelas}</span>
      </button>
      {open ? (
        <div role="menu" className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-bg shadow-lg">
          {children.map((c) => (
            <button
              key={c.nis}
              role="menuitem"
              type="button"
              onClick={() => { setActiveNis(c.nis); setOpen(false); }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted ${c.nis === active.nis ? "bg-muted/50" : ""}`}
            >
              <span className="text-fg">{c.nama}</span>
              <span className="text-[11px] text-muted-fg">{c.kelas}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
