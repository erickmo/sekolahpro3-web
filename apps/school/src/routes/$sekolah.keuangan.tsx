// TODO(api-migration): Backend Tagihan/Pembayaran/Pengeluaran/Jurnal/Kas doctypes
// not yet present in sekolahpro app (only `Pembayaran PPDB` exists, scope-limited
// to PPDB module). Module remains on mock fixtures from ../data/keuangan until
// the keuangan backend doctypes land. Once available, refactor each Tab to use
// useResourceList<...>("Tagihan", { fields:[...], limit_page_length:0 }) etc.
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  type Column,
  DataTable,
  FilterBar,
  PageHeader,
  SectionCard,
  StatCard,
  Tabs,
  type TabItem,
  type SelectFilter,
  IconWallet,
  IconChart,
  IconCheck,
  IconAlert,
  IconDownload,
  IconPlus,
  IconPrint,
  IconCalendar,
  IconFile,
  IconClock,
  IconArrowLeft,
} from "@sekolahpro/ui";
import {
  TAGIHAN_LIST,
  PEMBAYARAN_LIST,
  PENGELUARAN_LIST,
  JURNAL_LIST,
  KAS_LIST,
  RINGKASAN_BULAN,
  FILTER_OPTIONS,
  formatRupiah,
  formatTanggal,
  type TagihanRow,
  type PembayaranRow,
  type PengeluaranRow,
  type JurnalRow,
  type KasRow,
  type StatusTagihan,
  type StatusPengeluaran,
  type MetodeBayar,
  type JenisJurnal,
} from "../data/keuangan";

type TabKey = "ringkasan" | "tagihan" | "pembayaran" | "pengeluaran" | "kas" | "jurnal";

const CURRENT_MONTH_PREFIX = "2026-05";

const TONE_TAGIHAN: Record<StatusTagihan, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  Lunas: "success",
  Tertunda: "warning",
  "Jatuh Tempo": "danger",
  Cicilan: "brand",
  Draft: "neutral",
  Terkirim: "brand",
  Dibatalkan: "neutral",
};

const TONE_PENGELUARAN: Record<StatusPengeluaran, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  Disetujui: "success",
  Approval: "warning",
  Ditolak: "danger",
  Dibayar: "brand",
  Draft: "neutral",
};

const TONE_JURNAL: Record<JenisJurnal, "success" | "warning" | "neutral"> = {
  Penerimaan: "success",
  Pengeluaran: "warning",
  Penyesuaian: "neutral",
};

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

// ---------------------------------------------------------------------------
// Tab: Ringkasan
// ---------------------------------------------------------------------------

function RingkasanTab() {
  const maxValue = useMemo(
    () => Math.max(...RINGKASAN_BULAN.map((r) => Math.max(r.pemasukan, r.pengeluaran))),
    [],
  );

  const topTunggakan = useMemo(
    () =>
      [...TAGIHAN_LIST]
        .filter((t) => t.status !== "Lunas" && t.status !== "Dibatalkan")
        .map((t) => ({ ...t, sisa: t.jumlah - t.dibayar }))
        .sort((a, b) => b.sisa - a.sisa)
        .slice(0, 5),
    [],
  );

  const pengeluaranTerbaru = useMemo(
    () =>
      [...PENGELUARAN_LIST]
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 5),
    [],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <SectionCard
        title="Tren Pemasukan vs Pengeluaran 12 Bulan"
        description="Akumulasi per bulan tahun berjalan"
        className="xl:col-span-2"
        action={
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="text-muted-fg">Pemasukan</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
              <span className="text-muted-fg">Pengeluaran</span>
            </span>
          </div>
        }
      >
        <div className="space-y-3">
          {RINGKASAN_BULAN.map((r) => {
            const pctIn = maxValue > 0 ? (r.pemasukan / maxValue) * 100 : 0;
            const pctOut = maxValue > 0 ? (r.pengeluaran / maxValue) * 100 : 0;
            return (
              <div key={r.bulan} className="grid grid-cols-[40px_1fr] items-center gap-3">
                <div className="text-xs font-medium text-muted-fg">{r.bulan}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pctIn}%` }}
                      />
                    </div>
                    <div className="text-[11px] tabular-nums text-muted-fg w-24 text-right">
                      {formatRupiah(r.pemasukan)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${pctOut}%` }}
                      />
                    </div>
                    <div className="text-[11px] tabular-nums text-muted-fg w-24 text-right">
                      {formatRupiah(r.pengeluaran)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Top 5 Tagihan Tertunggak" padded={false}>
          <ul className="divide-y divide-border">
            {topTunggakan.map((t) => (
              <li key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-rose-500/10 text-rose-600">
                  <span className="h-4 w-4"><IconAlert /></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-fg truncate">{t.siswa}</div>
                  <div className="text-xs text-muted-fg truncate">
                    {t.kelas} · {t.judul}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{formatRupiah(t.sisa)}</div>
                  <Badge tone={TONE_TAGIHAN[t.status]} dot>{t.status}</Badge>
                </div>
              </li>
            ))}
            {topTunggakan.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-fg text-center">Tidak ada tunggakan.</li>
            ) : null}
          </ul>
        </SectionCard>

        <SectionCard title="Pengeluaran Terbaru" padded={false}>
          <ul className="divide-y divide-border">
            {pengeluaranTerbaru.map((p) => (
              <li key={p.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                  <span className="h-4 w-4"><IconWallet /></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-fg truncate">{p.deskripsi}</div>
                  <div className="text-xs text-muted-fg inline-flex items-center gap-1">
                    <span className="h-3 w-3"><IconClock /></span>
                    {formatTanggal(p.tanggal)} · {p.kategori}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{formatRupiah(p.jumlah)}</div>
                  <Badge tone={TONE_PENGELUARAN[p.status]} dot>{p.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Tagihan
// ---------------------------------------------------------------------------

function TagihanTab() {
  const [status, setStatus] = useState("Semua");
  const [kelas, setKelas] = useState("Semua");
  const [tahunAjaran, setTahunAjaran] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TAGIHAN_LIST.filter((t) => {
      if (q && !`${t.siswa} ${t.judul} ${t.id}`.toLowerCase().includes(q)) return false;
      if (status !== "Semua" && t.status !== status) return false;
      if (kelas !== "Semua" && t.kelas !== kelas) return false;
      if (tahunAjaran !== "Semua" && t.tahunAjaran !== tahunAjaran) return false;
      return true;
    });
  }, [search, status, kelas, tahunAjaran]);

  const counts = useMemo(() => {
    const c = { Lunas: 0, Tertunda: 0, "Jatuh Tempo": 0, Cicilan: 0 } as Record<string, number>;
    filtered.forEach((t) => {
      if (t.status in c) c[t.status] = (c[t.status] ?? 0) + 1;
    });
    return c;
  }, [filtered]);

  const filters: SelectFilter[] = [
    { key: "status", label: "Status", value: status, options: buildOptions(FILTER_OPTIONS.statusTagihan), onChange: setStatus },
    { key: "kelas", label: "Kelas", value: kelas, options: buildOptions(FILTER_OPTIONS.kelas), onChange: setKelas },
    { key: "ta", label: "Tahun Ajaran", value: tahunAjaran, options: buildOptions(FILTER_OPTIONS.tahunAjaran), onChange: setTahunAjaran },
  ];

  const cols: Column<TagihanRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
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
    { key: "jt", header: "Jatuh Tempo", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.jatuhTempo)}</span> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
    { key: "dibayar", header: "Dibayar", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{formatRupiah(r.dibayar)}</span> },
    { key: "sisa", header: "Sisa", align: "right", cell: (r) => {
      const sisa = r.jumlah - r.dibayar;
      return <span className={`tabular-nums font-medium ${sisa > 0 ? "text-amber-700" : "text-emerald-600"}`}>{formatRupiah(sisa)}</span>;
    } },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TONE_TAGIHAN[r.status]} dot>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari siswa, judul, atau ID tagihan..." }}
        filters={filters}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lunas" value={counts.Lunas ?? 0} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Tertunda" value={counts.Tertunda ?? 0} accent="amber" icon={<IconClock />} />
        <StatCard label="Jatuh Tempo" value={counts["Jatuh Tempo"] ?? 0} accent="rose" icon={<IconAlert />} />
        <StatCard label="Cicilan" value={counts.Cicilan ?? 0} accent="brand" icon={<IconWallet />} />
      </div>
      <SectionCard title={`${filtered.length} tagihan`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Pembayaran
// ---------------------------------------------------------------------------

function PembayaranTab() {
  const [metode, setMetode] = useState("Semua");
  const [kelas, setKelas] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PEMBAYARAN_LIST.filter((p) => {
      if (q && !`${p.siswa} ${p.judul} ${p.id} ${p.ref}`.toLowerCase().includes(q)) return false;
      if (metode !== "Semua" && p.metode !== metode) return false;
      if (kelas !== "Semua" && p.kelas !== kelas) return false;
      return true;
    });
  }, [search, metode, kelas]);

  const counts = useMemo(() => {
    const c: Record<MetodeBayar, number> = {
      Tunai: 0, Transfer: 0, QRIS: 0, "Virtual Account": 0, EDC: 0,
    };
    filtered.forEach((p) => { c[p.metode] += 1; });
    return c;
  }, [filtered]);

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
      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari siswa, judul, ref, atau ID..." }}
        filters={filters}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tunai" value={counts.Tunai} accent="emerald" />
        <StatCard label="Transfer" value={counts.Transfer} accent="brand" />
        <StatCard label="QRIS" value={counts.QRIS} accent="violet" />
        <StatCard label="Virtual Account" value={counts["Virtual Account"]} accent="amber" />
      </div>
      <SectionCard title={`${filtered.length} pembayaran`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Pengeluaran
// ---------------------------------------------------------------------------

function PengeluaranTab() {
  const [kategori, setKategori] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [metode, setMetode] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PENGELUARAN_LIST.filter((p) => {
      if (q && !`${p.deskripsi} ${p.penerima} ${p.id}`.toLowerCase().includes(q)) return false;
      if (kategori !== "Semua" && p.kategori !== kategori) return false;
      if (status !== "Semua" && p.status !== status) return false;
      if (metode !== "Semua" && p.metode !== metode) return false;
      return true;
    });
  }, [search, kategori, status, metode]);

  const counts = useMemo(() => {
    const c = { Disetujui: 0, Approval: 0, Ditolak: 0, Dibayar: 0 } as Record<string, number>;
    filtered.forEach((p) => {
      if (p.status in c) c[p.status] = (c[p.status] ?? 0) + 1;
    });
    return c;
  }, [filtered]);

  const filters: SelectFilter[] = [
    { key: "kategori", label: "Kategori", value: kategori, options: buildOptions(FILTER_OPTIONS.kategoriPengeluaran), onChange: setKategori },
    { key: "status", label: "Status", value: status, options: buildOptions(FILTER_OPTIONS.statusPengeluaran), onChange: setStatus },
    { key: "metode", label: "Metode", value: metode, options: buildOptions(FILTER_OPTIONS.metode), onChange: setMetode },
  ];

  const cols: Column<PengeluaranRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "kategori", header: "Kategori", cell: (r) => <Badge tone="brand">{r.kategori}</Badge> },
    { key: "deskripsi", header: "Deskripsi", cell: (r) => <span className="text-sm">{r.deskripsi}</span> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
    { key: "penerima", header: "Penerima", cell: (r) => <span className="text-sm">{r.penerima}</span> },
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TONE_PENGELUARAN[r.status]} dot>{r.status}</Badge> },
    { key: "approver", header: "Approver", cell: (r) => <span className="text-sm text-muted-fg">{r.approver ?? "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari deskripsi, penerima, atau ID..." }}
        filters={filters}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Disetujui" value={counts.Disetujui ?? 0} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Menunggu Approval" value={counts.Approval ?? 0} accent="amber" icon={<IconClock />} />
        <StatCard label="Ditolak" value={counts.Ditolak ?? 0} accent="rose" icon={<IconAlert />} />
        <StatCard label="Dibayar" value={counts.Dibayar ?? 0} accent="brand" icon={<IconWallet />} />
      </div>
      <SectionCard title={`${filtered.length} pengeluaran`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Kas
// ---------------------------------------------------------------------------

function KasTab() {
  const totals = useMemo(() => {
    const masuk = KAS_LIST.reduce((s, k) => s + k.masuk, 0);
    const keluar = KAS_LIST.reduce((s, k) => s + k.keluar, 0);
    const last = KAS_LIST[KAS_LIST.length - 1];
    return {
      masuk,
      keluar,
      saldoAkhir: last?.saldoAkhir ?? 0,
      hari: KAS_LIST.length,
    };
  }, []);

  const cols: Column<KasRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "saldoAwal", header: "Saldo Awal", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{formatRupiah(r.saldoAwal)}</span> },
    { key: "masuk", header: "Masuk", align: "right", cell: (r) => <span className="tabular-nums text-emerald-600 font-medium">{formatRupiah(r.masuk)}</span> },
    { key: "keluar", header: "Keluar", align: "right", cell: (r) => <span className="tabular-nums text-rose-600 font-medium">{formatRupiah(r.keluar)}</span> },
    { key: "saldoAkhir", header: "Saldo Akhir", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{formatRupiah(r.saldoAkhir)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Masuk" value={formatRupiah(totals.masuk)} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Total Keluar" value={formatRupiah(totals.keluar)} accent="rose" icon={<IconArrowLeft />} />
        <StatCard label="Saldo Akhir" value={formatRupiah(totals.saldoAkhir)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Hari Tercatat" value={totals.hari} accent="violet" icon={<IconCalendar />} />
      </div>
      <SectionCard title={`Buku Kas Harian — ${KAS_LIST.length} entri`} padded={false}>
        <DataTable data={KAS_LIST} columns={cols} rowKey={(r) => r.tanggal} />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Jurnal
// ---------------------------------------------------------------------------

function JurnalTab() {
  const [jenis, setJenis] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return JURNAL_LIST.filter((j) => {
      if (q && !`${j.id} ${j.akun} ${j.ref} ${j.keterangan}`.toLowerCase().includes(q)) return false;
      if (jenis !== "Semua" && j.jenis !== jenis) return false;
      return true;
    });
  }, [search, jenis]);

  const filters: SelectFilter[] = [
    { key: "jenis", label: "Jenis", value: jenis, options: buildOptions(FILTER_OPTIONS.jenisJurnal), onChange: setJenis },
  ];

  const cols: Column<JurnalRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "ref", header: "Ref", cell: (r) => <span className="tabular-nums text-xs text-muted-fg">{r.ref}</span> },
    { key: "jenis", header: "Jenis", cell: (r) => <Badge tone={TONE_JURNAL[r.jenis]} dot>{r.jenis}</Badge> },
    { key: "akun", header: "Akun", cell: (r) => <span className="text-sm">{r.akun}</span> },
    { key: "debit", header: "Debit", align: "right", cell: (r) => r.debit > 0 ? <span className="tabular-nums text-emerald-600">{formatRupiah(r.debit)}</span> : <span className="text-muted-fg text-xs">—</span> },
    { key: "kredit", header: "Kredit", align: "right", cell: (r) => r.kredit > 0 ? <span className="tabular-nums text-rose-600">{formatRupiah(r.kredit)}</span> : <span className="text-muted-fg text-xs">—</span> },
    { key: "ket", header: "Keterangan", cell: (r) => <span className="text-sm text-muted-fg">{r.keterangan}</span> },
  ];

  return (
    <div className="space-y-6">
      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari akun, ref, atau keterangan..." }}
        filters={filters}
      />
      <SectionCard title={`${filtered.length} jurnal`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TAB_META: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: <IconChart /> },
  { key: "tagihan", label: "Tagihan", icon: <IconFile /> },
  { key: "pembayaran", label: "Pembayaran", icon: <IconCheck /> },
  { key: "pengeluaran", label: "Pengeluaran", icon: <IconWallet /> },
  { key: "kas", label: "Buku Kas", icon: <IconCalendar /> },
  { key: "jurnal", label: "Jurnal", icon: <IconClock /> },
];

function KeuanganPage() {
  const [tab, setTab] = useState<TabKey>("ringkasan");

  const stats = useMemo(() => {
    const last = KAS_LIST[KAS_LIST.length - 1];
    const saldoKas = last?.saldoAkhir ?? 0;
    const pemasukanBulan = PEMBAYARAN_LIST
      .filter((p) => p.tanggal.startsWith(CURRENT_MONTH_PREFIX))
      .reduce((s, p) => s + p.jumlah, 0);
    const pengeluaranBulan = PENGELUARAN_LIST
      .filter((p) => p.tanggal.startsWith(CURRENT_MONTH_PREFIX) && p.status === "Dibayar")
      .reduce((s, p) => s + p.jumlah, 0);
    const tagihanTerbuka = TAGIHAN_LIST
      .filter((t) => t.status !== "Lunas" && t.status !== "Dibatalkan")
      .reduce((s, t) => s + (t.jumlah - t.dibayar), 0);
    return { saldoKas, pemasukanBulan, pengeluaranBulan, tagihanTerbuka };
  }, []);

  const counts: Partial<Record<TabKey, number>> = {
    tagihan: TAGIHAN_LIST.length,
    pembayaran: PEMBAYARAN_LIST.length,
    pengeluaran: PENGELUARAN_LIST.length,
    kas: KAS_LIST.length,
    jurnal: JURNAL_LIST.length,
  };

  const tabItems: TabItem[] = TAB_META.map((t) => ({
    key: t.key,
    label: t.label,
    icon: t.icon,
    count: counts[t.key],
    active: tab === t.key,
    render: ({ className, children }) => (
      <button type="button" onClick={() => setTab(t.key)} className={className}>
        {children}
      </button>
    ),
  }));

  const renderTab = () => {
    switch (tab) {
      case "ringkasan": return <RingkasanTab />;
      case "tagihan": return <TagihanTab />;
      case "pembayaran": return <PembayaranTab />;
      case "pengeluaran": return <PengeluaranTab />;
      case "kas": return <KasTab />;
      case "jurnal": return <JurnalTab />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Keuangan Sekolah"
        description="Pantau pemasukan, pengeluaran, dan tagihan siswa."
        actions={
          <>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconDownload /></span>
              Ekspor
            </Button>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconPrint /></span>
              Cetak Laporan
            </Button>
            <Button>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Buat Tagihan
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo Kas" value={formatRupiah(stats.saldoKas)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Pemasukan Bulan Ini" value={formatRupiah(stats.pemasukanBulan)} accent="emerald" icon={<IconChart />} />
        <StatCard label="Pengeluaran Bulan Ini" value={formatRupiah(stats.pengeluaranBulan)} accent="rose" icon={<IconArrowLeft />} />
        <StatCard label="Tagihan Terbuka" value={formatRupiah(stats.tagihanTerbuka)} accent="amber" icon={<IconAlert />} />
      </div>

      <Tabs items={tabItems} />

      {renderTab()}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/keuangan")({ component: KeuanganPage });
