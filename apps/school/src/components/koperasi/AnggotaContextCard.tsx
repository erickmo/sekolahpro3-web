import { Badge } from "@sekolahpro/ui";

export interface AnggotaContext {
  anggotaName: string;
  nomorAnggota: string | undefined;
  nasabah: string | undefined;
  rekening: string | undefined;
  saldo: number | undefined;
  kartuUid: string | undefined;
  status: string | undefined;
}

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  Aktif: "success",
  "Non-aktif": "neutral",
  Keluar: "danger",
  Pending: "warning",
};

function formatRupiah(v: number | undefined): string {
  if (v === undefined || v === null) return "—";
  return `Rp ${Number(v).toLocaleString("id-ID")}`;
}

export function AnggotaContextCard({ ctx }: { ctx: AnggotaContext | null }) {
  if (!ctx) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-bg-subtle p-6 text-center">
        <p className="text-sm text-muted-fg">
          Scan kartu RFID atau tekan <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 text-xs">/</kbd> untuk cari anggota.
        </p>
      </div>
    );
  }

  const tone = ctx.status ? STATUS_TONE[ctx.status] ?? "neutral" : "neutral";

  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-muted-fg">Anggota Aktif</div>
          <div className="text-lg font-semibold">{ctx.nasabah ?? ctx.anggotaName}</div>
          <div className="text-xs font-mono text-muted-fg">
            {ctx.nomorAnggota ?? ctx.anggotaName}
            {ctx.kartuUid ? <> · UID {ctx.kartuUid}</> : null}
          </div>
        </div>
        {ctx.status ? <Badge tone={tone} dot>{ctx.status}</Badge> : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <div className="text-xs text-muted-fg">Rekening</div>
          <div className="font-mono text-xs">{ctx.rekening ?? "—"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-fg">Saldo</div>
          <div className="tabular-nums text-lg font-semibold">{formatRupiah(ctx.saldo)}</div>
        </div>
      </div>
    </div>
  );
}
