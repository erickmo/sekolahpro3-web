import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";
import { useResourceList } from "@sekolahpro/api-client";
import { Alert, Badge, EmptyState, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useAnggotaProfile } from "../lib/koperasiProfile";

type RekeningRow = { name: string; nomor_rekening?: string };
type TrxRow = {
  name: string;
  rekening_simpanan: string;
  jenis: string;
  jumlah: number;
  tanggal: string;
};

const JENIS_TONE: Record<string, "success" | "warning" | "brand" | "neutral"> = {
  Setor: "success",
  Tarik: "warning",
  Transfer: "brand",
  "Bagi Hasil": "success",
  Koreksi: "neutral",
};

function MutasiPage() {
  const session = useSession();
  const profile = useAnggotaProfile(session.user ?? null);

  const rekeningQ = useResourceList<RekeningRow>(
    "Rekening Simpanan",
    {
      fields: ["name", "nomor_rekening"],
      filters: profile && !profile.loading ? [["nasabah", "=", profile.nasabah]] : [],
      limit_page_length: 0,
    },
    { enabled: !!profile && !profile.loading },
  );

  const rekeningNames = (rekeningQ.data ?? []).map((r) => r.name);

  const trxQ = useResourceList<TrxRow>(
    "Transaksi Simpanan",
    {
      fields: ["name", "rekening_simpanan", "jenis", "jumlah", "tanggal"],
      filters: rekeningNames.length > 0 ? [["rekening_simpanan", "in", rekeningNames as unknown as string]] : [],
      limit_page_length: 50,
      order_by: "tanggal desc",
    },
    { enabled: rekeningNames.length > 0 },
  );

  if (profile === null) {
    return (
      <Alert tone="info" title="Belum terdaftar sebagai anggota koperasi">
        Daftar terlebih dahulu untuk melihat mutasi.
      </Alert>
    );
  }

  const trxs = trxQ.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Koperasi"
        title="Mutasi Transaksi"
        description="50 transaksi terbaru pada rekening simpanan Anda."
      />
      <SectionCard title="Riwayat">
        {trxQ.isLoading ? (
          <p className="text-sm text-muted-fg">Memuat…</p>
        ) : trxs.length === 0 ? (
          <EmptyState title="Belum ada transaksi" description="Setoran/penarikan akan muncul di sini." />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {trxs.map((t) => (
              <li key={t.name} className="flex items-center justify-between py-2">
                <div>
                  <Badge tone={JENIS_TONE[t.jenis] ?? "neutral"} dot>{t.jenis}</Badge>
                  <div className="mt-1 text-xs text-muted-fg">
                    {t.tanggal} · <span className="font-mono">{t.rekening_simpanan}</span>
                  </div>
                </div>
                <div
                  className={`tabular-nums font-semibold ${
                    t.jenis === "Tarik" ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {t.jenis === "Tarik" ? "−" : "+"} Rp {t.jumlah.toLocaleString("id-ID")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/koperasi/mutasi")({ component: MutasiPage });
