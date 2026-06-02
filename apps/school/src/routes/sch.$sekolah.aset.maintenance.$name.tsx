import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  FormField,
  InfoField,
  InfoGrid,
  Input,
  Modal,
  PageHeader,
  RejectModal,
  SectionCard,
  Select,
  Textarea,
  IconArrowLeft,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { maintenanceStatusTone, prioritasTone, formatRupiah } from "../lib/aset/badges";
import { useAsetRole } from "../lib/aset/role";
import {
  useJadwalkanMaintenance,
  useMulaiMaintenance,
  useSelesaiMaintenance,
  useBatalkanMaintenance,
} from "../lib/aset/api";

const DOCTYPE = "Permintaan Maintenance Aset";
const KONDISI_OPTIONS = ["", "Baik", "Rusak Ringan", "Rusak Berat"];
const todayIso = () => new Date().toISOString().slice(0, 10);

interface Doc {
  name: string;
  aset?: string;
  nama_aset?: string;
  pelapor?: string;
  tanggal_lapor?: string;
  prioritas?: string;
  jenis?: string;
  status?: string;
  deskripsi_masalah?: string;
  teknisi?: string;
  tanggal_jadwal?: string;
  tanggal_selesai?: string;
  biaya?: number;
  tindakan?: string;
}

function MaintenanceDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/aset/maintenance/$name" });
  const qc = useQueryClient();
  const role = useAsetRole();
  const docQ = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = docQ.data;

  const [jadwalOpen, setJadwalOpen] = useState(false);
  const [jadwalDate, setJadwalDate] = useState(todayIso());
  const [jadwalTeknisi, setJadwalTeknisi] = useState("");
  const [selesaiOpen, setSelesaiOpen] = useState(false);
  const [biaya, setBiaya] = useState("");
  const [tindakan, setTindakan] = useState("");
  const [kondisiBaru, setKondisiBaru] = useState("");
  const [batalOpen, setBatalOpen] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const jadwalkan = useJadwalkanMaintenance();
  const mulai = useMulaiMaintenance();
  const selesai = useSelesaiMaintenance();
  const batalkan = useBatalkanMaintenance();
  const pending = jadwalkan.isPending || mulai.isPending || selesai.isPending || batalkan.isPending;

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE] });
    await qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
    await qc.invalidateQueries({ queryKey: ["resource:list", "Aset"] });
  };
  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setActionErr(null);
    try {
      await fn();
      await refresh();
      after?.();
    } catch (e) {
      setActionErr((e as Error)?.message ?? "Aksi gagal.");
    }
  };

  const status = doc?.status;
  const canManage = role.canApprove;
  const bisaJadwal = status === "Dilaporkan";
  const bisaMulai = status === "Dilaporkan" || status === "Dijadwalkan";
  const bisaSelesai = status === "Dikerjakan";
  const bisaBatal = status && !["Selesai", "Dibatalkan"].includes(status);

  return (
    <div className="space-y-6">
      <Link to="/sch/$sekolah/aset/maintenance" params={{ sekolah }} className="inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-fg">
        <span className="h-4 w-4"><IconArrowLeft /></span>
        Kembali ke daftar
      </Link>

      <PageHeader
        eyebrow="Maintenance Aset"
        title={doc?.nama_aset ?? doc?.aset ?? name}
        description={`Tiket ${name}`}
        actions={doc ? <Badge tone={maintenanceStatusTone(status)} dot>{status ?? "—"}</Badge> : null}
      />

      {actionErr ? <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{actionErr}</div> : null}

      {docQ.isLoading ? (
        <div className="text-sm text-muted-fg">Memuat...</div>
      ) : docQ.isError || !doc ? (
        <div className="text-sm text-rose-600">Gagal memuat tiket.</div>
      ) : (
        <>
          <SectionCard title="Detail Tiket">
            <InfoGrid cols={3}>
              <InfoField label="Aset" value={doc.nama_aset ?? doc.aset} />
              <InfoField label="Pelapor" value={doc.pelapor} />
              <InfoField label="Tanggal Lapor" value={doc.tanggal_lapor} />
              <InfoField label="Prioritas" value={<Badge tone={prioritasTone(doc.prioritas)} dot>{doc.prioritas ?? "—"}</Badge>} />
              <InfoField label="Jenis" value={doc.jenis} />
              <InfoField label="Teknisi" value={doc.teknisi} />
              <InfoField label="Tanggal Jadwal" value={doc.tanggal_jadwal} />
              <InfoField label="Tanggal Selesai" value={doc.tanggal_selesai} />
              <InfoField label="Biaya" value={formatRupiah(doc.biaya)} />
              <InfoField label="Deskripsi Masalah" value={doc.deskripsi_masalah} className="sm:col-span-3" />
              {doc.tindakan ? <InfoField label="Tindakan" value={doc.tindakan} className="sm:col-span-3" /> : null}
            </InfoGrid>
          </SectionCard>

          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {bisaJadwal ? <Button variant="outline" onClick={() => setJadwalOpen(true)} disabled={pending}>Jadwalkan</Button> : null}
              {bisaMulai ? <Button onClick={() => { if (window.confirm("Mulai kerjakan? Aset akan dikunci (Maintenance).")) void run(() => mulai.mutateAsync({ name })); }} disabled={pending}>Mulai Kerjakan</Button> : null}
              {bisaSelesai ? <Button onClick={() => setSelesaiOpen(true)} disabled={pending}>Selesaikan</Button> : null}
              {bisaBatal ? <Button variant="outline" onClick={() => setBatalOpen(true)} disabled={pending}>Batalkan</Button> : null}
            </div>
          ) : (
            <div className="text-sm text-muted-fg">Aksi maintenance hanya untuk manajer aset.</div>
          )}
        </>
      )}

      {/* Jadwalkan modal */}
      <Modal
        open={jadwalOpen}
        onClose={() => setJadwalOpen(false)}
        title="Jadwalkan Maintenance"
        size="md"
        tone="brand"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setJadwalOpen(false)}>Batal</Button>
            <Button onClick={() => void run(() => jadwalkan.mutateAsync({ name, tanggal_jadwal: jadwalDate, ...(jadwalTeknisi ? { teknisi: jadwalTeknisi } : {}) }), () => setJadwalOpen(false))} disabled={pending}>Simpan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Tanggal Dijadwalkan"><Input type="date" value={jadwalDate} onChange={(e) => setJadwalDate(e.target.value)} /></FormField>
          <FormField label="Teknisi / Vendor"><Input value={jadwalTeknisi} onChange={(e) => setJadwalTeknisi(e.target.value)} placeholder="CV Sarana" /></FormField>
        </div>
      </Modal>

      {/* Selesai modal */}
      <Modal
        open={selesaiOpen}
        onClose={() => setSelesaiOpen(false)}
        title="Selesaikan Maintenance"
        description="Aset akan dilepas kembali ke Tersedia."
        size="md"
        tone="brand"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelesaiOpen(false)}>Batal</Button>
            <Button onClick={() => void run(() => selesai.mutateAsync({ name, ...(biaya ? { biaya: Number(biaya) } : {}), ...(tindakan ? { tindakan } : {}), ...(kondisiBaru ? { kondisi_baru: kondisiBaru } : {}) }), () => setSelesaiOpen(false))} disabled={pending}>Selesaikan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Biaya (Rp)"><Input type="number" min={0} value={biaya} onChange={(e) => setBiaya(e.target.value)} placeholder="150000" /></FormField>
          <FormField label="Tindakan Dilakukan"><Textarea value={tindakan} onChange={(e) => setTindakan(e.target.value)} rows={2} /></FormField>
          <FormField label="Kondisi Aset Setelah Servis" hint="Kosongkan bila tidak berubah">
            <Select value={kondisiBaru} onChange={(e) => setKondisiBaru(e.target.value)}>
              {KONDISI_OPTIONS.map((o) => <option key={o} value={o}>{o || "— tidak diubah —"}</option>)}
            </Select>
          </FormField>
        </div>
      </Modal>

      <RejectModal
        open={batalOpen}
        onClose={() => setBatalOpen(false)}
        onSubmit={(reason) => void run(() => batalkan.mutateAsync({ name, alasan: reason }), () => setBatalOpen(false))}
        entityName="Tiket Maintenance"
        minLength={5}
        pending={batalkan.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/maintenance/$name")({ component: MaintenanceDetailPage });
