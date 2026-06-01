import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, StatCard, IconBook, IconWallet, IconAlert, IconCheck } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { PerpPageGuide } from "../components/perpustakaan/PerpPageGuide";

function LaporanPage() {
  const peminjaman = useResourceList("Peminjaman Buku", { fields: ["name", "status"], limit_page_length: 0 });
  const denda = useResourceList<{ name: string; total_denda: number; status_bayar: string }>(
    "Denda Perpustakaan", { fields: ["name", "total_denda", "status_bayar"], limit_page_length: 0 },
  );
  const anggota = useResourceList("Anggota Perpustakaan", { fields: ["name", "status"], limit_page_length: 0 });

  const aktif = (peminjaman.data ?? []).filter((p: { status?: string }) => p.status === "Aktif" || p.status === "Terlambat").length;
  const terlambat = (peminjaman.data ?? []).filter((p: { status?: string }) => p.status === "Terlambat").length;
  const outstanding = (denda.data ?? []).filter((d) => d.status_bayar === "Belum Lunas").reduce((s, d) => s + (d.total_denda ?? 0), 0);
  const anggotaAktif = (anggota.data ?? []).filter((a: { status?: string }) => a.status === "Aktif").length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Perpustakaan" title="Laporan" description="Ringkasan sirkulasi & denda." />
      <PerpPageGuide id="laporan" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peminjaman Aktif" value={aktif.toLocaleString("id-ID")} icon={<IconBook />} accent="brand" />
        <StatCard label="Terlambat" value={terlambat.toLocaleString("id-ID")} icon={<IconAlert />} accent="rose" />
        <StatCard label="Denda Outstanding" value={`Rp ${outstanding.toLocaleString("id-ID")}`} icon={<IconWallet />} accent="violet" />
        <StatCard label="Anggota Aktif" value={anggotaAktif.toLocaleString("id-ID")} icon={<IconCheck />} accent="emerald" />
      </div>
      <SectionCard title="Detail laporan">
        <p className="text-sm text-muted-fg">Laporan rinci (top peminjam, buku terpopuler, literasi per kelas) akan tersedia pada Phase 3.</p>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/laporan")({ component: LaporanPage });
