import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, StatCard, IconWallet, IconCheck, IconAlert, IconUsers } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

function LaporanKoperasiPage() {
  const rekening = useResourceList<{ name: string; saldo: number; status: string }>(
    "Rekening Simpanan", { fields: ["name", "saldo", "status"], limit_page_length: 0 },
  );
  const pembiayaan = useResourceList<{ name: string; jumlah_pokok: number; status: string }>(
    "Akad Pembiayaan", { fields: ["name", "jumlah_pokok", "status"], limit_page_length: 0 },
  );
  const anggota = useResourceList("Anggota Koperasi", { fields: ["name", "status"], limit_page_length: 0 });

  const totalSimpanan = (rekening.data ?? []).reduce((s, r) => s + (r.saldo ?? 0), 0);
  const pembiayaanBerjalan = (pembiayaan.data ?? []).filter((p) => p.status === "Berjalan");
  const totalPembiayaan = pembiayaanBerjalan.reduce((s, p) => s + (p.jumlah_pokok ?? 0), 0);
  const macet = (pembiayaan.data ?? []).filter((p) => p.status === "Macet").length;
  const anggotaAktif = (anggota.data ?? []).filter((a: any) => a.status === "Aktif").length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Koperasi" title="Laporan" description="Ringkasan simpanan, pembiayaan, & anggota." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Simpanan" value={`Rp ${totalSimpanan.toLocaleString("id-ID")}`} icon={<IconWallet />} accent="emerald" />
        <StatCard label="Pembiayaan Berjalan" value={`Rp ${totalPembiayaan.toLocaleString("id-ID")}`} hint={`${pembiayaanBerjalan.length} akad`} icon={<IconCheck />} accent="brand" />
        <StatCard label="Pembiayaan Macet" value={macet.toLocaleString("id-ID")} icon={<IconAlert />} accent="rose" />
        <StatCard label="Anggota Aktif" value={anggotaAktif.toLocaleString("id-ID")} icon={<IconUsers />} accent="violet" />
      </div>
      <SectionCard title="Laporan rinci">
        <p className="text-sm text-muted-fg">Neraca syariah (PSAK 101-110), laporan SHU, mutasi kas teller, &amp; rekonsiliasi akan tersedia pada Phase 3.</p>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/koperasi/laporan")({ component: LaporanKoperasiPage });
