import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
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
import {
  humanizeFrappeError,
  useDocMethod,
  useResourceCreate,
  useResourceDoc,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import { DetailShell, ErrorState, LoadingState, formatTanggal } from "../components/koperasi-kartu/shared";

type Kartu = {
  name: string;
  uid_nfc: string;
  tipe_kartu?: string;
  anggota: string;
  rekening_simpanan?: string;
  status: string;
  creation?: string;
  tanggal_expired?: string;
};

// Exact backend Select values (kartu.json) — lifecycle aktif|blokir|expired.
const STATUS_AKTIF = "aktif";
const STATUS_BLOKIR = "blokir";
const STATUS_EXPIRED = "expired";

const STATUS_TONE: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  aktif: "success",
  blokir: "danger",
  expired: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  blokir: "Blokir",
  expired: "Kedaluwarsa",
};

function KartuDetail() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useResourceDoc<Kartu>("Kartu", name);
  const update = useResourceUpdate<Kartu>("Kartu");
  const createKartu = useResourceCreate<{ name: string }>("Kartu");
  // Status lifecycle berjalan lewat method controller (Kartu.blokir/aktifkan)
  // — bukan PATCH manual — supaya guard failed_pin/reset ikut jalan.
  const blokirMut = useDocMethod("Kartu", "blokir");
  const aktifkanMut = useDocMethod("Kartu", "aktifkan");

  const [replaceOpen, setReplaceOpen] = useState(false);
  const [newUid, setNewUid] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const actionPending = update.isPending || blokirMut.isPending || aktifkanMut.isPending;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["resource:doc", "Kartu"] });
    void qc.invalidateQueries({ queryKey: ["resource:list", "Kartu"] });
  };

  const onActionError = (e: unknown) =>
    setActionError(humanizeFrappeError(e) ?? (e instanceof Error ? e.message : "Gagal memproses kartu"));

  const handleBlokir = () => {
    setActionError(null);
    blokirMut.mutate({ name }, { onSuccess: refresh, onError: onActionError });
  };

  const handleAktifkan = () => {
    setActionError(null);
    aktifkanMut.mutate({ name }, { onSuccess: refresh, onError: onActionError });
  };

  const handleReplace = () => {
    if (!q.data || !newUid.trim()) return;
    setActionError(null);
    // Kartu lama ditandai expired, lalu kartu baru terbit untuk anggota sama.
    update.mutate(
      { name, patch: { status: STATUS_EXPIRED } },
      {
        onError: onActionError,
        onSuccess: () => {
          const payload: Record<string, unknown> = {
            uid_nfc: newUid.trim(),
            tipe_kartu: q.data!.tipe_kartu ?? "debit",
            anggota: q.data!.anggota,
            status: STATUS_AKTIF,
          };
          if (q.data!.rekening_simpanan) payload["rekening_simpanan"] = q.data!.rekening_simpanan;
          createKartu.mutate(payload, {
            onError: onActionError,
            onSuccess: (doc) => {
              void qc.invalidateQueries({ queryKey: ["resource:list", "Kartu"] });
              setReplaceOpen(false);
              setNewUid("");
              navigate({ to: "/kop/$sekolah/kartu/$name", params: { sekolah, name: doc.name } });
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
      description={`UID ${k.uid_nfc} · Anggota ${k.anggota}`}
      backTo="/kop/$sekolah/kartu"
      backLabel="Kembali ke daftar"
      crumbParentLabel="Kartu RFID"
      crumbParentTo="/kop/$sekolah/kartu"
      hero={
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-fg truncate">{k.name}</h2>
                <Badge tone={STATUS_TONE[k.status] ?? "neutral"} dot>{STATUS_LABEL[k.status] ?? k.status}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted-fg">
                <span className="font-mono">{k.uid_nfc}</span>
                <span className="mx-2">·</span>
                <span>Anggota {k.anggota}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={actionPending || k.status === STATUS_AKTIF} onClick={handleAktifkan}>Aktivasi</Button>
              <Button variant="outline" size="sm" disabled={actionPending || k.status === STATUS_BLOKIR} onClick={handleBlokir}>Blokir</Button>
              <Button size="sm" onClick={() => setReplaceOpen(true)}>Ganti Kartu</Button>
            </div>
          </div>
          {actionError ? (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {actionError}
            </div>
          ) : null}
        </div>
      }
    >
      <SectionCard title="Informasi Kartu">
        <InfoGrid cols={2}>
          <InfoField label="No. Kartu" value={<span className="font-mono">{k.name}</span>} />
          <InfoField label="UID NFC" value={<span className="font-mono">{k.uid_nfc}</span>} />
          <InfoField label="Anggota" value={k.anggota} />
          <InfoField label="Status" value={<Badge tone={STATUS_TONE[k.status] ?? "neutral"} dot>{STATUS_LABEL[k.status] ?? k.status}</Badge>} />
          <InfoField label="Dibuat" value={formatTanggal(k.creation)} />
          <InfoField label="Kedaluwarsa" value={formatTanggal(k.tanggal_expired)} />
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
        <FormField label="UID NFC Baru" required>
          <Input value={newUid} onChange={(e) => setNewUid(e.target.value)} />
        </FormField>
      </Modal>
    </DetailShell>
  );
}

export const Route = createFileRoute("/kop/$sekolah/kartu_/$name")({ component: KartuDetail });
