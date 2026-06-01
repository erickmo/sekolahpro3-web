/**
 * Laporan Perpustakaan: period recap of circulation, collection, and denda for
 * oversight. Real-time daily figures live on the Dashboard; this page is the rekap.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader, SectionCard, StatCard, IconBook, IconWallet, IconAlert, IconCheck } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { HBarChart } from "../components/viz";
import { PerpPageGuide } from "../components/perpustakaan/PerpPageGuide";
import { perpFormatRupiah } from "../components/perpustakaan/perpFormatters";
import { buildTopPeminjam, buildBukuTerpopuler } from "../components/perpustakaan/dashboardViz";

/** Loan row shape: status drives the stat cards; anggota/buku drive the rankings. */
type LoanRow = { name: string; status?: string; anggota?: string; buku?: string };

const formatPinjamCount = (v: number) => `${v.toLocaleString("id-ID")} pinjam`;

function LaporanPage() {
  const peminjaman = useResourceList<LoanRow>("Peminjaman Buku", { fields: ["name", "status", "anggota", "buku"], limit_page_length: 0 });
  const denda = useResourceList<{ name: string; total_denda: number; status_bayar: string }>(
    "Denda Perpustakaan", { fields: ["name", "total_denda", "status_bayar"], limit_page_length: 0 },
  );
  const anggota = useResourceList<{ name: string; status?: string }>("Anggota Perpustakaan", { fields: ["name", "status"], limit_page_length: 0 });

  const loans = useMemo(() => peminjaman.data ?? [], [peminjaman.data]);
  const aktif = loans.filter((p) => p.status === "Aktif" || p.status === "Terlambat").length;
  const terlambat = loans.filter((p) => p.status === "Terlambat").length;
  const outstanding = (denda.data ?? []).filter((d) => d.status_bayar === "Belum Lunas").reduce((s, d) => s + (d.total_denda ?? 0), 0);
  const anggotaAktif = (anggota.data ?? []).filter((a) => a.status === "Aktif").length;

  const topPeminjam = useMemo(() => buildTopPeminjam(loans), [loans]);
  const bukuTerpopuler = useMemo(() => buildBukuTerpopuler(loans), [loans]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Perpustakaan" title="Laporan" description="Ringkasan sirkulasi & denda." />
      <PerpPageGuide id="laporan" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peminjaman Aktif" value={aktif.toLocaleString("id-ID")} icon={<IconBook />} accent="brand" />
        <StatCard label="Terlambat" value={terlambat.toLocaleString("id-ID")} icon={<IconAlert />} accent="rose" />
        <StatCard label="Denda Outstanding" value={perpFormatRupiah(outstanding)} icon={<IconWallet />} accent="violet" />
        <StatCard label="Anggota Aktif" value={anggotaAktif.toLocaleString("id-ID")} icon={<IconCheck />} accent="emerald" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top Peminjam" description="Anggota dengan peminjaman terbanyak.">
          {peminjaman.isLoading ? (
            <p className="text-sm text-muted-fg">Memuat…</p>
          ) : topPeminjam.length > 0 ? (
            <HBarChart data={topPeminjam} valueFormatter={formatPinjamCount} />
          ) : (
            <p className="text-sm text-muted-fg">Belum ada data peminjaman.</p>
          )}
        </SectionCard>
        <SectionCard title="Buku Terpopuler" description="Judul paling sering dipinjam.">
          {peminjaman.isLoading ? (
            <p className="text-sm text-muted-fg">Memuat…</p>
          ) : bukuTerpopuler.length > 0 ? (
            <HBarChart data={bukuTerpopuler} valueFormatter={formatPinjamCount} />
          ) : (
            <p className="text-sm text-muted-fg">Belum ada data peminjaman.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/laporan")({ component: LaporanPage });
