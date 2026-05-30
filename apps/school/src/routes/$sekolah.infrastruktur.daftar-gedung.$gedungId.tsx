import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  Button,
  DataTable,
  DetailPageTemplate,
  EmptyState,
  IconArrowLeft,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  Tabs,
  type Column,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList, useResourceDelete } from "@sekolahpro/api-client";
import { scopedLinkProps } from "../lib/scoped";
import { LantaiFormModal } from "../components/infrastruktur/LantaiFormModal";
import { RuanganFormModal } from "../components/infrastruktur/RuanganFormModal";
import { FasilitasRuanganFormModal } from "../components/infrastruktur/FasilitasRuanganFormModal";
import { UtilitasGedungFormModal } from "../components/infrastruktur/UtilitasGedungFormModal";
import { ConfirmDeleteDialog } from "../components/infrastruktur/ConfirmDeleteDialog";
import { deleteTargetLabel, type DeleteTarget } from "../components/infrastruktur/deleteTarget";

type Gedung = { name: string; nama?: string; kode?: string; tahun_dibangun?: number; sekolah?: string };
type Lantai = { name: string; nama?: string; nomor_lantai?: number };
type Ruangan = { name: string; nama?: string; jenis_ruangan?: string; lantai?: string; kapasitas?: number; status?: string };
type Fasilitas = { name: string; parent?: string; nama_fasilitas?: string; jumlah?: number; kondisi?: string };
type Utilitas = { name: string; jenis?: string; provider?: string; nomor_pelanggan?: string; status?: string };

const LANTAI_COLS: Column<Lantai>[] = [
  { key: "nomor_lantai", header: "Nomor", align: "right", cell: (r) => r.nomor_lantai ?? "—" },
  { key: "nama", header: "Nama", cell: (r) => r.nama ?? "—" },
  { key: "name", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
];

const RUANGAN_COLS: Column<Ruangan>[] = [
  { key: "nama", header: "Nama", cell: (r) => r.nama ?? "—" },
  { key: "jenis_ruangan", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_ruangan ?? "—"}</Badge> },
  { key: "lantai", header: "Lantai", cell: (r) => r.lantai ?? "—" },
  { key: "kapasitas", header: "Kapasitas", align: "right", cell: (r) => r.kapasitas ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Tersedia" ? "success" : r.status === "Dipakai" ? "brand" : r.status === "Maintenance" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

const FASILITAS_COLS: Column<Fasilitas>[] = [
  { key: "parent", header: "Ruangan", cell: (r) => r.parent ?? "—" },
  { key: "nama_fasilitas", header: "Fasilitas", cell: (r) => r.nama_fasilitas ?? "—" },
  { key: "jumlah", header: "Jumlah", align: "right", cell: (r) => r.jumlah ?? "—" },
  { key: "kondisi", header: "Kondisi",
    cell: (r) => <Badge tone={r.kondisi === "Baik" ? "success" : r.kondisi === "Rusak" ? "danger" : "neutral"} dot>{r.kondisi ?? "—"}</Badge> },
];

const UTILITAS_COLS: Column<Utilitas>[] = [
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis ?? "—"}</Badge> },
  { key: "provider", header: "Provider", cell: (r) => r.provider ?? "—" },
  { key: "nomor_pelanggan", header: "No. Pelanggan", cell: (r) => <span className="font-mono text-xs">{r.nomor_pelanggan ?? "—"}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

const TAB_LANTAI = "lantai";
const TAB_RUANGAN = "ruangan";
const TAB_UTILITAS = "utilitas";

const emptyRows = (label: string) => (
  <div>
    <div className="font-medium text-fg">Belum ada {label}</div>
    <div className="text-xs mt-1">Data {label} untuk gedung ini akan muncul di sini.</div>
  </div>
);

/**
 * Detail Gedung — CRUD inline per tab. Menampilkan info gedung + tab Lantai /
 * Ruangan & Fasilitas / Utilitas yang ter-scope ke gedung ini. Tiap tab punya
 * aksi Tambah/Edit/Hapus via modal (reuse modal infrastruktur + ConfirmDeleteDialog).
 */
function GedungDetailPage() {
  const { sekolah, gedungId } = useParams({ from: "/$sekolah/infrastruktur/daftar-gedung/$gedungId" });
  const navigate = useNavigate();
  const [tab, setTab] = useState(TAB_LANTAI);

  const [lantaiModal, setLantaiModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [ruanganModal, setRuanganModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [fasilitasModal, setFasilitasModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [utilitasModal, setUtilitasModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [del, setDel] = useState<DeleteTarget | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  const delMut = useResourceDelete(del?.doctype ?? "Lantai");

  const gedungQ = useResourceDoc<Gedung>("Gedung", gedungId);
  const lantaiQ = useResourceList<Lantai>("Lantai", {
    fields: ["name", "nama", "nomor_lantai"],
    filters: [["gedung", "=", gedungId]],
    order_by: "nomor_lantai asc",
    limit_page_length: 0,
  });
  const ruanganQ = useResourceList<Ruangan>("Ruangan", {
    fields: ["name", "nama", "jenis_ruangan", "lantai", "kapasitas", "status"],
    filters: [["gedung", "=", gedungId]],
    order_by: "nama asc",
    limit_page_length: 0,
  });
  const utilitasQ = useResourceList<Utilitas>("Utilitas Gedung", {
    fields: ["name", "jenis", "provider", "nomor_pelanggan", "status"],
    filters: [["gedung", "=", gedungId]],
    order_by: "jenis asc",
    limit_page_length: 0,
  });

  const ruanganNames = useMemo(() => (ruanganQ.data ?? []).map((r) => r.name), [ruanganQ.data]);
  const fasilitasQ = useResourceList<Fasilitas>(
    "Fasilitas Ruangan",
    {
      fields: ["name", "parent", "nama_fasilitas", "jumlah", "kondisi"],
      filters: [
        ["parenttype", "=", "Ruangan"],
        ["parent", "in", ruanganNames],
      ],
      order_by: "parent asc",
      limit_page_length: 0,
    },
    { enabled: ruanganNames.length > 0 },
  );

  const gedung = gedungQ.data;
  const backTo = "/infrastruktur/daftar-gedung";

  const refetchAll = () =>
    Promise.all([lantaiQ.refetch(), ruanganQ.refetch(), utilitasQ.refetch(), fasilitasQ.refetch()]);

  const confirmDelete = async () => {
    if (!del) return;
    setDelErr(null);
    try {
      await delMut.mutateAsync(del.name);
      await refetchAll();
      setDel(null);
    } catch (e) {
      setDelErr((e as Error)?.message ?? "Gagal menghapus.");
    }
  };

  const actionCol = <T extends { name: string }>(onEdit: (r: T) => void, doctype: string): Column<T> => ({
    key: "aksi",
    header: "Aksi",
    cell: (r) => (
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onEdit(r)}>Edit</Button>
        <Button variant="outline" onClick={() => { setDelErr(null); setDel({ doctype, name: r.name }); }}>Hapus</Button>
      </div>
    ),
  });

  if (gedungQ.isError) {
    return (
      <div className="py-12">
        <EmptyState
          title="Gedung tidak ditemukan"
          description={(gedungQ.error as Error)?.message ?? "Gedung tidak tersedia."}
          action={
            <Link {...scopedLinkProps(sekolah, backTo)} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span>
              Kembali ke daftar gedung
            </Link>
          }
        />
      </div>
    );
  }

  const tabItems: TabItem[] = [
    { key: TAB_LANTAI, label: `Lantai (${lantaiQ.data?.length ?? 0})` },
    { key: TAB_RUANGAN, label: `Ruangan & Fasilitas (${ruanganQ.data?.length ?? 0})` },
    { key: TAB_UTILITAS, label: `Utilitas (${utilitasQ.data?.length ?? 0})` },
  ].map((t) => ({
    key: t.key,
    label: t.label,
    active: tab === t.key,
    render: ({ className, children }) => (
      <button type="button" onClick={() => setTab(t.key)} className={className}>{children}</button>
    ),
  }));

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link {...scopedLinkProps(sekolah, "/")} className={className}>{children}</Link> },
              { label: "Infrastruktur", render: ({ className, children }) => <Link {...scopedLinkProps(sekolah, "/infrastruktur")} className={className}>{children}</Link> },
              { label: "Gedung", render: ({ className, children }) => <Link {...scopedLinkProps(sekolah, backTo)} className={className}>{children}</Link> },
              { label: gedung?.nama ?? gedungId },
            ]}
          />
          <PageHeader
            eyebrow="Gedung"
            title={gedung?.nama ?? gedungId}
            {...(gedung?.kode ? { description: `Kode: ${gedung.kode}` } : {})}
            actions={
              <Button variant="outline" onClick={() => navigate(scopedLinkProps(sekolah, backTo) as never)}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      primary={
        <>
          <SectionCard title="Informasi Gedung">
            {gedungQ.isLoading ? (
              <div className="py-6 text-sm text-muted-fg">Memuat...</div>
            ) : (
              <InfoGrid cols={3}>
                <InfoField label="Nama" value={gedung?.nama ?? "—"} />
                <InfoField label="Kode" value={gedung?.kode ?? "—"} />
                <InfoField label="Tahun Dibangun" value={gedung?.tahun_dibangun ?? "—"} />
              </InfoGrid>
            )}
          </SectionCard>

          <div className="space-y-4">
            <Tabs items={tabItems} />

            {tab === TAB_LANTAI && (
              <SectionCard title="Lantai" padded={false}
                action={<Button onClick={() => setLantaiModal({ open: true })}>Tambah Lantai</Button>}>
                <DataTable<Lantai>
                  data={lantaiQ.data ?? []}
                  columns={[...LANTAI_COLS, actionCol<Lantai>((r) => setLantaiModal({ open: true, editName: r.name }), "Lantai")]}
                  rowKey={(r) => r.name}
                  empty={emptyRows("lantai")}
                />
              </SectionCard>
            )}

            {tab === TAB_RUANGAN && (
              <div className="space-y-4">
                <SectionCard title="Ruangan" padded={false}
                  action={<Button onClick={() => setRuanganModal({ open: true })}>Tambah Ruangan</Button>}>
                  <DataTable<Ruangan>
                    data={ruanganQ.data ?? []}
                    columns={[...RUANGAN_COLS, actionCol<Ruangan>((r) => setRuanganModal({ open: true, editName: r.name }), "Ruangan")]}
                    rowKey={(r) => r.name}
                    empty={emptyRows("ruangan")}
                  />
                </SectionCard>
                <SectionCard title="Fasilitas Ruangan" padded={false}
                  action={<Button onClick={() => setFasilitasModal({ open: true })}>Tambah Fasilitas</Button>}>
                  <DataTable<Fasilitas>
                    data={fasilitasQ.data ?? []}
                    columns={[...FASILITAS_COLS, actionCol<Fasilitas>((r) => setFasilitasModal({ open: true, editName: r.name }), "Fasilitas Ruangan")]}
                    rowKey={(r) => r.name}
                    empty={emptyRows("fasilitas")}
                  />
                </SectionCard>
              </div>
            )}

            {tab === TAB_UTILITAS && (
              <SectionCard title="Utilitas" padded={false}
                action={<Button onClick={() => setUtilitasModal({ open: true })}>Tambah Utilitas</Button>}>
                <DataTable<Utilitas>
                  data={utilitasQ.data ?? []}
                  columns={[...UTILITAS_COLS, actionCol<Utilitas>((r) => setUtilitasModal({ open: true, editName: r.name }), "Utilitas Gedung")]}
                  rowKey={(r) => r.name}
                  empty={emptyRows("utilitas")}
                />
              </SectionCard>
            )}
          </div>

          <LantaiFormModal
            open={lantaiModal.open}
            onClose={() => setLantaiModal({ open: false })}
            defaultGedung={gedungId}
            {...(lantaiModal.editName ? { editName: lantaiModal.editName } : {})}
            onCreated={() => { void lantaiQ.refetch(); }}
          />
          <RuanganFormModal
            open={ruanganModal.open}
            onClose={() => setRuanganModal({ open: false })}
            defaultGedung={gedungId}
            {...(ruanganModal.editName ? { editName: ruanganModal.editName } : {})}
            onCreated={() => { void ruanganQ.refetch(); }}
          />
          <FasilitasRuanganFormModal
            open={fasilitasModal.open}
            onClose={() => setFasilitasModal({ open: false })}
            defaultGedung={gedungId}
            {...(fasilitasModal.editName ? { editName: fasilitasModal.editName } : {})}
            onCreated={() => { void fasilitasQ.refetch(); }}
          />
          <UtilitasGedungFormModal
            open={utilitasModal.open}
            onClose={() => setUtilitasModal({ open: false })}
            defaultGedung={gedungId}
            {...(utilitasModal.editName ? { editName: utilitasModal.editName } : {})}
            onCreated={() => { void utilitasQ.refetch(); }}
          />
          <ConfirmDeleteDialog
            open={!!del}
            label={del ? deleteTargetLabel(del) : ""}
            error={delErr}
            pending={delMut.isPending}
            onConfirm={confirmDelete}
            onClose={() => { setDel(null); setDelErr(null); }}
          />
        </>
      }
    />
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/daftar-gedung/$gedungId")({ component: GedungDetailPage });
