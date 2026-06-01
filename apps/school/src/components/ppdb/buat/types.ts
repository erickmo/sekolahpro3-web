/**
 * Shared types, constants, validation messages, and pure helpers for the
 * "Buat PPDB" wizard. Extracted from buatPanel.tsx so every wizard file stays
 * lean (< 300 lines). No behavior change — pure structural split.
 */

import type { WorkflowStep } from "@sekolahpro/ui";

export type CalonRow = { name: string; nama_lengkap?: string; nisn?: string };
export type TahunAjaranRow = { name: string; judul?: string };
export type SekolahRow = { name: string; nama?: string };

export const TINGKAT_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export type PaymentPhase = "sebelum_seleksi" | "setelah_diterima" | "tidak";

export interface WizardConfig {
  paymentPhase: PaymentPhase;
  autoTerima: boolean;
}

export interface SubmitResult {
  pendaftaranName: string;
  paymentUrl?: string | undefined;
  paymentOrderId?: string | undefined;
  warnings: string[];
}

export const STEP_KEYS = ["gelombang", "calon", "config", "konfirmasi", "hasil"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export const STEP_LABELS: Record<StepKey, string> = {
  gelombang: "Gelombang",
  calon: "Calon Siswa",
  config: "Konfigurasi",
  konfirmasi: "Konfirmasi",
  hasil: "Hasil",
};

// Pesan validasi terpusat (no magic strings) — semua Bahasa Indonesia.
export const MSG_TA_WAJIB = "Tahun ajaran wajib dipilih sebelum lanjut.";
export const MSG_GELOMBANG_WAJIB = "Gelombang wajib dipilih.";
export const MSG_GELOMBANG_FORM_WAJIB =
  "Lengkapi field gelombang yang wajib (bertanda *) sebelum membuat.";
export const MSG_CALON_WAJIB = "Calon siswa wajib dipilih.";
export const MSG_CALON_FORM_WAJIB = "Nama lengkap dan jenis kelamin wajib diisi.";

export const inputCls =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

export type GelombangFormState = {
  nama: string;
  sekolah: string;
  tingkat: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  kuota: string;
  biaya_pendaftaran: string;
};

export type CalonFormState = {
  nama_lengkap: string;
  jenis_kelamin: string;
  nisn: string;
  nik: string;
  no_hp: string;
  asal_sekolah: string;
  email: string;
};

/** Bangun langkah-langkah WorkflowStepper dari posisi langkah saat ini. */
export function buildStepperSteps(current: StepKey): WorkflowStep[] {
  const curIdx = STEP_KEYS.indexOf(current);
  return STEP_KEYS.map((k) => {
    const idx = STEP_KEYS.indexOf(k);
    return {
      key: k,
      label: STEP_LABELS[k],
      status: idx < curIdx ? "done" : idx === curIdx ? "current" : "pending",
    };
  });
}
