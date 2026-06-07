/**
 * Meja Persetujuan Kelas — the Kepala Sekolah surface (rendered by the /kelas
 * index when primary role is `kepsek`). A two-pane approval desk: the
 * destructive-only Mutasi queue (left) and a context-rich Kartu Tinjau (right)
 * where the decision + its context live in the same pane.
 *
 * The queue is workflow_state == "Pending Kepsek", which the real workflow only
 * ever fills with Pindah Keluar / Drop Out (audit B1). Approval reuses the shared
 * gate ({@link deriveApprovalGate}) and the native `apply_workflow` engine — no
 * new endpoint, the Workflow stays authoritative.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { frappeFetch, useFrappeMutation, useResourceList } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { PageHeader } from "@sekolahpro/ui";
import { RejectModal } from "@sekolahpro/ui/components/RejectModal";
import { WORKFLOW_STATE, type WorkflowState } from "../../lib/mutasiConstants";
import { deriveApprovalGate } from "../../lib/kelasApproval";
import { computeDampak } from "../../lib/dampakStruktur";
import { AntreanKeputusan, type MutasiQueueRow } from "./AntreanKeputusan";
import { KartuTinjau } from "./KartuTinjau";

const MUTASI_DOCTYPE = "Mutasi Siswa";

export function MejaPersetujuanKelas() {
  const roles = useSessionStore((s) => s.roles);
  const currentUser = useSessionStore((s) => s.user);
  const qc = useQueryClient();

  const queue = useResourceList<MutasiQueueRow>(MUTASI_DOCTYPE, {
    fields: [
      "name",
      "siswa",
      "jenis_mutasi",
      "rombel_asal",
      "rombel_tujuan",
      "tanggal_efektif",
      "alasan",
      "workflow_state",
    ],
    filters: [["workflow_state", "=", WORKFLOW_STATE.PENDING_KEPSEK]],
    limit_page_length: 0,
  });
  const items = queue.data ?? [];

  const [selectedName, setSelectedName] = useState<string | undefined>();
  const selected = items.find((m) => m.name === selectedName);

  const apply = useFrappeMutation<{ doctype: string; docname: string; action: string }>(
    "frappe.model.workflow.apply_workflow",
  );
  const [rejectOpen, setRejectOpen] = useState(false);

  const dampak = computeDampak({
    jenis: selected?.jenis_mutasi ?? "",
    ...(selected?.rombel_tujuan ? { rombelTujuan: { name: selected.rombel_tujuan } } : {}),
  });
  const gate = deriveApprovalGate(
    (selected?.workflow_state as WorkflowState) ?? WORKFLOW_STATE.PENDING_KEPSEK,
    roles,
  );

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["resource:list", MUTASI_DOCTYPE] });
    setSelectedName(undefined);
  }

  async function approve() {
    if (!selected) return;
    await apply.mutateAsync({ doctype: MUTASI_DOCTYPE, docname: selected.name, action: "Approve" });
    invalidate();
  }

  async function handleReject(reason: string) {
    if (!selected) return;
    await apply.mutateAsync({ doctype: MUTASI_DOCTYPE, docname: selected.name, action: "Reject" });
    try {
      await frappeFetch("frappe.client.insert", {
        doc: {
          doctype: "Comment",
          comment_type: "Workflow",
          reference_doctype: MUTASI_DOCTYPE,
          reference_name: selected.name,
          comment_email: currentUser ?? "system",
          content: `Penolakan: ${reason}`,
        },
      });
    } catch (_) {
      // audit comment is best-effort; the workflow rejection already applied
    }
    setRejectOpen(false);
    invalidate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kepala Sekolah"
        title="Meja Persetujuan Kelas"
        description="Tinjau dan putuskan mutasi siswa yang membutuhkan persetujuan Anda."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AntreanKeputusan items={items} selectedName={selectedName} onSelect={setSelectedName} />
        </div>
        <div className="lg:col-span-3">
          <KartuTinjau
            mutasi={selected}
            dampak={dampak}
            gate={gate}
            onApprove={approve}
            onReject={() => setRejectOpen(true)}
            pending={apply.isPending}
          />
        </div>
      </div>

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
