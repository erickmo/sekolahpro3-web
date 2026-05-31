import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { frappeFetch, useFrappeMutation, useResourceDoc } from "@sekolahpro/api-client";
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

interface MutasiDoc {
  name: string;
  siswa: string;
  jenis_mutasi: string;
  tanggal_efektif: string;
  rombel_tujuan?: string;
  sekolah_tujuan?: string;
  alasan?: string;
  workflow_state: WorkflowState;
  modified?: string;
  owner?: string;
  audit_log?: AuditEntry[];
}

const ROLE_KATU = new Set(["Kepala Tata Usaha", "System Manager"]);
const ROLE_KEPSEK = new Set(["Kepala Sekolah", "System Manager"]);
const ROLE_AUDIT_VIEW = new Set(["Kepala Sekolah", "Bimbingan Konseling", "System Manager"]);

function deriveSteps(state: WorkflowState): WorkflowStep[] {
  // Maps current workflow state to visual stepper segments.
  const base: { key: string; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "katu", label: "Approval Ka-TU" },
    { key: "kepsek", label: "Approval Kepsek" },
    { key: "done", label: "Disetujui" },
  ];
  return base.map((s) => {
    if (state === "Rejected") {
      return { ...s, status: s.key === "draft" ? "done" : "rejected" };
    }
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

function MutasiDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { id } = useParams({ from: "/sch/$sekolah/siswa/mutasi/$id" });
  const _navigate = useNavigate();
  const qc = useQueryClient();
  const docQuery = useResourceDoc<MutasiDoc>("Mutasi Siswa", id);

  const roles = useSessionStore((s) => s.roles);
  const currentUser = useSessionStore((s) => s.user);
  const isKatu = useMemo(() => roles.some((r) => ROLE_KATU.has(r)), [roles]);
  const isKepsek = useMemo(() => roles.some((r) => ROLE_KEPSEK.has(r)), [roles]);
  const canViewAudit = useMemo(() => roles.some((r) => ROLE_AUDIT_VIEW.has(r)), [roles]);

  const apply = useFrappeMutation<{
    doctype: string;
    docname: string;
    action: string;
  }>("frappe.model.workflow.apply_workflow");

  const [rejectOpen, setRejectOpen] = useState(false);

  const doc = docQuery.data;
  const state: WorkflowState = (doc?.workflow_state as WorkflowState) ?? "Draft";

  async function runAction(action: string) {
    if (!doc) return;
    await apply.mutateAsync({ doctype: "Mutasi Siswa", docname: doc.name, action });
    qc.invalidateQueries({ queryKey: ["resource:doc", "Mutasi Siswa", doc.name] });
  }

  async function handleReject(reason: string, _notify: boolean) {
    if (!doc) return;
    await apply.mutateAsync({
      doctype: "Mutasi Siswa",
      docname: doc.name,
      action: "Reject",
    });
    // Add comment with rejection reason via frappe.client.insert_comment (best-effort)
    // TODO move to dedicated reject endpoint that bundles action + reason atomically.
    try {
      await frappeFetch("frappe.client.insert", {
        doc: {
          doctype: "Comment",
          comment_type: "Workflow",
          reference_doctype: "Mutasi Siswa",
          reference_name: doc.name,
          comment_email: currentUser ?? "system",
          content: `Penolakan: ${reason}`,
        },
      });
    } catch (_) {
      // log via audit later
    }
    setRejectOpen(false);
    qc.invalidateQueries({ queryKey: ["resource:doc", "Mutasi Siswa", doc.name] });
  }

  if (docQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-fg">Memuat mutasi…</div>;
  }
  if (docQuery.isError || !doc) {
    return (
      <div className="p-6">
        <Badge tone="danger">Gagal memuat mutasi: {(docQuery.error as Error)?.message ?? "tidak ditemukan"}</Badge>
        <div className="mt-4">
          <Link to="/sch/$sekolah/siswa/mutasi" params={{ sekolah }} className="text-brand hover:underline">
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
        <Link to="/sch/$sekolah/siswa/mutasi" params={{ sekolah }} className="text-brand hover:underline">
          ← Siswa › Mutasi
        </Link>
        <span>›</span>
        <span className="font-mono">{doc.name}</span>
      </div>
      <PageHeader
        eyebrow="Mutasi Siswa"
        title={`${doc.jenis_mutasi} — ${doc.siswa}`}
        description={`Status workflow: ${state}`}
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
        title="Data Mutasi"
        action={
          isLocked ? (
            <Badge tone="neutral">Terkunci — menunggu approval</Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => runAction("Submit")}
              disabled={apply.isPending}
            >
              Submit ke Ka-TU
            </Button>
          )
        }
      >
        <InfoGrid cols={3}>
          <InfoField label="Siswa" value={doc.siswa} />
          <InfoField label="Jenis Mutasi" value={doc.jenis_mutasi} />
          <InfoField label="Tanggal Efektif" value={doc.tanggal_efektif} />
          {doc.rombel_tujuan ? <InfoField label="Rombel Tujuan" value={doc.rombel_tujuan} /> : null}
          {doc.sekolah_tujuan ? <InfoField label="Sekolah Tujuan" value={doc.sekolah_tujuan} /> : null}
        </InfoGrid>
        {doc.alasan ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Alasan</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{doc.alasan}</p>
          </div>
        ) : null}
      </SectionCard>

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
        entityName="Mutasi Siswa"
        pending={apply.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/mutasi/$id")({ component: MutasiDetailPage });
