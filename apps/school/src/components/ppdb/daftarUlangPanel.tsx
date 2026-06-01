/**
 * daftarUlangPanel — kartu per-pelamar diterima untuk halaman Daftar Ulang PPDB.
 *
 * Presentational + adapter. Halaman menyatukan dua sumber data ke satu
 * view-model {@link DaftarUlangItem}: jalur LIVE (baris DocType "Pendaftaran
 * PPDB" + "Daftar Ulang PPDB") dan jalur FALLBACK (fixture mock Pendaftar).
 * Komponen ini merender satu kartu per item — stepper tahapan + tombol
 * "Finalisasi" — sedangkan keputusan & efek samping (mutasi, modal konfirmasi)
 * tetap di halaman pemanggil.
 *
 * Dipakai HANYA oleh src/routes/sch.$sekolah.ppdb.daftar-ulang.tsx.
 */

import type { ReactNode } from "react";
import { Badge, Button, SectionCard, WorkflowStepper, type WorkflowStep } from "@sekolahpro/ui";
import type { DistributionSegment } from "../viz";
import type { Pendaftar, TahapanRow } from "../../data/ppdb";

// Pemetaan status tahapan mock → status visual WorkflowStepper.
// Selesai = done, Berjalan = current (disorot), Belum = pending.
const TAHAP_STATUS_MAP: Record<TahapanRow["status"], WorkflowStep["status"]> = {
  Selesai: "done",
  Berjalan: "current",
  Belum: "pending",
};

// Status pendaftaran (mock) yang menandakan daftar ulang sudah tuntas.
const MOCK_STATUS_DONE: Pendaftar["statusPendaftaran"] = "Daftar Ulang";

// Status Pendaftaran PPDB (live) yang dianggap diterima → masuk antrian.
const LIVE_ACCEPTED_STATUSES = new Set(["Diterima", "Lulus", "Daftar Ulang"]);
// Status Pendaftaran PPDB (live) yang sendirinya menandai daftar ulang tuntas.
const LIVE_SELF_DONE_STATUS = "Daftar Ulang";
// Status baris "Daftar Ulang PPDB" yang menandakan re-registrasi selesai.
const REREG_DONE_STATUSES = new Set(["Selesai", "Lunas", "Diterima"]);

// Label tombol & badge — string UI terpusat (no magic strings).
const LABEL_FINALISASI = "Finalisasi → Buat Siswa";
const LABEL_SELESAI = "Daftar ulang selesai";
const BADGE_DONE = "Selesai";
const BADGE_WAIT = "Menunggu";

// Segmen bilah penyelesaian — warna konsisten via Tone viz.
const SEG_DONE_LABEL = "Selesai";
const SEG_WAIT_LABEL = "Menunggu";

/* ------------------------------------------------------------------ */
/* View-model + live row types                                        */
/* ------------------------------------------------------------------ */

/** Baris "Pendaftaran PPDB" (live) yang dikonsumsi halaman daftar ulang. */
export interface PendaftaranLiveRow {
  name: string;
  status?: string;
  calon_siswa?: string;
  gelombang_ppdb?: string;
}

/** Baris "Daftar Ulang PPDB" (live) — state re-registrasi per pendaftaran. */
export interface DaftarUlangLiveRow {
  name: string;
  pendaftaran_ppdb?: string;
  status?: string;
}

/**
 * View-model seragam satu pelamar di antrian daftar ulang. `payload` membawa
 * objek asli (Pendaftar mock) agar aksi finalisasi punya konteks penuh; live
 * memakai id sebagai pendaftaran_ppdb.
 */
export interface DaftarUlangItem {
  /** Identitas pendaftaran (no. pendaftaran / DocType name). */
  id: string;
  /** Label utama kartu (nama lengkap bila ada, jika tidak id). */
  title: string;
  /** Sub-label (id pendaftaran) di bawah judul. */
  subtitle: string;
  /** True bila daftar ulang sudah tuntas. */
  done: boolean;
  /** Langkah stepper tahapan (kosong untuk live tanpa detail tahapan). */
  steps: WorkflowStep[];
  /** Pendaftar mock asli bila berasal dari fallback (untuk modal konfirmasi). */
  pendaftar?: Pendaftar;
}

/* ------------------------------------------------------------------ */
/* Adapters                                                           */
/* ------------------------------------------------------------------ */

/** Ubah satu baris tahapan mock menjadi langkah WorkflowStepper. */
function toWorkflowStep(row: TahapanRow): WorkflowStep {
  return { key: row.tahap, label: row.tahap, status: TAHAP_STATUS_MAP[row.status], hint: row.tanggal };
}

/** Stepper minimal untuk pelamar LIVE: satu langkah "Daftar Ulang". */
function liveSteps(done: boolean): WorkflowStep[] {
  return [{ key: "Daftar Ulang", label: "Daftar Ulang", status: done ? "done" : "current" }];
}

/**
 * Bangun antrian view-model dari baris LIVE. Pelamar diterima di-join dengan
 * baris "Daftar Ulang PPDB": tuntas bila ada re-reg ber-status selesai ATAU
 * status pendaftaran sendiri sudah "Daftar Ulang". Foreign status diabaikan.
 */
export function buildLiveQueue(
  pendaftaran: PendaftaranLiveRow[],
  daftarUlang: DaftarUlangLiveRow[],
): DaftarUlangItem[] {
  const doneByPendaftaran = new Set<string>();
  for (const row of daftarUlang) {
    if (row.pendaftaran_ppdb && row.status && REREG_DONE_STATUSES.has(row.status)) {
      doneByPendaftaran.add(row.pendaftaran_ppdb);
    }
  }
  return pendaftaran
    .filter((p) => p.status !== undefined && LIVE_ACCEPTED_STATUSES.has(p.status))
    .map((p) => {
      const done = doneByPendaftaran.has(p.name) || p.status === LIVE_SELF_DONE_STATUS;
      return { id: p.name, title: p.name, subtitle: p.name, done, steps: liveSteps(done) };
    });
}

/** Ubah daftar Pendaftar mock (fallback) menjadi antrian view-model. */
export function buildMockQueue(list: Pendaftar[]): DaftarUlangItem[] {
  return list.map((p) => ({
    id: p.noPendaftaran,
    title: p.namaLengkap,
    subtitle: p.noPendaftaran,
    done: p.statusPendaftaran === MOCK_STATUS_DONE,
    steps: p.tahapan.map(toWorkflowStep),
    pendaftar: p,
  }));
}

/** Pisahkan antrian menjadi hitungan selesai vs menunggu. */
export function splitCompletion(queue: DaftarUlangItem[]): { done: number; waiting: number } {
  const done = queue.filter((i) => i.done).length;
  return { done, waiting: queue.length - done };
}

/** Bangun segmen DistributionBar penyelesaian daftar ulang dari antrian. */
export function completionSegments(queue: DaftarUlangItem[]): DistributionSegment[] {
  const { done, waiting } = splitCompletion(queue);
  return [
    { label: SEG_DONE_LABEL, value: done, tone: "emerald" },
    { label: SEG_WAIT_LABEL, value: waiting, tone: "amber" },
  ];
}

/* ------------------------------------------------------------------ */
/* Card                                                               */
/* ------------------------------------------------------------------ */

interface CardProps {
  item: DaftarUlangItem;
  /** Dipicu saat staff menekan tombol finalisasi untuk pelamar ini. */
  onConfirm: (item: DaftarUlangItem) => void;
  /** True saat ada mutasi finalisasi berjalan — menonaktifkan tombol. */
  busy: boolean;
}

/** Header kartu: identitas pelamar + badge status daftar ulang. */
function CardHeader({ item }: { item: DaftarUlangItem }): ReactNode {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{item.title}</p>
        <p className="font-mono text-xs text-muted-fg">{item.subtitle}</p>
      </div>
      <Badge tone={item.done ? "success" : "warning"} dot>
        {item.done ? BADGE_DONE : BADGE_WAIT}
      </Badge>
    </div>
  );
}

/**
 * Kartu daftar ulang satu pelamar (live atau mock): stepper tahapan + aksi
 * finalisasi. Tombol dinonaktifkan saat daftar ulang selesai atau mutasi jalan.
 */
export function DaftarUlangApplicantCard({ item, onConfirm, busy }: CardProps): ReactNode {
  return (
    <SectionCard>
      <CardHeader item={item} />
      <div className="mt-4 overflow-x-auto">
        <WorkflowStepper steps={item.steps} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          size="sm"
          disabled={item.done || busy}
          onClick={() => onConfirm(item)}
          title={item.done ? LABEL_SELESAI : LABEL_FINALISASI}
        >
          {item.done ? LABEL_SELESAI : "Finalisasi"}
        </Button>
      </div>
    </SectionCard>
  );
}
