/**
 * MejaPersetujuanPesan — Kepsek approval desk for official broadcasts (embedded in the
 * oversight panel). Lists Pesan Broadcast awaiting sign-off and approves/rejects via the
 * native `apply_workflow` engine — the same stack as MejaPersetujuanKelas. On "Setujui"
 * the BE controller fans the broadcast out to the Outbox; nothing official leaves
 * unreviewed (no direct Draf→Disetujui path).
 */
import { useState } from "react";
import { Badge, Button, EmptyState, SectionCard } from "@sekolahpro/ui";
import { RejectModal } from "@sekolahpro/ui/components/RejectModal";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceList, useFrappeMutation } from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import {
  PESAN_WORKFLOW_STATE,
  deriveBroadcastGate,
  pesanStateBadgeTone,
  type PesanWorkflowState,
} from "../../lib/pesanApproval";

const BROADCAST_DOCTYPE = "Pesan Broadcast";
const ACTION_SETUJUI = "Setujui";
const ACTION_TOLAK = "Tolak";
const FIELDS = ["name", "judul", "isi", "audiens_type", "total_penerima", "channel", "workflow_state"];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

interface BroadcastRow {
  name: string;
  judul?: string;
  isi?: string;
  audiens_type?: string;
  total_penerima?: number;
  channel?: string;
  workflow_state?: string;
}

export function MejaPersetujuanPesan() {
  const qc = useQueryClient();
  const roles = useSession().roles ?? [];

  const queue = useResourceList<BroadcastRow>(BROADCAST_DOCTYPE, {
    fields: FIELDS,
    filters: [["workflow_state", "=", PESAN_WORKFLOW_STATE.MENUNGGU_KEPSEK]],
    order_by: "modified asc",
    limit_page_length: 0,
  });
  const items = queue.data ?? [];

  const [selectedName, setSelectedName] = useState<string | undefined>();
  const selected = items.find((b) => b.name === selectedName) ?? items[0];
  const [rejectOpen, setRejectOpen] = useState(false);

  const apply = useFrappeMutation<{ doctype: string; docname: string; action: string }>(
    "frappe.model.workflow.apply_workflow",
  );
  const gate = deriveBroadcastGate(
    (selected?.workflow_state as PesanWorkflowState) ?? PESAN_WORKFLOW_STATE.MENUNGGU_KEPSEK,
    roles,
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["resource:list", BROADCAST_DOCTYPE] });
    setSelectedName(undefined);
  };

  const approve = async () => {
    if (!selected) return;
    await apply.mutateAsync({ doctype: BROADCAST_DOCTYPE, docname: selected.name, action: ACTION_SETUJUI });
    invalidate();
  };

  const reject = async () => {
    if (!selected) return;
    await apply.mutateAsync({ doctype: BROADCAST_DOCTYPE, docname: selected.name, action: ACTION_TOLAK });
    setRejectOpen(false);
    invalidate();
  };

  return (
    <SectionCard
      title="Persetujuan Pengumuman"
      description="Pengumuman resmi yang menunggu persetujuan Anda sebelum dikirim."
    >
      {queue.isLoading ? (
        <p className="p-4 text-sm text-muted-fg">Memuat...</p>
      ) : items.length === 0 ? (
        <EmptyState title="Tidak ada antrean" description="Tidak ada pengumuman yang menunggu persetujuan." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <ul className="lg:col-span-2 divide-y divide-border rounded-lg border border-border">
            {items.map((b) => {
              const active = b.name === selected?.name;
              return (
                <li key={b.name}>
                  <button
                    onClick={() => setSelectedName(b.name)}
                    className={
                      (active ? "bg-brand/5 border-l-2 border-l-brand " : "border-l-2 border-l-transparent hover:bg-muted/40 ") +
                      "w-full text-left px-3 py-2.5"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-fg text-sm truncate flex-1">{b.judul ?? b.name}</span>
                      <Badge tone={pesanStateBadgeTone((b.workflow_state as PesanWorkflowState) ?? PESAN_WORKFLOW_STATE.MENUNGGU_KEPSEK)} dot>
                        {b.total_penerima ?? 0}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-fg truncate">{stripHtml(b.isi ?? "")}</p>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="lg:col-span-3 rounded-lg border border-border p-4">
            {selected ? (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-fg">{selected.judul ?? selected.name}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-muted-fg">
                  <span className="rounded bg-muted px-2 py-0.5">Audiens: {selected.audiens_type ?? "—"}</span>
                  <span className="rounded bg-muted px-2 py-0.5">{selected.total_penerima ?? 0} penerima</span>
                  <span className="rounded bg-muted px-2 py-0.5">Kanal: {selected.channel ?? "—"}</span>
                </div>
                <p className="text-sm text-fg whitespace-pre-wrap">{stripHtml(selected.isi ?? "")}</p>
                {gate.showApprovalBar && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button onClick={approve} disabled={!gate.canApprove || apply.isPending}>
                      {apply.isPending ? "Memproses..." : "Setujui & Kirim"}
                    </Button>
                    <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={!gate.canApprove || apply.isPending}>
                      Tolak
                    </Button>
                    {gate.blockReason ? <span className="text-xs text-muted-fg">{gate.blockReason}</span> : null}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState title="Pilih pengumuman" description="Pilih pengumuman untuk meninjau." />
            )}
          </div>
        </div>
      )}

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={reject}
        entityName="Pengumuman"
        pending={apply.isPending}
      />
    </SectionCard>
  );
}
