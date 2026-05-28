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

type WorkflowState = "Draft" | "Pending Ka-TU" | "Pending Kepsek" | "Approved" | "Rejected";

interface PerubahanDoc {
  name: string;
  siswa: string;
  field_diubah: string;
  nilai_lama?: string;
  nilai_baru: string;
  alasan: string;
  lampiran_url?: string;
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
    { key: "done", label: "Diterapkan" },
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

function PerubahanDetailPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const { id } = useParams({ from: "/$sekolah/siswa/perubahan-data/$id" });
  const qc = useQueryClient();
  const docQuery = useResourceDoc<PerubahanDoc>("Perubahan Data Siswa", id);

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
    await apply.mutateAsync({ doctype: "Perubahan Data Siswa", docname: doc.name, action });
    qc.invalidateQueries({ queryKey: ["resource:doc", "Perubahan Data Siswa", doc.name] });
  }

  async function handleReject(reason: string, _notify: boolean) {
    if (!doc) return;
    await apply.mutateAsync({
      doctype: "Perubahan Data Siswa",
      docname: doc.name,
      action: "Reject",
    });
    try {
      await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc: {
            doctype: "Comment",
            comment_type: "Workflow",
            reference_doctype: "Perubahan Data Siswa",
            reference_name: doc.name,
            comment_email: currentUser ?? "system",
            content: `Penolakan: ${reason}`,
          },
        }),
      });
    } catch (_) {}
    setRejectOpen(false);
    qc.invalidateQueries({ queryKey: ["resource:doc", "Perubahan Data Siswa", doc.name] });
  }

  if (docQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-fg">Memuat perubahan data…</div>;
  }
  if (docQuery.isError || !doc) {
    return (
      <div className="p-6">
        <Badge tone="danger">
          Gagal memuat: {(docQuery.error as Error)?.message ?? "tidak ditemukan"}
        </Badge>
        <div className="mt-4">
          <Link to="/$sekolah/siswa/perubahan-data" params={{ sekolah }} className="text-brand hover:underline">
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
        <Link to="/$sekolah/siswa/perubahan-data" params={{ sekolah }} className="text-brand hover:underline">
          ← Siswa › Perubahan Data
        </Link>
        <span>›</span>
        <span className="font-mono">{doc.name}</span>
      </div>

      <PageHeader
        eyebrow="Perubahan Data Siswa"
        title={`${doc.field_diubah} — ${doc.siswa}`}
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
        title="Diff Data"
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-fg">
              Sebelum
            </div>
            <div className="font-mono text-sm text-muted-fg line-through">
              {doc.nilai_lama || "—"}
            </div>
          </div>
          <div className="rounded-lg border-2 border-brand bg-brand/5 p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-brand">
              Sesudah
            </div>
            <div className="font-mono text-sm font-semibold text-fg">{doc.nilai_baru}</div>
          </div>
        </div>
        <div className="mt-4">
          <InfoGrid cols={2}>
            <InfoField label="Field" value={<code className="font-mono">{doc.field_diubah}</code>} />
            <InfoField label="Siswa" value={doc.siswa} />
          </InfoGrid>
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Alasan</div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{doc.alasan}</p>
        </div>
        {doc.lampiran_url ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Lampiran</div>
            <a
              href={doc.lampiran_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand hover:underline"
            >
              📎 Buka lampiran
            </a>
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
          hint={`Setelah disetujui, field ${doc.field_diubah} di Siswa akan diperbarui otomatis.`}
        />
      ) : null}

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
        entityName="Perubahan Data"
        pending={apply.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/perubahan-data/$id")({ component: PerubahanDetailPage });
