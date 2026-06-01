/**
 * Small presentational UI primitives shared across the "Buat PPDB" wizard
 * steps: StepNav, ModeBtn, ChoiceCard, Summary, Field, ActionCard. Extracted
 * from buatPanel.tsx with no behavior change.
 */

import { Button } from "@sekolahpro/ui";

/** Navigasi antar langkah: tombol Sebelumnya (opsional) + Lanjut. */
export function StepNav({
  onBack,
  onNext,
  nextLabel = "Lanjut",
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-5 flex justify-between gap-2">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          Sebelumnya
        </Button>
      ) : (
        <span />
      )}
      <Button onClick={onNext}>{nextLabel}</Button>
    </div>
  );
}

/** Tombol pemilih mode (existing vs baru). */
export function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md border px-3 py-1.5 text-xs font-medium transition " +
        (active ? "border-brand bg-brand text-white" : "border-border bg-card hover:border-brand")
      }
    >
      {children}
    </button>
  );
}

/** Kartu pilihan radio-style untuk konfigurasi. */
export function ChoiceCard({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md border p-3 text-left transition " +
        (active
          ? "border-brand bg-brand/10 ring-1 ring-brand"
          : "border-border bg-card hover:border-brand")
      }
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-muted-fg">{hint}</div>
    </button>
  );
}

/** Baris ringkasan label → nilai pada langkah konfirmasi. */
export function Summary({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-fg">{label}</dt>
      <dd className="mt-0.5 text-sm text-fg">{children}</dd>
    </div>
  );
}

/** Field berlabel pembungkus input. */
export function Field({
  label,
  children,
  cols = 1,
}: {
  label: string;
  children: React.ReactNode;
  cols?: 1 | 2;
}) {
  return (
    <label className={"block " + (cols === 2 ? "sm:col-span-2" : "")}>
      <span className="mb-1 block text-xs font-medium text-muted-fg">{label}</span>
      {children}
    </label>
  );
}

/** Kartu aksi (tombol) generik pada panel hasil. */
export function ActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick()}
      className="block w-full rounded-lg border border-border bg-card p-3 text-left transition hover:border-brand"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-muted-fg">{description}</div>
    </button>
  );
}
