import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, Badge, Button } from "@sekolahpro/ui";
import { RequireAuth } from "@sekolahpro/auth";
import { useActiveChild } from "../lib/activeChild";
import { useTagihanList, useTagihanDetail } from "../data/tagihan";
import type { TagihanItem } from "../data/types";

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type Tone = "success" | "warning" | "danger" | "neutral";

const STATUS_TONE: Record<TagihanItem["status"], Tone> = {
  lunas: "success",
  belum_lunas: "warning",
  terlambat: "danger",
};

const STATUS_LABEL: Record<TagihanItem["status"], string> = {
  lunas: "Lunas",
  belum_lunas: "Belum lunas",
  terlambat: "Terlambat",
};

function PembayaranPage() {
  const { children } = useActiveChild();
  const [filterNis, setFilterNis] = useState<string | undefined>(undefined);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useTagihanList(filterNis);
  const { data: detail } = useTagihanDetail(openId);
  const items = data ?? [];
  const nameByNis = new Map(children.map((c) => [c.nis, c.nama]));

  return (
    <div className="space-y-6">
      <PageHeader title="Pembayaran" />
      <SectionCard
        title="Tagihan"
        action={
          <select
            className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm text-fg"
            value={filterNis ?? ""}
            onChange={(e) => setFilterNis(e.target.value || undefined)}
          >
            <option value="">Semua</option>
            {children.map((c) => (
              <option key={c.nis} value={c.nis}>
                {c.nama}
              </option>
            ))}
          </select>
        }
        padded={false}
      >
        {isLoading ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Belum ada tagihan.</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg">{t.judul}</div>
                  <div className="text-xs text-muted-fg">
                    {nameByNis.get(t.nis) ?? t.nis} · jatuh tempo {t.jatuhTempo}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-fg">
                    {RUPIAH.format(t.jumlah)}
                  </span>
                  <Badge tone={STATUS_TONE[t.status]} dot>
                    {STATUS_LABEL[t.status]}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setOpenId(t.id)}>
                    Detail
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {openId && detail ? (
        <SectionCard
          title={`Detail · ${detail.judul}`}
          action={
            <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>
              Tutup
            </Button>
          }
        >
          <div className="space-y-4">
            <ul className="divide-y divide-border rounded-md border border-border">
              {detail.rincian.map((r, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-fg">{r.label}</span>
                  <span className="font-medium tabular-nums text-fg">{RUPIAH.format(r.jumlah)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between px-4 py-2.5 text-sm bg-muted/40">
                <span className="font-semibold text-fg">Total</span>
                <span className="font-semibold tabular-nums text-fg">{RUPIAH.format(detail.jumlah)}</span>
              </li>
            </ul>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-fg mb-2">
                Metode pembayaran
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.metodePembayaran.map((m) => (
                  <Badge key={m} tone="neutral">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
            {detail.catatan ? (
              <p className="text-sm text-muted-fg">{detail.catatan}</p>
            ) : null}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/pembayaran")({
  component: () => (
    <RequireAuth>
      <PembayaranPage />
    </RequireAuth>
  ),
});
