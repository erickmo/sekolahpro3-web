import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  RejectModal,
  SectionCard,
  IconArrowLeft,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { peminjamanStatusTone } from "../lib/aset/badges";
import { useAsetRole } from "../lib/aset/role";
import {
  useSetujuiPeminjaman,
  useTolakPeminjaman,
  useKembalikanPeminjaman,
} from "../lib/aset/api";

const DOCTYPE = "Permintaan Peminjaman Aset";

interface ItemRow {
  name?: string;
  aset?: string;
  nama_aset?: string;
  jumlah?: number;
  jumlah_dikembalikan?: number;
}

interface Doc {
  name: string;
  pemohon?: string;
  peran_pemohon?: string;
  kontak?: string;
  tanggal_pinjam?: string;
  tanggal_kembali_rencana?: string;
  tanggal_kembali_aktual?: string;
  status?: string;
  keperluan?: string;
  disetujui_oleh?: string;
  alasan_tolak?: string;
  items?: ItemRow[];
}

function PeminjamanDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/aset/peminjaman/$name" });
  const qc = useQueryClient();
  const role = useAsetRole();
  const docQ = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = docQ.data;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const setujui = useSetujuiPeminjaman();
  const tolak = useTolakPeminjaman();
  const kembalikan = useKembalikanPeminjaman();
  const pending = setujui.isPending || tolak.isPending || kembalikan.isPending;

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE] });
    await qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
    await qc.invalidateQueries({ queryKey: ["resource:list", "Aset"] });
  };

  const run = async (fn: () => Promise<unknown>) => {
    setActionErr(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionErr((e as Error)?.message ?? "Aksi gagal.");
    }
  };

  const onSetujui = () => {
    if (!window.confirm("Setujui permintaan ini? Stok aset akan dikunci.")) return;
    void run(() => setujui.mutateAsync({ name }));
  };
  const onKembalikan = () => {
    if (!window.confirm("Catat pengembalian seluruh aset?")) return;
    void run(() => kembalikan.mutateAsync({ name }));
  };
  const onTolak = (alasan: string) => {
    void run(() => tolak.mutateAsync({ name, alasan })).then(() => setRejectOpen(false));
  };

  const status = doc?.status;
  const bisaApprove = status === "Diajukan" && role.canApprove;
  const bisaKembali = status === "Dipinjam" || status === "Terlambat";

  return (
    <div className="space-y-6">
      <Link to="/sch/$sekolah/aset/peminjaman" params={{ sekolah }} className="inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-fg">
        <span className="h-4 w-4"><IconArrowLeft /></span>
        Kembali ke daftar
      </Link>

      <PageHeader
        eyebrow="Peminjaman Aset"
        title={doc?.pemohon ?? name}
        description={`Permintaan ${name}`}
        actions={doc ? <Badge tone={peminjamanStatusTone(status)} dot>{status ?? "—"}</Badge> : null}
      />

      {actionErr ? <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{actionErr}</div> : null}

      {docQ.isLoading ? (
        <div className="text-sm text-muted-fg">Memuat...</div>
      ) : docQ.isError || !doc ? (
        <div className="text-sm text-rose-600">Gagal memuat permintaan.</div>
      ) : (
        <>
          <SectionCard title="Detail Permintaan">
            <InfoGrid cols={3}>
              <InfoField label="Pemohon" value={doc.pemohon} />
              <InfoField label="Peran" value={doc.peran_pemohon} />
              <InfoField label="Kontak" value={doc.kontak} />
              <InfoField label="Tanggal Pinjam" value={doc.tanggal_pinjam} />
              <InfoField label="Kembali (Rencana)" value={doc.tanggal_kembali_rencana} />
              <InfoField label="Kembali (Aktual)" value={doc.tanggal_kembali_aktual} />
              <InfoField label="Disetujui Oleh" value={doc.disetujui_oleh} />
              <InfoField label="Keperluan" value={doc.keperluan} className="sm:col-span-2" />
              {doc.alasan_tolak ? <InfoField label="Alasan Ditolak" value={doc.alasan_tolak} className="sm:col-span-3" /> : null}
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Aset Dipinjam" description={`${doc.items?.length ?? 0} baris`} padded={false}>
            <ul className="divide-y divide-border">
              {(doc.items ?? []).map((it, i) => (
                <li key={it.name ?? i} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-fg truncate">{it.nama_aset ?? it.aset}</div>
                    <div className="text-xs text-muted-fg font-mono">{it.aset}</div>
                  </div>
                  <Badge tone="neutral">{it.jumlah ?? 0} unit</Badge>
                  {(it.jumlah_dikembalikan ?? 0) > 0 ? (
                    <Badge tone="success" dot>{it.jumlah_dikembalikan} dikembalikan</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </SectionCard>

          {(bisaApprove || bisaKembali) ? (
            <div className="flex items-center gap-2">
              {bisaApprove ? (
                <>
                  <Button onClick={onSetujui} disabled={pending}>Setujui</Button>
                  <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={pending}>Tolak</Button>
                </>
              ) : null}
              {bisaKembali ? (
                <Button onClick={onKembalikan} disabled={pending}>Catat Pengembalian</Button>
              ) : null}
            </div>
          ) : status === "Diajukan" && !role.canApprove ? (
            <div className="text-sm text-muted-fg">Menunggu persetujuan manajer aset.</div>
          ) : null}
        </>
      )}

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={(reason) => onTolak(reason)}
        entityName="Permintaan Peminjaman"
        minLength={5}
        pending={tolak.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/peminjaman/$name")({ component: PeminjamanDetailPage });
