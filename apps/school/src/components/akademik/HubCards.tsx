// Presentational cards for the Akademik TA hub (sch.$sekolah.akademik.index).
// Extracted from the route file so it stays under the 300-line budget; these are
// pure view components — no data fetching, the route owns all queries + nav.
import {
  Badge,
  Button,
  IconCheck,
  IconClock,
  cn,
} from "@sekolahpro/ui";
import { Link } from "@tanstack/react-router";
import { taPath } from "../../lib/akademikNav";

export type HubTaRow = {
  name: string;
  nama?: string;
  is_current?: 0 | 1;
  status?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
};

/** Build a workspace-subpath href for a TA + validated `go` target. `go` is the
 * DECODED subpath from parseGoParam; per-segment encode keeps "/" literal but
 * makes ids with %/space URL-safe. */
export function workspaceGoHref(sekolah: string, taName: string, go: string): string {
  return `/sch/${encodeURIComponent(sekolah)}/akademik/${taPath(taName)}/${go.split("/").map(encodeURIComponent).join("/")}`;
}

/** Status descriptor for a TA card badge (label + tone + icon). */
function taStatus(ta: HubTaRow): { label: string; tone: "success" | "warning" | "neutral"; current: boolean } {
  if (ta.is_current) return { label: "Berjalan", tone: "success", current: true };
  if (ta.status && ta.status !== "Aktif") return { label: ta.status, tone: "warning", current: false };
  return { label: "Aktif", tone: "neutral", current: false };
}

/** A single TA card with an "Buka" action into its workspace.
 *
 * When `go` is set (a legacy-stub forward target), opening the TA must land on
 * its module subpath, which a typed `<Link to params>` cannot template — so we
 * use the router's `navigate({ href })` escape hatch. Without `go` we keep the
 * original typed Link byte-for-byte. */
export function TaCard({
  sekolah,
  ta,
  primary,
  go,
  navigate,
}: {
  sekolah: string;
  ta: HubTaRow;
  primary?: boolean;
  go: string | null;
  navigate: (opts: { href: string; replace?: boolean }) => void;
}) {
  const status = taStatus(ta);
  const Icon = status.current ? IconCheck : IconClock;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-4",
        primary ? "border-brand bg-brand/5 shadow-sm" : "border-border bg-bg",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-fg">{ta.nama ?? ta.name}</span>
          <Badge tone={status.tone} className="gap-1">
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            {status.label}
          </Badge>
        </div>
        {ta.tanggal_mulai ? (
          <p className="mt-0.5 text-xs text-muted-fg tabular-nums">
            {ta.tanggal_mulai} – {ta.tanggal_selesai ?? "…"}
          </p>
        ) : null}
      </div>
      {go ? (
        <Button
          variant={primary ? "default" : "outline"}
          className="shrink-0"
          onClick={() => navigate({ href: workspaceGoHref(sekolah, ta.name, go) })}
        >
          Buka
        </Button>
      ) : (
        <Link to="/sch/$sekolah/akademik/$ta" params={{ sekolah, ta: taPath(ta.name) }} className="shrink-0">
          <Button variant={primary ? "default" : "outline"}>Buka</Button>
        </Link>
      )}
    </div>
  );
}

/** Next-year admission pointer. Always renders so beginners find "tahun depan"
 * (debate critic must-fix #5); when a TA starts after today and has tagged PPDB
 * rows it also surfaces the live applicant count. The badge is shown ONLY when
 * count > 0 — never "0 pendaftar", which reads as a broken filter. */
export function PpdbHubCard({ sekolah, nextTa, count }: { sekolah: string; nextTa: HubTaRow | null; count: number }) {
  const title = nextTa ? `PPDB ${nextTa.nama ?? nextTa.name}` : "Pendaftaran Murid Baru";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-fg">{title}</span>
          {count > 0 ? <Badge tone="neutral">{count} pendaftar</Badge> : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-fg">Gelombang &amp; calon siswa untuk tahun ajaran depan.</p>
      </div>
      <Link to="/sch/$sekolah/akademik/ppdb" params={{ sekolah }} className="shrink-0">
        <Button variant="outline">Buka PPDB →</Button>
      </Link>
    </div>
  );
}
