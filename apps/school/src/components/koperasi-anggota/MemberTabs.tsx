/**
 * Presentational tab components for the Koperasi member-detail page.
 * Split out of the route to keep it under the 300-line file limit and to make
 * each tab independently testable. All data is the live `MemberViewModel`
 * built by lib/koperasi/memberDetail.ts — no mock fixtures.
 */
import {
  Avatar,
  Badge,
  Button,
  Column,
  DataTable,
  EmptyState,
  InfoField,
  InfoGrid,
  SectionCard,
  StatCard,
  IconCalendar,
  IconCheck,
  IconChart,
  IconEdit,
  IconId,
  IconPlus,
  IconWallet,
} from "@sekolahpro/ui";
import type {
  MemberRekeningRow,
  MemberPinjamanRow,
  MemberShuRow,
  MemberSimpananTrxRow,
  MemberViewModel,
} from "../../lib/koperasi/memberDetail";
import { formatRupiah, formatTanggal } from "../../lib/koperasi/format";

export type Tone = "success" | "brand" | "neutral" | "warning" | "danger";

export const STATUS_TONE: Record<string, Tone> = {
  Aktif: "success",
  Keluar: "danger",
  "Non-aktif": "neutral",
  Pending: "warning",
};

export const TIPE_TONE: Record<string, Tone> = {
  Anggota: "brand",
  "Calon Anggota": "warning",
  "Anggota Luar Biasa": "neutral",
};

const SIMPANAN_TIPE_TONE: Record<"Setor" | "Tarik", Tone> = {
  Setor: "success",
  Tarik: "warning",
};

const PINJAMAN_TONE: Record<string, Tone> = {
  Pengajuan: "warning",
  Disetujui: "brand",
  Berjalan: "brand",
  Lunas: "success",
  Macet: "danger",
  Ditolak: "danger",
};

const APPROVAL_TONE: Record<string, Tone> = {
  Otomatis: "success",
  Disetujui: "success",
  "Menunggu Approval": "warning",
  Ditolak: "danger",
};

const SOON_HINT = "Segera hadir.";
const NO_REKENING_HINT = "Belum ada rekening aktif — buka rekening lewat pendaftaran terpandu dulu.";

/** Action callbacks the route wires to its modals/navigation. */
export interface MemberActions {
  hasActiveRekening: boolean;
  onSetor: () => void;
  onTarik: () => void;
  onPinjaman: () => void;
  onAngsuran: () => void;
  onEdit: () => void;
}

export function Hero({ vm, actions }: { vm: MemberViewModel; actions: MemberActions }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={vm.nama} size="lg" className="!h-20 !w-20 !text-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{vm.nama}</h2>
            <Badge tone={STATUS_TONE[vm.status] ?? "neutral"} dot>{vm.status}</Badge>
            <Badge tone={TIPE_TONE[vm.tipeAnggota] ?? "neutral"}>{vm.tipeAnggota}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">{vm.noAnggota}</span>
            <span className="mx-2">·</span>
            <span>Gabung {formatTanggal(vm.tanggalGabung)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!actions.hasActiveRekening}
            {...(actions.hasActiveRekening ? {} : { title: NO_REKENING_HINT })}
            onClick={actions.onSetor}
          >
            <span className="h-4 w-4 mr-1.5"><IconWallet /></span>Setor Simpanan
          </Button>
          <Button variant="outline" size="sm" onClick={actions.onPinjaman}>
            <span className="h-4 w-4 mr-1.5"><IconChart /></span>Buat Pinjaman
          </Button>
          <Button
            size="sm"
            disabled={!vm.nasabahId}
            {...(vm.nasabahId ? {} : { title: "Nasabah tidak tertaut." })}
            onClick={actions.onEdit}
          >
            <span className="h-4 w-4 mr-1.5"><IconEdit /></span>Kelola Nasabah
          </Button>
        </div>
      </div>
    </div>
  );
}

function RingkasanStats({ vm }: { vm: MemberViewModel }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Simpanan" value={formatRupiah(vm.saldo.total)} hint={`${vm.rekening.length} rekening`} icon={<IconWallet />} accent="brand" />
      <StatCard label="Simpanan Sukarela" value={formatRupiah(vm.saldo.sukarela)} icon={<IconCheck />} accent="emerald" />
      <StatCard label="Pinjaman Aktif" value={vm.pinjamanAktif > 0 ? formatRupiah(vm.pinjamanAktif) : "—"} hint={`${vm.pinjaman.length} pinjaman`} icon={<IconChart />} accent="amber" />
      <StatCard label="Transaksi Simpanan" value={vm.simpanan.length} icon={<IconCalendar />} accent="violet" />
    </div>
  );
}

const JENIS_DESC: Record<string, string> = {
  Pokok: "Simpanan satu kali saat menjadi anggota",
  Wajib: "Akumulasi setoran bulanan",
  Sukarela: "Dapat ditarik kapan saja",
  Berjangka: "Tabungan dengan jangka waktu",
};

function BreakdownSimpanan({ vm }: { vm: MemberViewModel }) {
  const rows = [
    { jenis: "Pokok", saldo: vm.saldo.pokok },
    { jenis: "Wajib", saldo: vm.saldo.wajib },
    { jenis: "Sukarela", saldo: vm.saldo.sukarela },
    { jenis: "Berjangka", saldo: vm.saldo.berjangka },
  ];
  return (
    <SectionCard title="Breakdown Simpanan" description="Per jenis simpanan" action={<Badge tone="brand" dot>Saldo terkini</Badge>}>
      <ul className="divide-y divide-border -mx-5 -my-2">
        {rows.map((row) => (
          <li key={row.jenis} className="flex items-center gap-3 px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
              <span className="h-4 w-4"><IconWallet /></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-fg">Simpanan {row.jenis}</div>
              <div className="text-xs text-muted-fg">{JENIS_DESC[row.jenis]}</div>
            </div>
            <div className="text-sm font-semibold tabular-nums">{formatRupiah(row.saldo)}</div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function TransaksiTerbaru({ rows }: { rows: MemberSimpananTrxRow[] }) {
  return (
    <SectionCard title="Transaksi Simpanan Terbaru" padded={false}>
      <ul className="divide-y divide-border">
        {rows.slice(0, 5).map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${s.tipe === "Setor" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              <span className="h-4 w-4"><IconWallet /></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-fg">{s.jenis}</div>
              <div className="text-xs text-muted-fg">{formatTanggal(s.tanggal)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums">{formatRupiah(s.jumlah)}</div>
              <Badge tone={SIMPANAN_TIPE_TONE[s.tipe]}>{s.tipe}</Badge>
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-5 py-6 text-sm text-muted-fg text-center">Belum ada transaksi simpanan.</li>
        ) : null}
      </ul>
    </SectionCard>
  );
}

function PinjamanCard({ pinjaman }: { pinjaman: MemberPinjamanRow[] }) {
  const aktif = pinjaman.find((p) => p.status === "Berjalan" || p.status === "Disetujui");
  return (
    <SectionCard title="Pinjaman Aktif" padded={false}>
      {aktif ? (
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-fg">{aktif.id}</div>
            <Badge tone={PINJAMAN_TONE[aktif.status] ?? "neutral"} dot>{aktif.status}</Badge>
          </div>
          <div className="text-xs text-muted-fg">Akad {formatTanggal(aktif.tanggal)} · Tenor {aktif.tenor} bln</div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Pair label="Pokok" value={formatRupiah(aktif.jumlah)} />
            <Pair label="Sisa Pokok" value={formatRupiah(aktif.sisaPokok)} />
            <Pair label="Angsuran/bln" value={formatRupiah(aktif.angsuran)} />
            <Pair label="Jatuh Tempo" value={formatTanggal(aktif.jatuhTempo)} />
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 text-sm text-muted-fg text-center">Tidak ada pinjaman aktif.</div>
      )}
    </SectionCard>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-fg">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ShuCard({ shu }: { shu: MemberShuRow[] }) {
  const last = shu[0];
  return (
    <SectionCard title="SHU Terakhir" padded={false}>
      {last ? (
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-fg">Jasa Anggota {formatRupiah(last.jasaAnggota)}</div>
            <Badge tone="success">Diterima</Badge>
          </div>
          <div className="text-xs text-muted-fg">Jasa Modal {formatRupiah(last.jasaModal)}</div>
          <div className="pt-2">
            <div className="text-xs text-muted-fg">Total Diterima</div>
            <div className="text-lg font-semibold tabular-nums text-fg">{formatRupiah(last.totalShu)}</div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 text-sm text-muted-fg text-center">Belum ada SHU.</div>
      )}
    </SectionCard>
  );
}

function AksiCepat({ actions }: { actions: MemberActions }) {
  return (
    <SectionCard title="Aksi Cepat">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" disabled={!actions.hasActiveRekening} {...(actions.hasActiveRekening ? {} : { title: NO_REKENING_HINT })} onClick={actions.onSetor}>
          <span className="text-xs">Setor Simpanan</span>
        </Button>
        <Button variant="outline" size="sm" disabled={!actions.hasActiveRekening} {...(actions.hasActiveRekening ? {} : { title: NO_REKENING_HINT })} onClick={actions.onTarik}>
          <span className="text-xs">Tarik Simpanan</span>
        </Button>
        <Button variant="outline" size="sm" onClick={actions.onAngsuran}>
          <span className="text-xs">Bayar Angsuran</span>
        </Button>
        <Button variant="outline" size="sm" disabled title={SOON_HINT}>
          <span className="text-xs">Cetak Buku</span>
        </Button>
      </div>
    </SectionCard>
  );
}

export function RingkasanTab({ vm, actions }: { vm: MemberViewModel; actions: MemberActions }) {
  return (
    <>
      <RingkasanStats vm={vm} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <BreakdownSimpanan vm={vm} />
          <TransaksiTerbaru rows={vm.simpanan} />
        </div>
        <div className="space-y-6">
          <PinjamanCard pinjaman={vm.pinjaman} />
          <ShuCard shu={vm.shu} />
          <AksiCepat actions={actions} />
        </div>
      </div>
    </>
  );
}

export function ProfilTab({ vm }: { vm: MemberViewModel }) {
  return (
    <SectionCard title="Identitas">
      <InfoGrid cols={3}>
        <InfoField label="No Anggota" icon={<IconId />} value={<span className="tabular-nums">{vm.noAnggota}</span>} />
        <InfoField label="Nama" value={vm.nama} />
        <InfoField label="Tipe Anggota" value={<Badge tone={TIPE_TONE[vm.tipeAnggota] ?? "neutral"}>{vm.tipeAnggota}</Badge>} />
        <InfoField label="Status" value={<Badge tone={STATUS_TONE[vm.status] ?? "neutral"} dot>{vm.status}</Badge>} />
        <InfoField label="Tanggal Gabung" icon={<IconCalendar />} value={formatTanggal(vm.tanggalGabung)} />
        <InfoField label="No Nasabah" value={vm.nasabahId ?? "—"} />
      </InfoGrid>
    </SectionCard>
  );
}

const REKENING_COLS: Column<MemberRekeningRow>[] = [
  { key: "nomor", header: "No Rekening", cell: (r) => <span className="tabular-nums">{r.nomor}</span> },
  { key: "produk", header: "Produk", cell: (r) => r.produk },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis}</Badge> },
  { key: "saldo", header: "Saldo", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.saldo)}</span> },
  { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status}</Badge> },
];

const TRX_COLS: Column<MemberSimpananTrxRow>[] = [
  { key: "tgl", header: "Tanggal", cell: (r) => <span className="tabular-nums">{formatTanggal(r.tanggal)}</span> },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis}</Badge> },
  { key: "tipe", header: "Arah", cell: (r) => <Badge tone={SIMPANAN_TIPE_TONE[r.tipe]} dot>{r.tipe}</Badge> },
  { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
  { key: "approval", header: "Approval", cell: (r) => <Badge tone={APPROVAL_TONE[r.approval] ?? "neutral"}>{r.approval}</Badge> },
  { key: "ket", header: "Keterangan", cell: (r) => <span className="text-muted-fg">{r.keterangan ?? "—"}</span> },
];

export function SimpananTab({ vm, actions }: { vm: MemberViewModel; actions: MemberActions }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Simpanan Pokok" value={formatRupiah(vm.saldo.pokok)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Simpanan Wajib" value={formatRupiah(vm.saldo.wajib)} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Simpanan Sukarela" value={formatRupiah(vm.saldo.sukarela)} accent="violet" />
        <StatCard label="Simpanan Berjangka" value={formatRupiah(vm.saldo.berjangka)} accent="amber" />
      </div>
      <SectionCard title="Rekening Simpanan" padded={false}>
        {vm.rekening.length === 0 ? (
          <EmptyState title="Belum ada rekening" description="Anggota belum memiliki rekening simpanan." />
        ) : (
          <DataTable data={vm.rekening} columns={REKENING_COLS} rowKey={(r) => r.id} />
        )}
      </SectionCard>
      <SectionCard
        title="Riwayat Simpanan"
        action={
          <Button size="sm" disabled={!actions.hasActiveRekening} {...(actions.hasActiveRekening ? {} : { title: NO_REKENING_HINT })} onClick={actions.onSetor}>
            <span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Setor
          </Button>
        }
        padded={false}
      >
        {vm.simpanan.length === 0 ? (
          <EmptyState title="Belum ada transaksi" description="Belum ada transaksi simpanan tercatat." />
        ) : (
          <DataTable data={vm.simpanan} columns={TRX_COLS} rowKey={(r) => r.id} />
        )}
      </SectionCard>
    </div>
  );
}

const PINJAMAN_COLS: Column<MemberPinjamanRow>[] = [
  { key: "id", header: "Akad", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
  { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
  { key: "jml", header: "Pokok", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
  { key: "tenor", header: "Tenor", align: "right", cell: (r) => <span className="tabular-nums">{r.tenor} bln</span> },
  { key: "bunga", header: "Margin", align: "right", cell: (r) => <span className="tabular-nums">{r.bunga}%</span> },
  { key: "ang", header: "Angsuran", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.angsuran)}</span> },
  { key: "sisa", header: "Sisa Pokok", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.sisaPokok)}</span> },
  { key: "status", header: "Status", cell: (r) => <Badge tone={PINJAMAN_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> },
];

export function PinjamanTab({ vm, actions }: { vm: MemberViewModel; actions: MemberActions }) {
  return (
    <SectionCard
      title="Pinjaman"
      action={<Button size="sm" onClick={actions.onPinjaman}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Buat Pinjaman</Button>}
      padded={false}
    >
      {vm.pinjaman.length === 0 ? (
        <EmptyState title="Belum ada pinjaman" description="Anggota belum pernah mengajukan pembiayaan." />
      ) : (
        <DataTable data={vm.pinjaman} columns={PINJAMAN_COLS} rowKey={(r) => r.id} />
      )}
    </SectionCard>
  );
}

const SHU_COLS: Column<MemberShuRow>[] = [
  { key: "janggota", header: "Jasa Anggota", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jasaAnggota)}</span> },
  { key: "jmodal", header: "Jasa Modal", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jasaModal)}</span> },
  { key: "total", header: "Total SHU", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{formatRupiah(r.totalShu)}</span> },
];

export function ShuTab({ vm }: { vm: MemberViewModel }) {
  return (
    <SectionCard title="Riwayat SHU (Sisa Hasil Usaha)" description="Pembagian keuntungan tahunan" padded={false}>
      {vm.shu.length === 0 ? (
        <EmptyState title="Belum ada SHU" description="Anggota belum menerima pembagian SHU." />
      ) : (
        <DataTable data={vm.shu} columns={SHU_COLS} rowKey={(r) => r.id} />
      )}
    </SectionCard>
  );
}

export type TabKey = "ringkasan" | "profil" | "simpanan" | "pinjaman" | "shu";

export const TAB_KEYS: readonly TabKey[] = ["ringkasan", "profil", "simpanan", "pinjaman", "shu"];
