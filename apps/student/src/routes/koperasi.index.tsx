import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";
import { useResourceList } from "@sekolahpro/api-client";
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  IconWallet,
  IconCheck,
} from "@sekolahpro/ui";
import { useAnggotaProfile } from "../lib/koperasiProfile";

type RekeningRow = { name: string; nomor_rekening?: string; saldo?: number; status?: string };
type AkadRow = { name: string; nomor?: string; status?: string; jumlah_pokok?: number; saldo_pokok?: number };

function formatRupiah(n: number | undefined): string {
  if (n === undefined || n === null) return "Rp 0";
  return `Rp ${Number(n).toLocaleString("id-ID")}`;
}

function KoperasiIndex() {
  const session = useSession();
  const profile = useAnggotaProfile(session.user ?? null);

  const rekeningQ = useResourceList<RekeningRow>(
    "Rekening Simpanan",
    {
      fields: ["name", "nomor_rekening", "saldo", "status"],
      filters: profile && !profile.loading ? [["nasabah", "=", profile.nasabah]] : [],
      limit_page_length: 0,
    },
    { enabled: !!profile && !profile.loading },
  );

  const akadQ = useResourceList<AkadRow>(
    "Akad Pembiayaan",
    {
      fields: ["name", "nomor", "status", "jumlah_pokok", "saldo_pokok"],
      filters: profile && !profile.loading ? [["nasabah", "=", profile.nasabah]] : [],
      limit_page_length: 0,
    },
    { enabled: !!profile && !profile.loading },
  );

  if (profile === null) {
    return (
      <Alert tone="info" title="Belum terdaftar sebagai anggota koperasi">
        Hubungi pengurus sekolah jika Anda ingin mendaftar sebagai anggota.
      </Alert>
    );
  }
  if (profile.loading) {
    return <p className="py-12 text-center text-sm text-muted-fg">Memuat profil anggota…</p>;
  }

  const rekenings = rekeningQ.data ?? [];
  const totalSaldo = rekenings.reduce((s, r) => s + (r.saldo ?? 0), 0);
  const akads = akadQ.data ?? [];
  const akadAktif = akads.filter((a) => a.status === "Berjalan");
  const totalPokok = akadAktif.reduce((s, a) => s + (a.saldo_pokok ?? a.jumlah_pokok ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Koperasi"
        title="Portal Anggota"
        description={`No. Anggota ${profile.nomor_anggota ?? profile.anggotaName} · ${profile.jenis_anggota ?? "—"}`}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Total Simpanan"
          value={formatRupiah(totalSaldo)}
          hint={`${rekenings.length} rekening`}
          icon={<IconWallet />}
          accent="emerald"
        />
        <StatCard
          label="Sisa Pembiayaan"
          value={formatRupiah(totalPokok)}
          hint={`${akadAktif.length} akad berjalan`}
          icon={<IconCheck />}
          accent="brand"
        />
      </div>

      <SectionCard title="Rekening Simpanan">
        {rekenings.length === 0 ? (
          <EmptyState title="Belum ada rekening" description="Daftar rekening akan muncul di sini." />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rekenings.map((r) => (
              <li key={r.name} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-mono text-xs">{r.nomor_rekening ?? r.name}</div>
                  <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge>
                </div>
                <div className="tabular-nums font-semibold">{formatRupiah(r.saldo)}</div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/koperasi/")({ component: KoperasiIndex });
