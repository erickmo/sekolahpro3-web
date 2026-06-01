/**
 * Raport detail / status-workflow page.
 *
 * Loads one Raport document and exposes the status lifecycle transitions
 * (Draft → Review → Final → Locked/Tercetak, with Revise) by calling the
 * whitelisted backend wrappers. The available actions per status mirror the
 * guards in sekolahpro/akademik/doctype/raport/raport.py exactly, so a button
 * is only shown when the backend would accept it (lock/revise stay role-gated
 * on the backend — shown here for framing, enforced there).
 *
 * Closes AKA-01 (row → detail) and AKA-03 (status workflow UI).
 */
import { useState } from "react";
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  Skeleton,
} from "@sekolahpro/ui";
import { useResourceDoc, frappeFetch } from "@sekolahpro/api-client";

interface RaportMapelRow {
  mata_pelajaran?: string;
  nilai_akhir?: number;
  predikat?: string;
}
interface RaportDoc {
  name: string;
  siswa?: string;
  semester?: string;
  tahun_ajaran?: string;
  status?: string;
  mapel?: RaportMapelRow[];
}

const METHOD_BASE = "sekolahpro.akademik.doctype.raport.raport";
const METHODS = {
  finalkan: `${METHOD_BASE}.finalkan_raport`,
  lock: `${METHOD_BASE}.lock_raport_action`,
  cetak: `${METHOD_BASE}.cetak_raport`,
  revise: `${METHOD_BASE}.revise_raport_action`,
  reset: `${METHOD_BASE}.reset_raport_ke_draft`,
} as const;

/** A single status-transition action shown as a button. */
export interface RaportAction {
  key: string;
  label: string;
  method: string;
  variant: "default" | "outline" | "ghost";
  needsAlasan?: boolean;
}

const FINALKAN: RaportAction = { key: "finalkan", label: "Finalkan", method: METHODS.finalkan, variant: "default" };
const LOCK: RaportAction = { key: "lock", label: "Kunci (TTD Kepala Sekolah)", method: METHODS.lock, variant: "default" };
const CETAK: RaportAction = { key: "cetak", label: "Tandai Tercetak", method: METHODS.cetak, variant: "outline" };
const REVISE: RaportAction = { key: "revise", label: "Revisi", method: METHODS.revise, variant: "outline", needsAlasan: true };
const RESET: RaportAction = { key: "reset", label: "Reset ke Draft", method: METHODS.reset, variant: "ghost" };

/**
 * Status → available transition actions, mirroring the backend guards:
 * finalkan(Draft|Review), lock(Review|Submitted|Final), cetak(Final|Locked),
 * revise(Locked), reset(any except Draft|Locked|Tercetak).
 */
export function availableRaportActions(status: string | undefined): RaportAction[] {
  switch (status) {
    case "Draft":
      return [FINALKAN];
    case "Review":
      return [FINALKAN, LOCK, RESET];
    case "Submitted":
      return [LOCK, RESET];
    case "Final":
      return [CETAK, LOCK, RESET];
    case "Locked":
      return [REVISE, CETAK];
    case "Revised":
      return [RESET];
    default:
      return [];
  }
}

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "brand"> = {
  Draft: "neutral",
  Review: "warning",
  Submitted: "warning",
  Final: "success",
  Locked: "brand",
  Revised: "warning",
  Tercetak: "success",
};

function RaportDetailPage() {
  const { sekolah, id } = useParams({ from: "/sch/$sekolah/akademik/raport/$id" });
  const qc = useQueryClient();
  const docQuery = useResourceDoc<RaportDoc>("Raport", id);
  const [alasan, setAlasan] = useState("");
  const [reviseOpen, setReviseOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = useMutation<{ status?: string }, Error, { method: string; args: Record<string, unknown> }>({
    mutationFn: ({ method, args }) => frappeFetch<{ status?: string }>(method, args),
  });

  const runAction = async (a: RaportAction, extra: Record<string, unknown> = {}) => {
    setError(null);
    try {
      await action.mutateAsync({ method: a.method, args: { raport: id, ...extra } });
      await qc.invalidateQueries({ queryKey: ["resource:doc", "Raport"] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Raport"] });
      await docQuery.refetch();
      setReviseOpen(false);
      setAlasan("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aksi gagal.");
    }
  };

  if (docQuery.isLoading) return <Skeleton className="h-48 w-full" />;
  const doc = docQuery.data;
  if (docQuery.isError || !doc) {
    return (
      <Alert tone="danger" title="Gagal memuat raport">
        Dokumen raport tidak ditemukan.{" "}
        <Link to="/sch/$sekolah/akademik/raport" params={{ sekolah }} className="underline">
          Kembali ke daftar
        </Link>
      </Alert>
    );
  }

  const actions = availableRaportActions(doc.status);
  // Frappe PDF endpoint using the "Raport Siswa" print format. Same base URL the
  // api-client is configured with (empty = same origin in dev). (AKA-02)
  const pdfBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
  const pdfUrl =
    `${pdfBase}/api/method/frappe.utils.print_format.download_pdf` +
    `?doctype=Raport&name=${encodeURIComponent(id)}` +
    `&format=${encodeURIComponent("Raport Siswa")}&no_letterhead=1`;

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Akademik", render: ({ className, children }) => (
            <Link to="/sch/$sekolah/akademik" params={{ sekolah }} className={className}>{children}</Link>
          ) },
          { label: "Raport", render: ({ className, children }) => (
            <Link to="/sch/$sekolah/akademik/raport" params={{ sekolah }} className={className}>{children}</Link>
          ) },
          { label: doc.name },
        ]}
      />
      <PageHeader
        eyebrow="Akademik · Raport"
        title={doc.siswa ?? doc.name}
        description={`${doc.semester ?? "—"} · ${doc.tahun_ajaran ?? "—"}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[doc.status ?? ""] ?? "neutral"}>{doc.status ?? "—"}</Badge>
            <Button variant="outline" onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}>
              Cetak PDF
            </Button>
          </div>
        }
      />

      <SectionCard title="Ringkasan" description="Detail dokumen raport.">
        <InfoGrid>
          <InfoField label="Siswa" value={doc.siswa ?? "—"} />
          <InfoField label="Semester" value={doc.semester ?? "—"} />
          <InfoField label="Tahun Ajaran" value={doc.tahun_ajaran ?? "—"} />
          <InfoField label="Status" value={doc.status ?? "—"} />
          <InfoField label="Jumlah Mapel" value={String(doc.mapel?.length ?? 0)} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Alur Status" description="Pindahkan raport ke tahap berikutnya. Aksi mengikuti status saat ini.">
        {error ? (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        ) : null}
        {actions.length === 0 ? (
          <p className="text-sm text-muted-fg">Tidak ada transisi status dari status <strong>{doc.status}</strong>.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) =>
              a.needsAlasan ? (
                <Button key={a.key} variant={a.variant} disabled={action.isPending} onClick={() => setReviseOpen((v) => !v)}>
                  {a.label}
                </Button>
              ) : (
                <Button key={a.key} variant={a.variant} disabled={action.isPending} onClick={() => void runAction(a)}>
                  {a.label}
                </Button>
              ),
            )}
          </div>
        )}
        {reviseOpen ? (
          <div className="mt-3 space-y-2">
            <textarea
              aria-label="Alasan revisi"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Alasan revisi (wajib, masuk audit trail)…"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              rows={2}
            />
            <Button
              variant="default"
              disabled={action.isPending || alasan.trim() === ""}
              onClick={() => void runAction(REVISE, { alasan: alasan.trim() })}
            >
              {action.isPending ? "Memproses…" : "Kirim Revisi"}
            </Button>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/raport/$id")({ component: RaportDetailPage });
