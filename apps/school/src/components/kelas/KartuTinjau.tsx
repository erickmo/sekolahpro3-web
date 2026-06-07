/**
 * KartuTinjau — the right pane of the Kepsek "Meja Persetujuan". Shows the full
 * decision context for the selected Mutasi (student, source→target rombel,
 * reason) plus the advisory Dampak Struktur preview, with the ApprovalBar in the
 * SAME pane so the headmaster never "approves blind". Presentational: the
 * container owns the workflow mutation.
 */
import {
  SectionCard,
  InfoField,
  InfoGrid,
  Badge,
} from "@sekolahpro/ui";
import { ApprovalBar } from "@sekolahpro/ui/components/ApprovalBar";
import type { ApprovalGate } from "../../lib/kelasApproval";
import type { DampakVerdict } from "../../lib/dampakStruktur";
import type { MutasiQueueRow } from "./AntreanKeputusan";

export interface KartuTinjauProps {
  mutasi?: MutasiQueueRow | undefined;
  dampak: DampakVerdict;
  gate: ApprovalGate;
  onApprove: () => void;
  onReject: () => void;
  pending: boolean;
}

export function KartuTinjau({ mutasi, dampak, gate, onApprove, onReject, pending }: KartuTinjauProps) {
  if (!mutasi) {
    return (
      <SectionCard title="Kartu Tinjau">
        <div className="py-8 text-center text-sm text-muted-fg">
          Pilih satu mutasi di antrean untuk meninjau.
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <span>Kartu Tinjau</span>
            {dampak.destructive ? <Badge tone="danger">Destruktif</Badge> : null}
          </span>
        }
        description={`${mutasi.jenis_mutasi} — ${mutasi.siswa}`}
      >
        <InfoGrid cols={2}>
          <InfoField label="Siswa" value={mutasi.siswa} />
          <InfoField label="Jenis Mutasi" value={mutasi.jenis_mutasi} />
          <InfoField label="Rombel Asal" value={mutasi.rombel_asal ?? "—"} />
          {mutasi.rombel_tujuan ? (
            <InfoField label="Rombel Tujuan" value={mutasi.rombel_tujuan} />
          ) : null}
          {mutasi.tanggal_efektif ? (
            <InfoField label="Tanggal Efektif" value={mutasi.tanggal_efektif} />
          ) : null}
        </InfoGrid>
        {mutasi.alasan ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Alasan</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{mutasi.alasan}</p>
          </div>
        ) : null}

        {dampak.warnings.length > 0 ? (
          <div className="mt-4 space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">
              Dampak Struktur (penasihat)
            </div>
            {dampak.warnings.map((w, i) => (
              <div
                key={i}
                className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-sm text-amber-700"
              >
                {w}
              </div>
            ))}
          </div>
        ) : dampak.hasTarget ? (
          <div className="mt-4 text-sm text-emerald-600">
            Tujuan punya ruang{dampak.headroom != null ? ` (${dampak.headroom} sisa)` : ""}.
          </div>
        ) : null}
      </SectionCard>

      {gate.showApprovalBar ? (
        <ApprovalBar
          approveLabel={gate.approveLabel}
          canApprove={gate.canApprove}
          blockReason={gate.blockReason}
          onApprove={onApprove}
          onReject={onReject}
          pending={pending}
          hint="Keputusan ini final dan tercatat di audit trail."
        />
      ) : null}
    </div>
  );
}
