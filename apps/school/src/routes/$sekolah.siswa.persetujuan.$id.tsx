import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useFrappeMutation, useResourceDoc } from "@sekolahpro/api-client";
import {
  Badge,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  Textarea,
} from "@sekolahpro/ui";

type ConsentStatus = "Granted" | "Withdrawn" | "Expired" | "Pending";
type Purpose = "Publikasi Foto" | "Data Dapodik" | "Sharing Mitra" | "Medis Darurat";

interface ConsentDoc {
  name: string;
  siswa: string;
  wali: string;
  purpose: Purpose;
  status: ConsentStatus;
  granted_at?: string;
  granted_method?: string;
  expires_at?: string;
  withdrawn_at?: string;
  withdrawn_reason?: string;
  catatan?: string;
}

const STATUS_TONE: Record<ConsentStatus, "success" | "danger" | "warning" | "neutral"> = {
  Granted: "success",
  Withdrawn: "danger",
  Expired: "warning",
  Pending: "neutral",
};

function ConsentDetailPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const { id } = useParams({ from: "/$sekolah/siswa/persetujuan/$id" });
  const qc = useQueryClient();
  const docQuery = useResourceDoc<ConsentDoc>("Persetujuan Wali", id);

  const cabut = useFrappeMutation<{ name: string; reason: string }>(
    "sekolahpro.siswa.persetujuan_wali.cabut_persetujuan",
  );

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (docQuery.isLoading) return <div className="p-6 text-sm text-muted-fg">Memuat consent…</div>;
  if (docQuery.isError || !docQuery.data) {
    return (
      <div className="p-6">
        <Badge tone="danger">
          Gagal memuat: {(docQuery.error as Error)?.message ?? "tidak ditemukan"}
        </Badge>
        <div className="mt-4">
          <Link to="/$sekolah/siswa/persetujuan" params={{ sekolah }} className="text-brand hover:underline">
            ← Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const doc = docQuery.data;
  const canWithdraw = doc.status === "Granted";

  async function handleWithdraw() {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await cabut.mutateAsync({ name: doc.name, reason: reason.trim() });
      qc.invalidateQueries({ queryKey: ["resource:doc", "Persetujuan Wali", doc.name] });
      setWithdrawOpen(false);
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 text-xs text-muted-fg">
        <Link to="/$sekolah/siswa/persetujuan" params={{ sekolah }} className="text-brand hover:underline">
          ← Siswa › Persetujuan Wali
        </Link>
        <span>›</span>
        <span className="font-mono">{doc.name}</span>
      </div>

      <PageHeader
        eyebrow="Persetujuan Wali (UU PDP)"
        title={`${doc.purpose} — ${doc.siswa}`}
        description={`Diberikan oleh ${doc.wali}`}
        actions={
          <Badge tone={STATUS_TONE[doc.status]} dot>
            {doc.status}
          </Badge>
        }
      />

      <SectionCard title="Detail Consent">
        <InfoGrid cols={3}>
          <InfoField label="Siswa" value={doc.siswa} />
          <InfoField label="Wali" value={doc.wali} />
          <InfoField label="Tujuan" value={doc.purpose} />
          {doc.granted_at ? <InfoField label="Diberikan Pada" value={doc.granted_at} /> : null}
          {doc.granted_method ? (
            <InfoField label="Cara Pemberian" value={doc.granted_method} />
          ) : null}
          {doc.expires_at ? <InfoField label="Berlaku Sampai" value={doc.expires_at} /> : null}
        </InfoGrid>
        {doc.catatan ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Catatan</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{doc.catatan}</p>
          </div>
        ) : null}
      </SectionCard>

      {doc.status === "Withdrawn" ? (
        <SectionCard title="Pencabutan">
          <InfoGrid cols={2}>
            {doc.withdrawn_at ? <InfoField label="Dicabut Pada" value={doc.withdrawn_at} /> : null}
          </InfoGrid>
          {doc.withdrawn_reason ? (
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">
                Alasan Pencabutan
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{doc.withdrawn_reason}</p>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {canWithdraw ? (
        <SectionCard
          title="Cabut Persetujuan"
          action={<Badge tone="danger">Right to Withdraw</Badge>}
        >
          <p className="mb-3 text-xs text-muted-fg">
            UU PDP — wali berhak mencabut persetujuan kapan saja. Pencabutan akan langsung berlaku;
            sekolah berkomitmen menghentikan pemrosesan dalam 7×24 jam.
          </p>
          {!withdrawOpen ? (
            <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
              Cabut Persetujuan
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Alasan pencabutan (wajib)…"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={busy}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleWithdraw}
                  disabled={!reason.trim() || busy}
                >
                  {busy ? "Memproses…" : "Konfirmasi Cabut"}
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/persetujuan/$id")({ component: ConsentDetailPage });
