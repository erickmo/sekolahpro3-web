import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";
import { useResourceList } from "@sekolahpro/api-client";
import { Alert, Badge, EmptyState, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useAnggotaProfile } from "../lib/koperasiProfile";

type AkadRow = {
  name: string;
  nomor?: string;
  akad?: string;
  status?: string;
  jumlah_pokok?: number;
  saldo_pokok?: number;
  tanggal_mulai?: string;
  tenor_bulan?: number;
};

const STATUS_TONE: Record<string, "success" | "brand" | "danger" | "warning" | "neutral"> = {
  Berjalan: "success",
  Lunas: "brand",
  Macet: "danger",
  "Restrukturisasi": "warning",
  Diajukan: "warning",
};

function PembiayaanPage() {
  const session = useSession();
  const profile = useAnggotaProfile(session.user ?? null);

  const akadQ = useResourceList<AkadRow>(
    "Akad Pembiayaan",
    {
      fields: ["name", "nomor", "akad", "status", "jumlah_pokok", "saldo_pokok", "tanggal_mulai", "tenor_bulan"],
      filters: profile && !profile.loading ? [["nasabah", "=", profile.nasabah]] : [],
      limit_page_length: 0,
      order_by: "tanggal_mulai desc",
    },
    { enabled: !!profile && !profile.loading },
  );

  if (profile === null) {
    return (
      <Alert tone="info" title="Belum terdaftar sebagai anggota koperasi">
        Daftar terlebih dahulu untuk melihat pembiayaan.
      </Alert>
    );
  }

  const akads = akadQ.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Koperasi"
        title="Pembiayaan Saya"
        description="Akad pembiayaan aktif & riwayat."
      />
      <SectionCard title="Akad">
        {akadQ.isLoading ? (
          <p className="text-sm text-muted-fg">Memuat…</p>
        ) : akads.length === 0 ? (
          <EmptyState title="Belum ada akad" description="Pengajuan pembiayaan dapat dilakukan via pengurus." />
        ) : (
          <ul className="space-y-3">
            {akads.map((a) => (
              <li key={a.name} className="rounded-lg border border-border bg-bg p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs">{a.nomor ?? a.name}</div>
                    <div className="mt-1 text-muted-fg">
                      {a.akad ?? "—"} · {a.tanggal_mulai ?? "—"}
                      {a.tenor_bulan ? ` · ${a.tenor_bulan} bln` : ""}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[a.status ?? ""] ?? "neutral"} dot>{a.status ?? "—"}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-2">
                  <div>
                    <div className="text-xs text-muted-fg">Pokok</div>
                    <div className="tabular-nums">Rp {(a.jumlah_pokok ?? 0).toLocaleString("id-ID")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-fg">Sisa</div>
                    <div className="tabular-nums font-semibold">
                      Rp {(a.saldo_pokok ?? 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/koperasi/pembiayaan")({ component: PembiayaanPage });
