import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type MaskType = "nik" | "nokk" | "nisn" | "tanggal" | "generic";

interface Props {
  value: string | null | undefined;
  type?: MaskType;
  label?: ReactNode;
  /** True if current user role can reveal. False = eye disabled. */
  canReveal: boolean;
  /** Why reveal is blocked, shown as tooltip. */
  blockReason?: string;
  /** Called when user clicks reveal. Should write to audit (PII access log). */
  onReveal?: (reason: string) => Promise<void> | void;
  /** Auto-mask back after N seconds. Default 30. */
  autoMaskSeconds?: number;
  className?: string;
}

const REASON_OPTIONS = [
  "Verifikasi Dapodik",
  "Cetak Ijazah",
  "Permintaan Wali",
  "Audit Internal",
  "Lainnya",
];
const DEFAULT_AUTOMASK = 30;

function maskValue(raw: string, type: MaskType): string {
  if (!raw) return "—";
  if (type === "tanggal") {
    // YYYY-MM-DD → ••/••/YYYY
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `••/••/${m[1]}`;
    return "••/••/••••";
  }
  if (type === "nik" || type === "nokk") {
    // 16-digit → first 4 + bullets + last 4
    if (raw.length < 8) return "•".repeat(raw.length);
    return raw.slice(0, 4) + "•".repeat(Math.max(0, raw.length - 8)) + raw.slice(-4);
  }
  if (type === "nisn") {
    // 10-digit → bullets + last 4
    if (raw.length < 8) return "•".repeat(raw.length);
    return "•".repeat(raw.length - 4) + raw.slice(-4);
  }
  // generic: bullets except last 4
  if (raw.length <= 4) return "•".repeat(raw.length);
  return "•".repeat(raw.length - 4) + raw.slice(-4);
}

export function MaskedField({
  value,
  type = "generic",
  label,
  canReveal,
  blockReason = "Anda tidak memiliki akses ke field PII ini.",
  onReveal,
  autoMaskSeconds = DEFAULT_AUTOMASK,
  className,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!revealed) return;
    setRemaining(autoMaskSeconds);
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRevealed(false);
          clearInterval(tick);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [revealed, autoMaskSeconds]);

  const handleReveal = useCallback(
    async (reason: string) => {
      setPickerOpen(false);
      if (onReveal) await onReveal(reason);
      setRevealed(true);
    },
    [onReveal],
  );

  const raw = value ?? "";
  const display = revealed ? raw || "—" : maskValue(raw, type);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-fg">{label}</span>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm tabular-nums text-fg" aria-label={`${label} (masked)`}>
          {display}
        </span>
        {canReveal ? (
          <button
            type="button"
            onClick={() => {
              if (revealed) {
                setRevealed(false);
                return;
              }
              if (onReveal) setPickerOpen((v) => !v);
              else setRevealed(true);
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-fg hover:bg-muted hover:text-fg"
            aria-label={revealed ? "Sembunyikan" : "Tampilkan"}
            title={revealed ? `Auto-mask dalam ${remaining}s` : "Tampilkan (akan tercatat di audit)"}
          >
            {revealed ? "🙈" : "👁"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-fg/40"
            aria-label="Akses ditolak"
            title={blockReason}
          >
            🔒
          </button>
        )}
        {revealed && remaining > 0 ? (
          <span className="text-[10px] text-muted-fg" aria-live="polite">
            {remaining}s
          </span>
        ) : null}
      </div>
      {pickerOpen && !revealed ? (
        <div className="mt-1 rounded-md border border-border bg-bg p-2 shadow-sm">
          <div className="mb-1 text-xs text-muted-fg">Pilih alasan akses:</div>
          <div className="flex flex-wrap gap-1">
            {REASON_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => void handleReveal(r)}
                className="rounded border border-border bg-muted/40 px-2 py-1 text-xs hover:bg-muted"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
