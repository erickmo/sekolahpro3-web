import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Column,
  DataTable,
  DetailPageTemplate,
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  StatCard,
  Tabs,
  IconArrowLeft,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
  IconClock,
  IconDownload,
  IconEdit,
  IconHome,
  IconId,
  IconMail,
  IconMapPin,
  IconMore,
  IconPhone,
  IconPlus,
  IconPrint,
  IconUsers,
  IconWallet,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import {
  findAnggota,
  formatRupiah,
  formatTanggal,
  type AktivitasRow,
  type Anggota,
  type AngsuranRow,
  type JenisSimpanan,
  type PinjamanRow,
  type SHURow,
  type SimpananRow,
  type StatusAnggota,
  type TipeAnggota,
  type TransaksiTokoRow,
} from "../data/koperasi";

type TabKey = "ringkasan" | "profil" | "simpanan" | "pinjaman" | "angsuran" | "toko" | "shu" | "aktivitas";

const STATUS_TONE: Record<StatusAnggota, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Aktif: "success",
  "Non-aktif": "neutral",
  Keluar: "danger",
  Pending: "warning",
};

const TIPE_TONE: Record<TipeAnggota, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Siswa: "brand",
  Guru: "success",
  Staff: "neutral",
  "Orang Tua": "warning",
};

const SIMPANAN_TIPE_TONE = {
  Setor: "success",
  Tarik: "warning",
} as const;

const PINJAMAN_TONE = {
  Pengajuan: "warning",
  Disetujui: "brand",
  Berjalan: "brand",
  Lunas: "success",
  Macet: "danger",
  Ditolak: "danger",
} as const;

const ANGSURAN_TONE = {
  Terjadwal: "neutral",
  Dibayar: "success",
  Telat: "danger",
} as const;

function Hero({ anggota }: { anggota: Anggota }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={anggota.nama} src={anggota.fotoUrl ?? null} size="lg" className="!h-20 !w-20 !text-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{anggota.nama}</h2>
            <Badge tone={STATUS_TONE[anggota.status]} dot>{anggota.status}</Badge>
            <Badge tone={TIPE_TONE[anggota.tipeAnggota]}>{anggota.tipeAnggota}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">{anggota.noAnggota}</span>
            <span className="mx-2">·</span>
            <span>Gabung {formatTanggal(anggota.tanggalGabung)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconPhone /></span>{anggota.telepon}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMail /></span>{anggota.email}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMapPin /></span>{anggota.alamat}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconWallet /></span>Setor Simpanan
          </Button>
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconChart /></span>Buat Pinjaman
          </Button>
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconPrint /></span>Cetak Buku
          </Button>
          <Button size="sm">
            <span className="h-4 w-4 mr-1.5"><IconEdit /></span>Edit
          </Button>
          <Button variant="outline" size="sm" className="!px-2">
            <span className="h-4 w-4"><IconMore /></span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RingkasanTab({ anggota }: { anggota: Anggota }) {
  const sisaAngsuran = anggota.angsuran
    .filter((a) => a.status === "Terjadwal" || a.status === "Telat")
    .reduce((s, a) => s + a.jumlah, 0);
  const pinjamanBerjalan = anggota.pinjaman.find((p) => p.status === "Berjalan" || p.status === "Disetujui");
  const shuTerakhir = anggota.shu[0];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Simpanan" value={formatRupiah(anggota.totalSimpanan)} hint={`${anggota.simpanan.length} transaksi`} icon={<IconWallet />} accent="brand" />
        <StatCard label="Simpanan Sukarela" value={formatRupiah(anggota.saldoSimpananSukarela)} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Pinjaman Aktif" value={anggota.pinjamanAktif > 0 ? formatRupiah(anggota.pinjamanAktif) : "—"} hint={`${anggota.pinjaman.length} pinjaman`} icon={<IconChart />} accent="amber" />
        <StatCard label="Sisa Angsuran" value={sisaAngsuran > 0 ? formatRupiah(sisaAngsuran) : "Lunas"} icon={<IconCalendar />} accent="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Breakdown Simpanan"
            description="Per jenis simpanan"
            action={<Badge tone="brand" dot>Saldo terkini</Badge>}
          >
            <ul className="divide-y divide-border -mx-5 -my-2">
              {(
                [
                  { jenis: "Pokok", saldo: anggota.saldoSimpananPokok, desc: "Simpanan satu kali saat menjadi anggota" },
                  { jenis: "Wajib", saldo: anggota.saldoSimpananWajib, desc: "Akumulasi setoran bulanan" },
                  { jenis: "Sukarela", saldo: anggota.saldoSimpananSukarela, desc: "Dapat ditarik kapan saja" },
                  { jenis: "Berjangka", saldo: anggota.saldoSimpananBerjangka, desc: "Tabungan dengan jangka waktu" },
                ] as { jenis: JenisSimpanan; saldo: number; desc: string }[]
              ).map((row) => (
                <li key={row.jenis} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
                    <span className="h-4 w-4"><IconWallet /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">Simpanan {row.jenis}</div>
                    <div className="text-xs text-muted-fg">{row.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{formatRupiah(row.saldo)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Transaksi Simpanan Terbaru" padded={false}>
            <ul className="divide-y divide-border">
              {anggota.simpanan.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${s.tipe === "Setor" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                    <span className="h-4 w-4"><IconWallet /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{s.tipe} · Simpanan {s.jenis}</div>
                    <div className="text-xs text-muted-fg">{formatTanggal(s.tanggal)} · {s.petugas}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{formatRupiah(s.jumlah)}</div>
                    <Badge tone={SIMPANAN_TIPE_TONE[s.tipe]}>{s.tipe}</Badge>
                  </div>
                </li>
              ))}
              {anggota.simpanan.length === 0 ? (
                <li className="px-5 py-6 text-sm text-muted-fg text-center">Belum ada transaksi simpanan.</li>
              ) : null}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Pinjaman Aktif" padded={false}>
            {pinjamanBerjalan ? (
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-fg">{pinjamanBerjalan.id}</div>
                  <Badge tone={PINJAMAN_TONE[pinjamanBerjalan.status]} dot>{pinjamanBerjalan.status}</Badge>
                </div>
                <div className="text-xs text-muted-fg">Pengajuan {formatTanggal(pinjamanBerjalan.tanggal)} · Tenor {pinjamanBerjalan.tenor} bln</div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <div className="text-xs text-muted-fg">Pokok</div>
                    <div className="text-sm font-semibold tabular-nums">{formatRupiah(pinjamanBerjalan.jumlah)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-fg">Sisa Pokok</div>
                    <div className="text-sm font-semibold tabular-nums">{formatRupiah(pinjamanBerjalan.sisaPokok)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-fg">Angsuran/bln</div>
                    <div className="text-sm font-semibold tabular-nums">{formatRupiah(pinjamanBerjalan.angsuran)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-fg">Jatuh Tempo</div>
                    <div className="text-sm font-semibold tabular-nums">{formatTanggal(pinjamanBerjalan.jatuhTempo)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-muted-fg text-center">Tidak ada pinjaman aktif.</div>
            )}
          </SectionCard>

          <SectionCard title="SHU Terakhir" padded={false}>
            {shuTerakhir ? (
              <div className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-fg">Tahun Buku {shuTerakhir.tahun}</div>
                  <Badge tone="success">Diterima</Badge>
                </div>
                <div className="text-xs text-muted-fg">Jasa simpanan {shuTerakhir.persenJasaSimpanan}% · Jasa pinjaman {shuTerakhir.persenJasaPinjaman}%</div>
                <div className="pt-2">
                  <div className="text-xs text-muted-fg">Total Diterima</div>
                  <div className="text-lg font-semibold tabular-nums text-fg">{formatRupiah(shuTerakhir.totalDiterima)}</div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-muted-fg text-center">Belum ada SHU.</div>
            )}
          </SectionCard>

          <SectionCard title="Aksi Cepat">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm"><span className="text-xs">Setor Simpanan</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Tarik Simpanan</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Bayar Angsuran</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Cetak Buku</span></Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function ProfilTab({ anggota }: { anggota: Anggota }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas">
        <InfoGrid cols={3}>
          <InfoField label="No Anggota" icon={<IconId />} value={<span className="tabular-nums">{anggota.noAnggota}</span>} />
          <InfoField label="Nama" value={anggota.nama} />
          <InfoField label="Tipe Anggota" value={<Badge tone={TIPE_TONE[anggota.tipeAnggota]}>{anggota.tipeAnggota}</Badge>} />
          <InfoField label="NIS" value={anggota.nis ? <span className="tabular-nums">{anggota.nis}</span> : "—"} />
          <InfoField label="NIP" value={anggota.nip ? <span className="tabular-nums">{anggota.nip}</span> : "—"} />
          <InfoField label="Jenis Kelamin" value={anggota.jenisKelamin} />
          <InfoField label="Tanggal Lahir" value={formatTanggal(anggota.tanggalLahir)} />
          <InfoField label="Tanggal Gabung" icon={<IconCalendar />} value={formatTanggal(anggota.tanggalGabung)} />
          <InfoField label="Status" value={<Badge tone={STATUS_TONE[anggota.status]} dot>{anggota.status}</Badge>} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Kontak">
        <InfoGrid cols={2}>
          <InfoField label="Telepon" icon={<IconPhone />} value={anggota.telepon} />
          <InfoField label="Email" icon={<IconMail />} value={anggota.email} />
          <InfoField label="Alamat" icon={<IconMapPin />} value={anggota.alamat} className="sm:col-span-2" />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function SimpananTab({ anggota }: { anggota: Anggota }) {
  const cols: Column<SimpananRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis}</Badge> },
    { key: "tipe", header: "Tipe", cell: (r) => <Badge tone={SIMPANAN_TIPE_TONE[r.tipe]} dot>{r.tipe}</Badge> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
    { key: "saldo", header: "Saldo Setelah", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{formatRupiah(r.saldoSetelah)}</span> },
    { key: "petugas", header: "Petugas", cell: (r) => r.petugas },
    { key: "ref", header: "Ref", cell: (r) => <span className="tabular-nums text-muted-fg">{r.ref ?? "—"}</span> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Simpanan Pokok" value={formatRupiah(anggota.saldoSimpananPokok)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Simpanan Wajib" value={formatRupiah(anggota.saldoSimpananWajib)} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Simpanan Sukarela" value={formatRupiah(anggota.saldoSimpananSukarela)} accent="violet" />
        <StatCard label="Simpanan Berjangka" value={formatRupiah(anggota.saldoSimpananBerjangka)} accent="amber" />
      </div>
      <SectionCard
        title="Riwayat Simpanan"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Filter Periode</Button>
            <Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Setor</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={anggota.simpanan} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

function PinjamanTab({ anggota }: { anggota: Anggota }) {
  const cols: Column<PinjamanRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
    { key: "tenor", header: "Tenor", align: "right", cell: (r) => <span className="tabular-nums">{r.tenor} bln</span> },
    { key: "bunga", header: "Bunga", align: "right", cell: (r) => <span className="tabular-nums">{r.bunga}%</span> },
    { key: "ang", header: "Angsuran", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.angsuran)}</span> },
    { key: "sisa", header: "Sisa Pokok", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.sisaPokok)}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={PINJAMAN_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  return (
    <div className="space-y-6">
      <SectionCard
        title="Pinjaman"
        action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Buat Pinjaman</Button>}
        padded={false}
      >
        {anggota.pinjaman.length === 0 ? (
          <EmptyState title="Belum ada pinjaman" description="Anggota belum pernah mengajukan pinjaman." />
        ) : (
          <DataTable data={anggota.pinjaman} columns={cols} rowKey={(r) => r.id} />
        )}
      </SectionCard>
    </div>
  );
}

function AngsuranTab({ anggota }: { anggota: Anggota }) {
  const cols: Column<AngsuranRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
    { key: "pokok", header: "Pokok", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.pokok)}</span> },
    { key: "bunga", header: "Bunga", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.bunga)}</span> },
    { key: "denda", header: "Denda", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{r.denda ? formatRupiah(r.denda) : "—"}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={ANGSURAN_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  const counts = anggota.angsuran.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalDibayar = anggota.angsuran.filter((a) => a.status === "Dibayar").reduce((s, a) => s + a.jumlah, 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Dibayar" value={formatRupiah(totalDibayar)} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Terjadwal" value={counts.Terjadwal ?? 0} accent="brand" icon={<IconCalendar />} />
        <StatCard label="Telat" value={counts.Telat ?? 0} accent="rose" icon={<IconClock />} />
      </div>
      <SectionCard
        title="Riwayat Angsuran"
        action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Bayar Angsuran</Button>}
        padded={false}
      >
        {anggota.angsuran.length === 0 ? (
          <EmptyState title="Belum ada angsuran" description="Belum ada jadwal angsuran tercatat." />
        ) : (
          <DataTable data={anggota.angsuran} columns={cols} rowKey={(r) => r.id} />
        )}
      </SectionCard>
    </div>
  );
}

function TokoTab({ anggota }: { anggota: Anggota }) {
  const cols: Column<TransaksiTokoRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "item", header: "Item", cell: (r) => <span className="font-medium">{r.item}</span> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{r.jumlah}</span> },
    { key: "harga", header: "Harga", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.harga)}</span> },
    { key: "total", header: "Total", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{formatRupiah(r.total)}</span> },
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "petugas", header: "Petugas", cell: (r) => r.petugas },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Belanja" value={formatRupiah(anggota.totalBelanjaToko)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Jumlah Transaksi" value={anggota.jumlahTransaksi} accent="emerald" icon={<IconCheck />} />
      </div>
      <SectionCard
        title="Riwayat Transaksi Toko"
        action={<Button variant="outline" size="sm"><span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh</Button>}
        padded={false}
      >
        {anggota.transaksiToko.length === 0 ? (
          <EmptyState title="Belum ada transaksi" description="Anggota belum melakukan transaksi di toko koperasi." />
        ) : (
          <DataTable data={anggota.transaksiToko} columns={cols} rowKey={(r) => r.id} />
        )}
      </SectionCard>
    </div>
  );
}

function SHUTab({ anggota }: { anggota: Anggota }) {
  const cols: Column<SHURow>[] = [
    { key: "tahun", header: "Tahun", cell: (r) => <span className="tabular-nums font-medium">{r.tahun}</span> },
    { key: "anggota", header: "Persen Anggota", align: "right", cell: (r) => <span className="tabular-nums">{r.persenAnggota}%</span> },
    { key: "jsim", header: "Jasa Simpanan", align: "right", cell: (r) => <span className="tabular-nums">{r.persenJasaSimpanan}%</span> },
    { key: "jpin", header: "Jasa Pinjaman", align: "right", cell: (r) => <span className="tabular-nums">{r.persenJasaPinjaman}%</span> },
    { key: "total", header: "Total Diterima", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{formatRupiah(r.totalDiterima)}</span> },
  ];
  return (
    <SectionCard
      title="Riwayat SHU (Sisa Hasil Usaha)"
      description="Pembagian keuntungan tahunan"
      action={<Button variant="outline" size="sm"><span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh Slip</Button>}
      padded={false}
    >
      {anggota.shu.length === 0 ? (
        <EmptyState title="Belum ada SHU" description="Anggota belum menerima pembagian SHU." />
      ) : (
        <DataTable data={anggota.shu} columns={cols} rowKey={(r) => r.tahun} />
      )}
    </SectionCard>
  );
}

function AktivitasTab({ anggota }: { anggota: Anggota }) {
  return (
    <SectionCard title="Linimasa Aktivitas" description="Riwayat perubahan dan kejadian terkait anggota" padded={false}>
      {anggota.aktivitas.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-border">
          {anggota.aktivitas.map((a: AktivitasRow, i) => (
            <li key={i} className="flex items-start gap-4 px-5 py-4">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Badge tone={a.tone} dot>·</Badge>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-fg">
                  <span className="font-medium">{a.aktor}</span>{" "}
                  <span className="text-muted-fg">{a.aksi}</span>
                </div>
                <div className="text-xs text-muted-fg mt-1 inline-flex items-center gap-1">
                  <span className="h-3 w-3"><IconClock /></span>{a.waktu}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

const TAB_META: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: <IconHome /> },
  { key: "profil", label: "Profil", icon: <IconId /> },
  { key: "simpanan", label: "Simpanan", icon: <IconWallet /> },
  { key: "pinjaman", label: "Pinjaman", icon: <IconChart /> },
  { key: "angsuran", label: "Angsuran", icon: <IconCalendar /> },
  { key: "toko", label: "Toko", icon: <IconBook /> },
  { key: "shu", label: "SHU", icon: <IconUsers /> },
  { key: "aktivitas", label: "Aktivitas", icon: <IconClock /> },
];

const VALID_TABS = new Set<TabKey>([
  "ringkasan","profil","simpanan","pinjaman","angsuran","toko","shu","aktivitas",
]);

// Backend Anggota Koperasi doctype shape; nested arrays (simpanan, pinjaman,
// angsuran, shu, aktivitas) stay on mock until each gets its own resource
// query in a follow-up sprint.
type AnggotaDoc = {
  name: string;
  nomor_anggota?: string;
  nasabah?: string;
  jenis_anggota?: string;
  tanggal_masuk?: string;
  status?: string;
};

// Backend Akad Pembiayaan rows (filtered by nasabah). Mapped into
// PinjamanRow shape for the Pinjaman tab.
type AkadPembiayaanRow = {
  name: string;
  nomor_akad?: string;
  jumlah_pokok?: number;
  margin_total?: number;
  total_kewajiban?: number;
  tenor?: number;
  tanggal_akad?: string;
  tanggal_jatuh_tempo?: string;
  status?: string;
};

const AKAD_STATUS_MAP: Record<string, PinjamanRow["status"]> = {
  Aktif: "Berjalan",
  Lunas: "Lunas",
  Macet: "Macet",
};

function mapAkadToPinjamanRows(rows: AkadPembiayaanRow[]): PinjamanRow[] {
  return rows.map((r) => {
    const pokok = r.jumlah_pokok ?? 0;
    const margin = r.margin_total ?? 0;
    const tenor = r.tenor ?? 0;
    const totalKewajiban = r.total_kewajiban ?? pokok + margin;
    const bunga = pokok > 0 ? Number(((margin / pokok) * 100).toFixed(2)) : 0;
    const angsuran = tenor > 0 ? Math.floor(totalKewajiban / tenor) : 0;
    const status = AKAD_STATUS_MAP[r.status ?? ""] ?? "Berjalan";
    const sisaPokok = status === "Lunas" ? 0 : pokok;
    return {
      id: r.nomor_akad ?? r.name,
      tanggal: r.tanggal_akad ?? "",
      jumlah: pokok,
      tenor,
      bunga,
      angsuran,
      sisaPokok,
      status,
      jatuhTempo: r.tanggal_jatuh_tempo ?? "",
    };
  });
}

function AnggotaDetailPage() {
  const { noAnggota } = Route.useParams();
  const search = Route.useSearch();
  const docQ = useResourceDoc<AnggotaDoc>("Anggota Koperasi", noAnggota);
  const nasabah = docQ.data?.nasabah;
  const akadListQ = useResourceList<AkadPembiayaanRow>(
    "Akad Pembiayaan",
    {
      filters: { nasabah: nasabah ?? "" },
      fields: [
        "name",
        "nomor_akad",
        "jumlah_pokok",
        "margin_total",
        "total_kewajiban",
        "tenor",
        "tanggal_akad",
        "tanggal_jatuh_tempo",
        "status",
      ],
    },
    { enabled: Boolean(nasabah) },
  );
  const mock = findAnggota(noAnggota);
  const anggota: Anggota | undefined = (() => {
    if (!mock) return undefined;
    const d = docQ.data;
    const akadRows = akadListQ.data ?? [];
    const pinjamanBackend = akadRows.length > 0 ? mapAkadToPinjamanRows(akadRows) : undefined;
    if (!d) {
      return pinjamanBackend ? { ...mock, pinjaman: pinjamanBackend } : mock;
    }
    return {
      ...mock,
      noAnggota: d.nomor_anggota ?? d.name ?? mock.noAnggota,
      nama: d.nasabah ?? mock.nama,
      tipeAnggota: (d.jenis_anggota as TipeAnggota) ?? mock.tipeAnggota,
      tanggalGabung: d.tanggal_masuk ?? mock.tanggalGabung,
      status: (d.status as StatusAnggota) ?? mock.status,
      pinjaman: pinjamanBackend ?? mock.pinjaman,
    };
  })();
  const navigate = useNavigate();
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/koperasi/$noAnggota", params: { noAnggota }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (!anggota) {
    throw notFound();
  }

  const counts: Partial<Record<TabKey, number>> = {
    simpanan: anggota.simpanan.length,
    pinjaman: anggota.pinjaman.length,
    angsuran: anggota.angsuran.length,
    toko: anggota.transaksiToko.length,
    shu: anggota.shu.length,
    aktivitas: anggota.aktivitas.length,
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
      case "ringkasan": return <RingkasanTab anggota={anggota} />;
      case "profil": return <ProfilTab anggota={anggota} />;
      case "simpanan": return <SimpananTab anggota={anggota} />;
      case "pinjaman": return <PinjamanTab anggota={anggota} />;
      case "angsuran": return <AngsuranTab anggota={anggota} />;
      case "toko": return <TokoTab anggota={anggota} />;
      case "shu": return <SHUTab anggota={anggota} />;
      case "aktivitas": return <AktivitasTab anggota={anggota} />;
    }
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/koperasi" className={className}>{children}</Link> },
              { label: anggota.nama },
            ]}
          />
          <PageHeader
            eyebrow="Detail Anggota"
            title={anggota.nama}
            description={`${anggota.noAnggota} · ${anggota.tipeAnggota} · ${anggota.status}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/koperasi" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={<Hero anggota={anggota} />}
      tabs={<Tabs items={tabItems} />}
      primary={renderTab()}
    />
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/koperasi/$noAnggota")({
  component: AnggotaDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: () => (
    <div className="py-16">
      <EmptyState
        title="Anggota tidak ditemukan"
        description="No Anggota yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar anggota."
        action={
          <Link to="/koperasi" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ),
});
