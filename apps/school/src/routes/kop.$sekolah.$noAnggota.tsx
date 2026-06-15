import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate, useParams } from "@tanstack/react-router";
import {
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  PageHeader,
  Tabs,
  IconArrowLeft,
  IconCalendar,
  IconChart,
  IconHome,
  IconId,
  IconWallet,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import { TransaksiModal, type TransaksiJenis } from "../components/koperasi-simpanan/transaksiForm";
import { AkadCreateModal } from "../components/koperasi-pembiayaan/akadForm";
import { PembayaranAngsuranModal } from "../components/koperasi-pembiayaan/pembayaranForm";
import { selectPrimaryRekening } from "../lib/koperasi/memberActions";
import {
  buildMemberViewModel,
  resolvePersonName,
  type AkadRow,
  type AnggotaDoc,
  type ItemShuRow,
  type MemberViewModel,
  type NasabahDoc,
  type ProdukRow,
  type RekeningRow,
  type TransaksiSimpananRow,
} from "../lib/koperasi/memberDetail";
import {
  Hero,
  PinjamanTab,
  ProfilTab,
  RingkasanTab,
  ShuTab,
  SimpananTab,
  TAB_KEYS,
  type MemberActions,
  type TabKey,
} from "../components/koperasi-anggota/MemberTabs";

const TAB_META: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: <IconHome /> },
  { key: "profil", label: "Profil", icon: <IconId /> },
  { key: "simpanan", label: "Simpanan", icon: <IconWallet /> },
  { key: "pinjaman", label: "Pinjaman", icon: <IconChart /> },
  { key: "shu", label: "SHU", icon: <IconCalendar /> },
];

const VALID_TABS = new Set<TabKey>(TAB_KEYS);

/** Pure presentational view — built view-model in, no data fetching, so tests
 *  can mount it directly (mirrors NasabahListView). */
export function AnggotaDetailView({
  vm,
  sekolah,
  tab,
  onTab,
  onBack,
  actions,
}: {
  vm: MemberViewModel;
  sekolah: string;
  tab: TabKey;
  onTab: (next: TabKey) => void;
  onBack: () => void;
  actions: MemberActions;
}) {
  const counts: Partial<Record<TabKey, number>> = {
    simpanan: vm.simpanan.length,
    pinjaman: vm.pinjaman.length,
    shu: vm.shu.length,
  };
  const tabItems: TabItem[] = TAB_META.map((t) => ({
    key: t.key,
    label: t.label,
    icon: t.icon,
    count: counts[t.key],
    active: tab === t.key,
    render: ({ className, children }) => (
      <button type="button" onClick={() => onTab(t.key)} className={className}>
        {children}
      </button>
    ),
  }));
  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: vm.nama },
            ]}
          />
          <PageHeader
            eyebrow="Detail Anggota"
            title={vm.nama}
            description={`${vm.noAnggota} · ${vm.tipeAnggota} · ${vm.status}`}
            actions={
              <Button variant="outline" onClick={onBack}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={<Hero vm={vm} actions={actions} />}
      tabs={<Tabs items={tabItems} />}
      primary={
        tab === "ringkasan" ? <RingkasanTab vm={vm} actions={actions} /> :
        tab === "profil" ? <ProfilTab vm={vm} /> :
        tab === "simpanan" ? <SimpananTab vm={vm} actions={actions} /> :
        tab === "pinjaman" ? <PinjamanTab vm={vm} actions={actions} /> :
        <ShuTab vm={vm} />
      }
    />
  );
}

const REKENING_FIELDS = ["name", "nomor_rekening", "produk_simpanan", "status", "saldo", "tanggal_buka"];
const TRANSAKSI_FIELDS = ["name", "rekening_simpanan", "jenis", "jumlah", "tanggal", "keterangan", "approval_status"];
const AKAD_FIELDS = ["name", "nomor_akad", "jumlah_pokok", "margin_total", "total_kewajiban", "tenor", "tanggal_akad", "tanggal_jatuh_tempo", "status"];
const SHU_FIELDS = ["name", "anggota", "jasa_anggota", "jasa_modal", "total_shu"];

function AnggotaDetailPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const { noAnggota } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const docQ = useResourceDoc<AnggotaDoc>("Anggota Koperasi", noAnggota);
  const nasabahId = docQ.data?.nasabah;
  const nasabahQ = useResourceDoc<NasabahDoc>("Nasabah", nasabahId ?? "", { enabled: Boolean(nasabahId) });
  const pihakTipe = nasabahQ.data?.pihak_tipe;
  const pihak = nasabahQ.data?.pihak;
  const personQ = useResourceDoc<Record<string, unknown>>(pihakTipe ?? "", pihak ?? "", {
    enabled: Boolean(pihakTipe && pihak),
  });
  const rekeningQ = useResourceList<RekeningRow>(
    "Rekening Simpanan",
    { fields: REKENING_FIELDS, filters: [["nasabah", "=", nasabahId ?? ""]], limit_page_length: 50 },
    { enabled: Boolean(nasabahId) },
  );
  const rekening = rekeningQ.data ?? [];
  const rekeningNames = rekening.map((r) => r.name);
  const produkQ = useResourceList<ProdukRow>("Produk Simpanan", { fields: ["name", "jenis"], limit_page_length: 200 });
  const transaksiQ = useResourceList<TransaksiSimpananRow>(
    "Transaksi Simpanan",
    { fields: TRANSAKSI_FIELDS, filters: [["rekening_simpanan", "in", rekeningNames]], order_by: "tanggal desc", limit_page_length: 50 },
    { enabled: rekeningNames.length > 0 },
  );
  const akadQ = useResourceList<AkadRow>(
    "Akad Pembiayaan",
    { fields: AKAD_FIELDS, filters: [["nasabah", "=", nasabahId ?? ""]] },
    { enabled: Boolean(nasabahId) },
  );
  const shuQ = useResourceList<ItemShuRow>(
    "Item SHU Anggota",
    { parent: "Pembagian SHU", fields: SHU_FIELDS, filters: [["anggota", "=", docQ.data?.name ?? ""]], limit_page_length: 50 },
    { enabled: Boolean(docQ.data?.name) },
  );

  const [txJenis, setTxJenis] = useState<TransaksiJenis | null>(null);
  const [akadOpen, setAkadOpen] = useState(false);
  const [bayarOpen, setBayarOpen] = useState(false);

  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/kop/$sekolah/$noAnggota", params: { sekolah, noAnggota }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  // Gate on the live Anggota Koperasi doc — only a genuinely absent / foreign
  // member 404s. Never block on a mock fixture (the old 404 bug).
  if (docQ.isError) throw notFound();
  if (docQ.isPending || !docQ.data) {
    return <div className="py-16 text-center text-sm text-muted-fg">Memuat data anggota…</div>;
  }

  const vm = buildMemberViewModel({
    doc: docQ.data,
    nasabah: nasabahQ.data,
    personName: resolvePersonName(personQ.data),
    rekening,
    produk: produkQ.data ?? [],
    transaksi: transaksiQ.data ?? [],
    akad: akadQ.data ?? [],
    shuItems: shuQ.data ?? [],
  });
  const primaryRekening = selectPrimaryRekening(rekening);
  const actions: MemberActions = {
    hasActiveRekening: rekening.some((r) => r.status === "Aktif"),
    onSetor: () => setTxJenis("Setoran"),
    onTarik: () => setTxJenis("Penarikan"),
    onPinjaman: () => setAkadOpen(true),
    onAngsuran: () => setBayarOpen(true),
    onEdit: () => {
      if (vm.nasabahId) navigate({ to: "/kop/$sekolah/nasabah/$name", params: { sekolah, name: vm.nasabahId } });
    },
  };

  return (
    <>
      <AnggotaDetailView
        vm={vm}
        sekolah={sekolah}
        tab={tab}
        onTab={setTab}
        onBack={() => navigate({ to: "/kop/$sekolah", params: { sekolah } })}
        actions={actions}
      />
      {txJenis !== null ? (
        <TransaksiModal
          open
          onClose={() => setTxJenis(null)}
          {...(primaryRekening ? { rekening: primaryRekening } : {})}
          defaultJenis={txJenis}
          onSuccess={() => setTxJenis(null)}
        />
      ) : null}
      <AkadCreateModal
        open={akadOpen}
        onClose={() => setAkadOpen(false)}
        {...(nasabahId ? { nasabah: nasabahId } : {})}
        onSuccess={() => setAkadOpen(false)}
      />
      <PembayaranAngsuranModal
        open={bayarOpen}
        onClose={() => setBayarOpen(false)}
        onSuccess={() => setBayarOpen(false)}
      />
    </>
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/kop/$sekolah/$noAnggota")({
  component: AnggotaDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: function NotFound() {
    const { sekolah } = useParams({ from: "/kop/$sekolah" });
    return (
      <div className="py-16">
        <EmptyState
          title="Anggota tidak ditemukan"
          description="No Anggota yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar anggota."
          action={
            <Link to="/kop/$sekolah" params={{ sekolah }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  },
});
