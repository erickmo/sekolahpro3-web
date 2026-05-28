import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useFrappeMutation, useResourceDoc } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import {
  Badge,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";
import { WorkflowStepper, type WorkflowStep } from "@sekolahpro/ui/components/WorkflowStepper";
import { ApprovalBar } from "@sekolahpro/ui/components/ApprovalBar";
import { RejectModal } from "@sekolahpro/ui/components/RejectModal";
import { AuditTrailTimeline, type AuditEntry } from "@sekolahpro/ui/components/AuditTrailTimeline";

type WorkflowState =
  | "Draft"
  | "Pending Ka-TU"
  | "Pending Kepsek"
  | "Approved"
  | "Rejected";

interface KelulusanDoc {
  name: string;
  siswa: string;
  tahun_ajaran: string;
  status_kelulusan: "Lulus" | "Tidak Lulus";
  no_ijazah?: string;
  no_skhun?: string;
  tanggal_pengesahan?: string;
  melanjutkan_pendidikan?: string;
  jenjang_lanjutan?: string;
  nama_pt?: string;
  catatan?: string;
  arsip_ijazah?: string;
  workflow_state: WorkflowState;
  audit_log?: AuditEntry[];
}

const ROLE_KATU = new Set(["Kepala Tata Usaha", "System Manager"]);
const ROLE_KEPSEK = new Set(["Kepala Sekolah", "System Manager"]);
const ROLE_AUDIT_VIEW = new Set(["Kepala Sekolah", "Bimbingan Konseling", "System Manager"]);

function deriveSteps(state: WorkflowState): WorkflowStep[] {
  const base = [
    { key: "draft", label: "Draft" },
    { key: "katu", label: "Approval Ka-TU" },
    { key: "kepsek", label: "Approval Kepsek" },
    { key: "done", label: "Disahkan" },
  ];
  return base.map((s) => {
    if (state === "Rejected") return { ...s, status: s.key === "draft" ? "done" : "rejected" };
    if (state === "Approved") return { ...s, status: "done" };
    if (state === "Pending Kepsek") {
      return {
        ...s,
        status:
          s.key === "draft" || s.key === "katu" ? "done" : s.key === "kepsek" ? "current" : "pending",
      };
    }
    if (state === "Pending Ka-TU") {
      return {
        ...s,
        status: s.key === "draft" ? "done" : s.key === "katu" ? "current" : "pending",
      };
    }
    return { ...s, status: s.key === "draft" ? "current" : "pending" };
  });
}

function stateBadgeTone(state: WorkflowState): "neutral" | "warning" | "success" | "danger" {
  if (state === "Approved") return "success";
  if (state === "Rejected") return "danger";
  if (state === "Draft") return "neutral";
  return "warning";
}

function KelulusanDetailPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const { id } = useParams({ from: "/$sekolah/siswa/kelulusan/$id" });
  const qc = useQueryClient();
  const docQuery = useResourceDoc<KelulusanDoc>("Kelulusan Siswa", id);

  const roles = useSessionStore((s) => s.roles);
  const currentUser = useSessionStore((s) => s.user);
  const isKatu = useMemo(() => roles.some((r) => ROLE_KATU.has(r)), [roles]);
  const isKepsek = useMemo(() => roles.some((r) => ROLE_KEPSEK.has(r)), [roles]);
  const canViewAudit = useMemo(() => roles.some((r) => ROLE_AUDIT_VIEW.has(r)), [roles]);

  const apply = useFrappeMutation<{ doctype: string; docname: string; action: string }>(
    "frappe.model.workflow.apply_workflow",
  );

  const [rejectOpen, setRejectOpen] = useState(false);

  const doc = docQuery.data;
  const state: WorkflowState = (doc?.workflow_state as WorkflowState) ?? "Draft";

  async function runAction(action: string) {
    if (!doc) return;
    await apply.mutateAsync({ doctype: "Kelulusan Siswa", docname: doc.name, action });
    qc.invalidateQueries({ queryKey: ["resource:doc", "Kelulusan Siswa", doc.name] });
  }

  async function handleReject(reason: string, _notify: boolean) {
    if (!doc) return;
    await apply.mutateAsync({ doctype: "Kelulusan Siswa", docname: doc.name, action: "Reject" });
    try {
      await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc: {
            doctype: "Comment",
            comment_type: "Workflow",
            reference_doctype: "Kelulusan Siswa",
            reference_name: doc.name,
            comment_email: currentUser ?? "system",
            content: `Penolakan: ${reason}`,
          },
        }),
      });
    } catch (_) {}
    setRejectOpen(false);
    qc.invalidateQueries({ queryKey: ["resource:doc", "Kelulusan Siswa", doc.name] });
  }

  if (docQuery.isLoading) return <div className="p-6 text-sm text-muted-fg">Memuat kelulusan…</div>;
  if (docQuery.isError || !doc) {
    return (
      <div className="p-6">
        <Badge tone="danger">
          Gagal memuat kelulusan: {(docQuery.error as Error)?.message ?? "tidak ditemukan"}
        </Badge>
        <div className="mt-4">
          <Link to="/$sekolah/siswa/kelulusan" params={{ sekolah }} className="text-brand hover:underline">
            ← Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const isLocked = state !== "Draft";
  const canApproveKatu = state === "Pending Ka-TU" && isKatu;
  const canApproveKepsek = state === "Pending Kepsek" && isKepsek;
  const canApprove = canApproveKatu || canApproveKepsek;
  const approveLabel = canApproveKepsek
    ? "Setujui sebagai Kepala Sekolah"
    : "Setujui sebagai Ka-TU";
  const blockReason = !canApprove
    ? state === "Pending Ka-TU"
      ? "Hanya Kepala Tata Usaha yang dapat menyetujui pada tahap ini."
      : state === "Pending Kepsek"
        ? "Hanya Kepala Sekolah yang dapat menyetujui pada tahap ini."
        : "Tidak ada aksi approval pada status ini."
    : undefined;

  const showApprovalBar = state === "Pending Ka-TU" || state === "Pending Kepsek";

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-2 text-xs text-muted-fg">
        <Link to="/$sekolah/siswa/kelulusan" params={{ sekolah }} className="text-brand hover:underline">
          ← Siswa › Kelulusan
        </Link>
        <span>›</span>
        <span className="font-mono">{doc.name}</span>
      </div>

      <PageHeader
        eyebrow="Kelulusan Siswa"
        title={`${doc.status_kelulusan} — ${doc.siswa}`}
        description={`TA ${doc.tahun_ajaran} · Status workflow: ${state}`}
        actions={
          <Badge tone={stateBadgeTone(state)} dot>
            {state}
          </Badge>
        }
      />

      <SectionCard title="Status Workflow">
        <WorkflowStepper steps={deriveSteps(state)} />
      </SectionCard>

      <SectionCard
        title="Data Kelulusan"
        action={
          isLocked ? (
            <Badge tone="neutral">Terkunci — menunggu approval</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => runAction("Submit")} disabled={apply.isPending}>
              Submit ke Ka-TU
            </Button>
          )
        }
      >
        <InfoGrid cols={3}>
          <InfoField label="Siswa" value={doc.siswa} />
          <InfoField label="Tahun Ajaran" value={doc.tahun_ajaran} />
          <InfoField
            label="Status"
            value={
              <Badge tone={doc.status_kelulusan === "Lulus" ? "success" : "danger"}>
                {doc.status_kelulusan}
              </Badge>
            }
          />
          {doc.no_ijazah ? <InfoField label="No. Ijazah" value={doc.no_ijazah} /> : null}
          {doc.no_skhun ? <InfoField label="No. SKHUN" value={doc.no_skhun} /> : null}
          {doc.tanggal_pengesahan ? (
            <InfoField label="Tanggal Pengesahan" value={doc.tanggal_pengesahan} />
          ) : null}
        </InfoGrid>
        {doc.catatan ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Catatan</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{doc.catatan}</p>
          </div>
        ) : null}
      </SectionCard>

      {doc.status_kelulusan === "Lulus" && doc.melanjutkan_pendidikan ? (
        <SectionCard title="Alumni Tracker">
          <InfoGrid cols={3}>
            <InfoField label="Melanjutkan Pendidikan" value={doc.melanjutkan_pendidikan} />
            {doc.jenjang_lanjutan ? (
              <InfoField label="Jenjang Lanjutan" value={doc.jenjang_lanjutan} />
            ) : null}
            {doc.nama_pt ? <InfoField label="Nama PT/Universitas" value={doc.nama_pt} /> : null}
          </InfoGrid>
        </SectionCard>
      ) : null}

      {state === "Approved" ? (
        <SectionCard title="Arsip Ijazah">
          {doc.arsip_ijazah ? (
            <div className="flex items-center gap-3">
              <Badge tone="success" dot>
                Terdaftar
              </Badge>
              <span className="font-mono text-sm">{doc.arsip_ijazah}</span>
              <Link
                to="/$sekolah/siswa/ijazah/$id"
                params={{ sekolah, id: doc.arsip_ijazah }}
                className="text-brand hover:underline text-sm"
              >
                Lihat Arsip →
              </Link>
            </div>
          ) : (
            <div className="text-sm text-muted-fg">
              Arsip Ijazah akan dibuat otomatis oleh backend on_submit. Refresh dalam beberapa detik bila belum muncul.
            </div>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="Audit Trail">
        <AuditTrailTimeline
          entries={doc.audit_log ?? []}
          showRestricted={canViewAudit}
          defaultOpen={false}
        />
      </SectionCard>

      {showApprovalBar ? (
        <ApprovalBar
          approveLabel={approveLabel}
          canApprove={canApprove}
          blockReason={blockReason}
          onApprove={() => runAction("Approve")}
          onReject={() => setRejectOpen(true)}
          pending={apply.isPending}
          hint={`Aksi ini akan mengubah status dari "${state}" sesuai role Anda.`}
        />
      ) : null}

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
        entityName="Kelulusan"
        pending={apply.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/kelulusan/$id")({ component: KelulusanDetailPage });
