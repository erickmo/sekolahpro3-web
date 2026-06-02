import { TEMPLATE_KEYS, type TemplateKey } from "../constants";

const LABELS: Record<TemplateKey, string> = {
  klasik: "Klasik",
  modern: "Modern",
  ceria: "Ceria",
  aurora: "Aurora",
};

/** Floating template picker shown only in demo mode (see isDemoMode). Lets a
 * presenter flip between templates live; not part of the visitor-facing site. */
export function DemoSwitcher({
  current,
  onPick,
}: {
  current: TemplateKey;
  onPick: (key: TemplateKey) => void;
}) {
  return (
    <div
      aria-label="Demo template switcher"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur"
    >
      <span className="px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Demo · Template
      </span>
      <div className="flex gap-1.5">
        {TEMPLATE_KEYS.map((key) => {
          const active = key === current;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
