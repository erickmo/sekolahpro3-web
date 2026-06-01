import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  StatCard,
  IconArrowLeft,
  IconLayers,
  IconCheck,
  IconSettings,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { asetStatusTone, kondisiTone, formatRupiah } from "../lib/aset/badges";
import { MaintenanceFormModal } from "../components/aset/MaintenanceFormModal";

const DOCTYPE = "Aset";

interface Doc {
  name: string;
  nama?: string;
  kode?: string;
  kategori?: string;
  lokasi?: string;
  merk?: string;
  nomor_seri?: string;
  tanggal_perolehan?: string;
  nilai_perolehan?: number;
  sumber_dana?: string;
  jumlah_total?: number;
  jumlah_tersedia?: number;
  kondisi?: string;
  status?: string;
  catatan?: string;
}

function AsetDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/aset/daftar/$name" });
  const docQ = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = docQ.data;
  const [lapor, setLapor] = useState(false);

  const dipinjam = Math.max(0, (doc?.jumlah_total ?? 0) - (doc?.jumlah_tersedia ?? 0));

  return (
    <div className="space-y-6">
      <Link to="/sch/$sekolah/aset/daftar" params={{ sekolah }} className="inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-fg">
        <span className="h-4 w-4"><IconArrowLeft /></span>
        Kembali ke daftar
      </Link>

      <PageHeader
        eyebrow="Aset"
        title={doc?.nama ?? name}
        description={doc?.kode ? `Kode ${doc.kode}` : name}
        actions={
          <>
            {doc ? <Badge tone={asetStatusTone(doc.status)} dot>{doc.status ?? "—"}</Badge> : null}
            <Button variant="outline" onClick={() => setLapor(true)}>
              <span className="h-4 w-4 mr-1.5"><IconSettings /></span>
              Lapor Maintenance
            </Button>
          </>
        }
      />

      {docQ.isLoading ? (
        <div className="text-sm text-muted-fg">Memuat...</div>
      ) : docQ.isError || !doc ? (
        <div className="text-sm text-rose-600">Gagal memuat aset.</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Jumlah Total" value={doc.jumlah_total ?? 0} icon={<IconLayers />} accent="brand" urgency="normal" />
            <StatCard label="Tersedia" value={doc.jumlah_tersedia ?? 0} icon={<IconCheck />} accent="emerald" urgency="normal" />
            <StatCard label="Dipinjam" value={dipinjam} icon={<IconSettings />} accent={dipinjam > 0 ? "amber" : "emerald"} urgency="normal" />
          </div>

          <SectionCard title="Informasi Aset">
            <InfoGrid cols={3}>
              <InfoField label="Nama" value={doc.nama} />
              <InfoField label="Kode" value={doc.kode} />
              <InfoField label="Kategori" value={doc.kategori} />
              <InfoField label="Lokasi" value={doc.lokasi} />
              <InfoField label="Merk" value={doc.merk} />
              <InfoField label="Nomor Seri" value={doc.nomor_seri} />
              <InfoField label="Kondisi" value={<Badge tone={kondisiTone(doc.kondisi)} dot>{doc.kondisi ?? "—"}</Badge>} />
              <InfoField label="Tanggal Perolehan" value={doc.tanggal_perolehan} />
              <InfoField label="Nilai Perolehan" value={formatRupiah(doc.nilai_perolehan)} />
              <InfoField label="Sumber Dana" value={doc.sumber_dana} />
              <InfoField label="Catatan" value={doc.catatan} className="sm:col-span-3" />
            </InfoGrid>
          </SectionCard>
        </>
      )}

      <MaintenanceFormModal open={lapor} onClose={() => setLapor(false)} presetAset={name} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/daftar/$name")({ component: AsetDetailPage });
