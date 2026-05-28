import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  FormField,
  Input,
  InfoField,
  InfoGrid,
  Modal,
  SectionCard,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
import { DetailShell, ErrorState, LoadingState, formatTanggal } from "../components/koperasi-kartu/shared";

type Kartu = {
  name: string;
  uid_rfid: string;
  anggota: string;
  status: string;
  tanggal_terbit: string;
  tanggal_kedaluwarsa?: string;
};

const STATUS_TONE: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Aktif: "success",
  Blokir: "danger",
  Hilang: "warning",
  Kedaluwarsa: "neutral",
};

function KartuDetail() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useResourceDoc<Kartu>("Kartu", name);
  const update = useResourceUpdate<Kartu>("Kartu");
  const createKartu = useResourceCreate<{ name: string }>("Kartu");

  const [replaceOpen, setReplaceOpen] = useState(false);
  const [newUid, setNewUid] = useState("");

  const setStatus = (next: string) => {
    update.mutate(
      { name, patch: { status: next } },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: ["resource:doc", "Kartu", name] });
          void qc.invalidateQueries({ queryKey: ["resource:list", "Kartu"] });
        },
      },
    );
  };

  const handleReplace = () => {
    if (!q.data || !newUid.trim()) return;
    update.mutate(
      { name, patch: { status: "Kedaluwarsa" } },
      {
        onSuccess: () => {
          const payload: Record<string, unknown> = {
            uid_rfid: newUid.trim(),
            anggota: q.data!.anggota,
            tanggal_terbit: new Date().toISOString().slice(0, 10),
            status: "Aktif",
          };
          createKartu.mutate(payload, {
            onSuccess: (doc) => {
              void qc.invalidateQueries({ queryKey: ["resource:list", "Kartu"] });
              setReplaceOpen(false);
              setNewUid("");
              navigate({ to: "/koperasi/kartu/$name", params: { name: doc.name } });
            },
          });
        },
      },
    );
  };

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState error={q.error} />;
  const k = q.data;

  return (
    <DetailShell
      eyebrow="Detail Kartu"
      title={k.name}
      description={`UID ${k.uid_rfid} · Anggota ${k.anggota}`}
      backTo="/koperasi/kartu"
      backLabel="Kembali ke daftar"
      crumbParentLabel="Kartu RFID"
      crumbParentTo="/koperasi/kartu"
      hero={
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-fg truncate">{k.name}</h2>
                <Badge tone={STATUS_TONE[k.status] ?? "neutral"} dot>{k.status}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted-fg">
                <span className="font-mono">{k.uid_rfid}</span>
                <span className="mx-2">·</span>
                <span>Anggota {k.anggota}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={update.isPending || k.status === "Aktif"} onClick={() => setStatus("Aktif")}>Aktivasi</Button>
              <Button variant="outline" size="sm" disabled={update.isPending || k.status === "Blokir"} onClick={() => setStatus("Blokir")}>Blokir</Button>
              <Button variant="outline" size="sm" disabled={update.isPending || k.status === "Hilang"} onClick={() => setStatus("Hilang")}>Tandai Hilang</Button>
              <Button size="sm" onClick={() => setReplaceOpen(true)}>Ganti Kartu</Button>
            </div>
          </div>
        </div>
      }
    >
      <SectionCard title="Informasi Kartu">
        <InfoGrid cols={2}>
          <InfoField label="No. Kartu" value={<span className="font-mono">{k.name}</span>} />
          <InfoField label="UID RFID" value={<span className="font-mono">{k.uid_rfid}</span>} />
          <InfoField label="Anggota" value={k.anggota} />
          <InfoField label="Status" value={<Badge tone={STATUS_TONE[k.status] ?? "neutral"} dot>{k.status}</Badge>} />
          <InfoField label="Tanggal Terbit" value={formatTanggal(k.tanggal_terbit)} />
          <InfoField label="Kedaluwarsa" value={formatTanggal(k.tanggal_kedaluwarsa)} />
        </InfoGrid>
      </SectionCard>

      <Modal
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title="Ganti Kartu"
        description="Terbitkan kartu baru untuk anggota yang sama. Kartu lama akan ditandai kedaluwarsa."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setReplaceOpen(false)}>Batal</Button>
            <Button type="button" disabled={!newUid.trim() || update.isPending || createKartu.isPending} onClick={handleReplace}>
              {update.isPending || createKartu.isPending ? "Memproses..." : "Ganti"}
            </Button>
          </>
        }
      >
        <FormField label="UID RFID Baru" required>
          <Input value={newUid} onChange={(e) => setNewUid(e.target.value)} />
        </FormField>
      </Modal>
    </DetailShell>
  );
}

export const Route = createFileRoute("/koperasi/kartu/$name")({ component: KartuDetail });
