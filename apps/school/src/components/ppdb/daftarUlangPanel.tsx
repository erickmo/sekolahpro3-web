/**
 * daftarUlangPanel — kartu per-pelamar diterima untuk halaman Daftar Ulang PPDB.
 *
 * Presentational: menerima satu {@link Pendaftar} + callback konfirmasi, lalu
 * menampilkan WorkflowStepper tahapan PPDB-nya dan tombol "Finalisasi" untuk
 * mengubah pelamar menjadi Siswa resmi. Keputusan & efek samping (mutasi,
 * modal konfirmasi) tetap di halaman pemanggil — komponen ini hanya merender.
 *
 * Dipakai HANYA oleh src/routes/sch.$sekolah.ppdb.daftar-ulang.tsx.
 */

import type { ReactNode } from "react";
import { Badge, Button, SectionCard, WorkflowStepper, type WorkflowStep } from "@sekolahpro/ui";
import type { Pendaftar, TahapanRow } from "../../data/ppdb";

// Pemetaan status tahapan mock → status visual WorkflowStepper.
// Selesai = done, Berjalan = current (disorot), Belum = pending.
const TAHAP_STATUS_MAP: Record<TahapanRow["status"], WorkflowStep["status"]> = {
  Selesai: "done",
  Berjalan: "current",
  Belum: "pending",
};

// Status pendaftaran yang menandakan daftar ulang sudah tuntas.
const STATUS_DONE: Pendaftar["statusPendaftaran"] = "Daftar Ulang";

// Label tombol — string UI terpusat (no magic strings).
const LABEL_FINALISASI = "Finalisasi → Buat Siswa";
const LABEL_SELESAI = "Daftar ulang selesai";

/** Ubah satu baris tahapan mock menjadi langkah WorkflowStepper. */
function toWorkflowStep(row: TahapanRow): WorkflowStep {
  return {
    key: row.tahap,
    label: row.tahap,
    status: TAHAP_STATUS_MAP[row.status],
    // Tanggal jadi hint kontekstual di bawah label langkah.
    hint: row.tanggal,
  };
}

interface Props {
  pendaftar: Pendaftar;
  /** Dipicu saat staff menekan tombol finalisasi untuk pelamar ini. */
  onConfirm: (pendaftar: Pendaftar) => void;
  /** True saat ada mutasi finalisasi berjalan — menonaktifkan tombol. */
  busy: boolean;
}

/** Header kartu: identitas pelamar + badge status daftar ulang. */
function PanelHeader({ pendaftar, done }: { pendaftar: Pendaftar; done: boolean }): ReactNode {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{pendaftar.namaLengkap}</p>
        <p className="font-mono text-xs text-muted-fg">{pendaftar.noPendaftaran}</p>
      </div>
      <Badge tone={done ? "success" : "warning"} dot>
        {done ? "Selesai" : "Menunggu"}
      </Badge>
    </div>
  );
}

/**
 * Kartu daftar ulang satu pelamar: stepper tahapan + aksi finalisasi.
 * Tombol dinonaktifkan saat daftar ulang sudah selesai atau mutasi berjalan.
 */
export function DaftarUlangApplicantCard({ pendaftar, onConfirm, busy }: Props): ReactNode {
  const done = pendaftar.statusPendaftaran === STATUS_DONE;
  const steps = pendaftar.tahapan.map(toWorkflowStep);

  return (
    <SectionCard>
      <PanelHeader pendaftar={pendaftar} done={done} />
      <div className="mt-4 overflow-x-auto">
        <WorkflowStepper steps={steps} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          size="sm"
          disabled={done || busy}
          onClick={() => onConfirm(pendaftar)}
          title={done ? LABEL_SELESAI : LABEL_FINALISASI}
        >
          {done ? LABEL_SELESAI : "Finalisasi"}
        </Button>
      </div>
    </SectionCard>
  );
}
