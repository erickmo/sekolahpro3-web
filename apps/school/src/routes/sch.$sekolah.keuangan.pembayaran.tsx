/**
 * Operasional › Pembayaran (payment receipts).
 *
 * Kasir record incoming payments. Adds a role guide and a payment-method
 * composition donut over the existing table. Mock-backed (../data/keuangan).
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  type Column,
  DataTable,
  FilterBar,
  PageHeader,
  SectionCard,
  StatCard,
  type SelectFilter,
} from "@sekolahpro/ui";
import { DonutChart, type ChartDatum, type Tone } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import {
  listPembayaranForSekolah,
  FILTER_OPTIONS,
  formatRupiah,
  formatTanggal,
  type PembayaranRow,
  type MetodeBayar,
} from "../data/keuangan";

const METODE_TONE: Record<MetodeBayar, Tone> = {
  Tunai: "emerald",
  Transfer: "brand",
  QRIS: "violet",
  "Virtual Account": "amber",
  EDC: "sky",
};

const GUIDE_STEPS = [
  { title: "Catat pembayaran masuk", detail: "Pilih metode (Tunai/Transfer/QRIS/VA/EDC) dan masukkan jumlah serta referensi.", roles: ["kasir"] },
  { title: "Cocokkan dengan tagihan", detail: "Setiap pembayaran terhubung ke tagihan siswa agar sisa otomatis berkurang.", roles: ["kasir", "bendahara"] },
  { title: "Rekonsiliasi akhir hari", detail: "Total pembayaran tunai harus cocok dengan kas fisik di Buku Kas.", roles: ["bendahara"] },
];

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

function PembayaranPage() {
  const { sekolah } = Route.useParams();
  const [metode, setMetode] = useState("Semua");
  const [kelas, setKelas] = useState("Semua");
  const [search, setSearch] = useState("");

  const scoped = useMemo(() => listPembayaranForSekolah(sekolah), [sekolah]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((p) => {
      if (q && !`${p.siswa} ${p.judul} ${p.id} ${p.ref}`.toLowerCase().includes(q)) return false;
      if (metode !== "Semua" && p.metode !== metode) return false;
      if (kelas !== "Semua" && p.kelas !== kelas) return false;
      return true;
    });
  }, [scoped, search, metode, kelas]);

  const sumByMetode = useMemo(() => {
    const c: Record<MetodeBayar, number> = { Tunai: 0, Transfer: 0, QRIS: 0, "Virtual Account": 0, EDC: 0 };
    filtered.forEach((p) => { c[p.metode] += p.jumlah; });
    return c;
  }, [filtered]);

  const donut = useMemo<ChartDatum[]>(
    () =>
      (Object.keys(sumByMetode) as MetodeBayar[])
        .map((m) => ({ label: m, value: sumByMetode[m], tone: METODE_TONE[m] }))
        .filter((d) => d.value > 0),
    [sumByMetode],
  );

  const totalMasuk = useMemo(() => filtered.reduce((s, p) => s + p.jumlah, 0), [filtered]);

  const filters: SelectFilter[] = [
    { key: "metode", label: "Metode", value: metode, options: buildOptions(FILTER_OPTIONS.metode), onChange: setMetode },
    { key: "kelas", label: "Kelas", value: kelas, options: buildOptions(FILTER_OPTIONS.kelas), onChange: setKelas },
  ];

  const cols: Column<PembayaranRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
    {
      key: "siswa",
      header: "Siswa",
      cell: (r) => (
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{r.siswa}</div>
          <div className="text-xs text-muted-fg">{r.kelas}</div>
        </div>
      ),
    },
    { key: "judul", header: "Judul", cell: (r) => <span className="text-sm">{r.judul}</span> },
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
    { key: "ref", header: "Ref", cell: (r) => <span className="tabular-nums text-xs text-muted-fg">{r.ref}</span> },
    { key: "penerima", header: "Penerima", cell: (r) => <span className="text-sm">{r.penerima}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Pembayaran"
        description="Catat dan telusuri penerimaan pembayaran siswa."
      />

      <KeuanganPageGuide storageId="pembayaran" steps={GUIDE_STEPS} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total Diterima" value={formatRupiah(totalMasuk)} accent="emerald" />
          <StatCard label="Jumlah Transaksi" value={filtered.length} accent="brand" />
          <StatCard label="Tunai" value={formatRupiah(sumByMetode.Tunai)} accent="emerald" />
          <StatCard label="Non-Tunai" value={formatRupiah(totalMasuk - sumByMetode.Tunai)} accent="violet" />
        </div>
        <SectionCard title="Komposisi Metode" description="Berdasarkan nilai">
          <div className="flex justify-center">
            <DonutChart data={donut} centerTop={<span className="text-sm font-semibold">{donut.length}</span>} centerBottom={<span className="text-[11px] text-muted-fg">metode</span>} />
          </div>
        </SectionCard>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari siswa, judul, ref, atau ID..." }}
        filters={filters}
      />

      <SectionCard title={`${filtered.length} pembayaran`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/pembayaran")({ component: PembayaranPage });
