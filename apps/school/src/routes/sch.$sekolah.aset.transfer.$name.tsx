import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  IconArrowLeft,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useSelesaikanTransfer } from "../lib/aset/api";
import { useAsetRole } from "../lib/aset/role";

const DOCTYPE = "Transfer Aset";

interface Doc {
  name: string;
  aset?: string;
  nama_aset?: string;
  lokasi_asal?: string;
  lokasi_tujuan?: string;
  jumlah?: number;
  tanggal?: string;
  petugas?: string;
  alasan?: string;
  status?: string;
}

function TransferDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/aset/transfer/$name" });
  const qc = useQueryClient();
  const role = useAsetRole();
  const docQ = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = docQ.data;
  const selesaikan = useSelesaikanTransfer();
  const [err, setErr] = useState<string | null>(null);

  const onSelesaikan = async () => {
    if (!window.confirm("Selesaikan transfer? Lokasi aset akan dipindah ke tujuan.")) return;
    setErr(null);
    try {
      await selesaikan.mutateAsync({ name });
      await qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Aset"] });
    } catch (e) {
      setErr((e as Error)?.message ?? "Aksi gagal.");
    }
  };

  const bisaSelesai = doc?.status === "Draft" && role.canApprove;

  return (
    <div className="space-y-6">
      <Link to="/sch/$sekolah/aset/transfer" params={{ sekolah }} className="inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-fg">
        <span className="h-4 w-4"><IconArrowLeft /></span>
        Kembali ke daftar
      </Link>

      <PageHeader
        eyebrow="Transfer Aset"
        title={doc?.nama_aset ?? doc?.aset ?? name}
        description={`Transfer ${name}`}
        actions={doc ? <Badge tone={doc.status === "Selesai" ? "success" : "warning"} dot>{doc.status ?? "—"}</Badge> : null}
      />

      {err ? <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</div> : null}

      {docQ.isLoading ? (
        <div className="text-sm text-muted-fg">Memuat...</div>
      ) : docQ.isError || !doc ? (
        <div className="text-sm text-rose-600">Gagal memuat transfer.</div>
      ) : (
        <>
          <SectionCard title="Detail Transfer">
            <InfoGrid cols={3}>
              <InfoField label="Aset" value={doc.nama_aset ?? doc.aset} />
              <InfoField label="Lokasi Asal" value={doc.lokasi_asal} />
              <InfoField label="Lokasi Tujuan" value={doc.lokasi_tujuan} />
              <InfoField label="Jumlah" value={doc.jumlah} />
              <InfoField label="Tanggal" value={doc.tanggal} />
              <InfoField label="Petugas" value={doc.petugas} />
              <InfoField label="Alasan" value={doc.alasan} className="sm:col-span-3" />
            </InfoGrid>
          </SectionCard>

          {bisaSelesai ? (
            <Button onClick={onSelesaikan} disabled={selesaikan.isPending}>
              {selesaikan.isPending ? "Memproses..." : "Selesaikan Transfer"}
            </Button>
          ) : doc.status === "Draft" ? (
            <div className="text-sm text-muted-fg">Hanya manajer aset yang bisa menyelesaikan transfer.</div>
          ) : null}
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/transfer/$name")({ component: TransferDetailPage });
