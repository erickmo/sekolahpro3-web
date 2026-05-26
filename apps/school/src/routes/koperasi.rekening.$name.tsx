import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  StatCard,
  IconArrowLeft,
  IconWallet,
  IconCalendar,
  IconCheck,
  IconClock,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import {
  PermohonanModal,
  type PermohonanKind,
} from "../components/koperasi-simpanan/permohonanForms";
import { TransaksiModal } from "../components/koperasi-simpanan/transaksiForm";

interface RekeningDoc {
  name: string;
  anggota?: string;
  produk?: string;
  akad?: string;
  saldo?: number;
  status?: string;
  tanggal_buka?: string;
  saldo_tertahan?: number;
  catatan?: string;
}

interface TransaksiRow {
  name: string;
  rekening_simpanan: string;
  jenis: string;
  jumlah: number;
  tanggal: string;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Aktif: "success",
  Dormant: "warning",
  Blokir: "danger",
  Tutup: "neutral",
};

const JENIS_TONE: Record<string, "success" | "warning" | "brand" | "neutral"> = {
  Setor: "success",
  Tarik: "warning",
  Transfer: "brand",
  "Bagi Hasil": "success",
  Koreksi: "neutral",
};

const formatRupiah = (n: number | undefined) =>
  n === undefined ? "—" : `Rp ${n.toLocaleString("id-ID")}`;

function RekeningDetailPage() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const doc = useResourceDoc<RekeningDoc>("Rekening Simpanan", name);
  const tx = useResourceList<TransaksiRow>("Transaksi Simpanan", {
    fields: ["name", "rekening_simpanan", "jenis", "jumlah", "tanggal"],
    filters: [["rekening_simpanan", "=", name]],
    order_by: "`tanggal` desc",
    limit_page_length: 50,
  });

  const [permohonan, setPermohonan] = useState<PermohonanKind | null>(null);
  const [txOpen, setTxOpen] = useState(false);

  const r = doc.data;
  const status = r?.status ?? "—";

  // Workflow buttons depend on current status (graceful: show all when unknown)
  const canTutup = !r || (status !== "Tutup");
  const canBlokir = !r || (status === "Aktif" || status === "Dormant");
  const canUnblokir = !r || status === "Blokir";
  const canAktivasi = !r || status === "Dormant";

  const afterPermohonan = () => {
    qc.invalidateQueries({ queryKey: ["resource:doc", "Rekening Simpanan", name] });
  };

  return (
    <>
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/koperasi" className={className}>{children}</Link> },
              { label: "Rekening Simpanan", render: ({ className, children }) => <Link to="/koperasi/rekening" className={className}>{children}</Link> },
              { label: name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Rekening"
            title={name}
            description={r ? `${r.anggota ?? "—"} · ${r.produk ?? "—"} · ${r.akad ?? "—"}` : "Memuat..."}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/koperasi/rekening" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali
              </Button>
            }
          />
        </div>
      }
      primary={
        <div className="space-y-6">
          {doc.isError ? (
            <SectionCard title="Gagal memuat">
              <EmptyState
                title="Rekening tidak ditemukan"
                description={(doc.error as Error)?.message ?? "Periksa nomor rekening."}
              />
            </SectionCard>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Saldo"
              value={formatRupiah(r?.saldo)}
              accent="brand"
              icon={<IconWallet />}
            />
            <StatCard
              label="Saldo Tertahan"
              value={formatRupiah(r?.saldo_tertahan ?? 0)}
              accent="amber"
              icon={<IconClock />}
            />
            <StatCard
              label="Status"
              value={status}
              accent={status === "Aktif" ? "emerald" : status === "Blokir" ? "rose" : "violet"}
              icon={<IconCheck />}
            />
            <StatCard
              label="Dibuka"
              value={r?.tanggal_buka ?? "—"}
              accent="brand"
              icon={<IconCalendar />}
            />
          </div>

          <SectionCard
            title="Informasi Rekening"
            action={r?.status ? <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> : null}
          >
            <InfoGrid cols={3}>
              <InfoField label="No. Rekening" value={<span className="font-mono">{name}</span>} />
              <InfoField label="Anggota" value={r?.anggota ?? "—"} />
              <InfoField label="Produk" value={r?.produk ?? "—"} />
              <InfoField label="Akad" value={r?.akad ?? "—"} />
              <InfoField label="Tanggal Buka" value={r?.tanggal_buka ?? "—"} />
              <InfoField label="Saldo" value={formatRupiah(r?.saldo)} />
              {r?.catatan ? (
                <InfoField label="Catatan" value={r.catatan} className="sm:col-span-3" />
              ) : null}
            </InfoGrid>
          </SectionCard>

          <SectionCard
            title="Aksi Workflow"
            description="Permohonan akan masuk ke alur persetujuan."
          >
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTxOpen(true)}>
                <span className="h-4 w-4 mr-1.5"><IconWallet /></span>
                Transaksi Baru
              </Button>
              {canTutup ? (
                <Button variant="outline" onClick={() => setPermohonan("tutup")}>
                  Tutup Rekening
                </Button>
              ) : null}
              {canBlokir ? (
                <Button variant="outline" onClick={() => setPermohonan("blokir")}>
                  Blokir
                </Button>
              ) : null}
              {canUnblokir ? (
                <Button variant="outline" onClick={() => setPermohonan("unblokir")}>
                  Buka Blokir
                </Button>
              ) : null}
              {canAktivasi ? (
                <Button variant="outline" onClick={() => setPermohonan("dormant")}>
                  Aktivasi Dormant
                </Button>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Riwayat Transaksi"
            description={`${tx.data?.length ?? 0} transaksi terbaru`}
            padded={false}
          >
            {tx.isLoading ? (
              <div className="px-5 py-8 text-center text-sm text-muted-fg">Memuat...</div>
            ) : (tx.data?.length ?? 0) === 0 ? (
              <EmptyState title="Belum ada transaksi" description="Catat transaksi pertama untuk rekening ini." />
            ) : (
              <ul className="divide-y divide-border">
                {(tx.data ?? []).map((t) => (
                  <li key={t.name} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone={JENIS_TONE[t.jenis] ?? "neutral"}>{t.jenis}</Badge>
                        <span className="font-mono text-xs text-muted-fg">{t.name}</span>
                      </div>
                      <div className="text-xs text-muted-fg mt-1">{t.tanggal}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{formatRupiah(t.jumlah)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      }
    />
      {permohonan ? (
        <PermohonanModal
          kind={permohonan}
          open={!!permohonan}
          onClose={() => setPermohonan(null)}
          rekening={name}
          {...(r?.anggota ? { anggota: r.anggota } : {})}
          onSuccess={afterPermohonan}
        />
      ) : null}
      <TransaksiModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        rekening={name}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["resource:list", "Transaksi Simpanan"] });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/koperasi/rekening/$name")({
  component: RekeningDetailPage,
});
