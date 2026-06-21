import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
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
import { WorkflowStepper } from "@sekolahpro/ui/components/WorkflowStepper";
import { ApprovalBar } from "@sekolahpro/ui/components/ApprovalBar";
import { RejectModal } from "@sekolahpro/ui/components/RejectModal";
import { AuditTrailTimeline, type AuditEntry } from "@sekolahpro/ui/components/AuditTrailTimeline";
import { type WorkflowState } from "../lib/mutasiConstants";
import {
  canViewAudit,
  deriveApprovalGate,
  deriveApprovalSteps,
  stateBadgeTone,
} from "../lib/kelasApproval";

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

function MutasiDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { id } = useParams({ from: "/sch/$sekolah/siswa/mutasi/$id" });
  const _navigate = useNavigate();
  const qc = useQueryClient();
  const docQuery = useResourceDoc<MutasiDoc>("Mutasi Siswa", id);

  const roles = useSessionStore((s) => s.roles);

  const apply = useFrappeMutation<{
    doctype: string;
    docname: string;
    action: string;
  }>("frappe.model.workflow.apply_workflow");
  // Atomic reject + reason in one server call (replaces the old apply_workflow +
  // separate insert-comment, which lost the reason if the 2nd call failed).
  const reject = useFrappeMutation<{ name: string; alasan: string }>(
    "sekolahpro.siswa.api.detail.tolak_mutasi",
  );

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
    await reject.mutateAsync({ name: doc.name, alasan: reason });
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

  const gate = deriveApprovalGate(state, roles);

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
        <WorkflowStepper steps={deriveApprovalSteps(state, "Disetujui")} />
      </SectionCard>

      <SectionCard
        title="Data Mutasi"
        action={
          gate.isLocked ? (
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
          showRestricted={canViewAudit(roles)}
          defaultOpen={false}
        />
      </SectionCard>

      {gate.showApprovalBar ? (
        <ApprovalBar
          approveLabel={gate.approveLabel}
          canApprove={gate.canApprove}
          blockReason={gate.blockReason}
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
        pending={reject.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/mutasi/$id")({ component: MutasiDetailPage });
