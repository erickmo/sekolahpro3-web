/**
 * Pure state machine for the Anggota onboarding wizard.
 *
 * The wizard chains four previously-disjoint forms (pilih nasabah → buat
 * keanggotaan → buka rekening → setor simpanan pokok). Keeping the "which step
 * is unlocked / done" logic here (no React, no network) makes the flow
 * unit-testable and lets the route stay a thin renderer. See
 * routes/kop.$sekolah.onboarding.tsx for the UI that consumes it.
 */

import type { WorkflowStepStatus } from "@sekolahpro/ui";

export type OnboardingStepKey = "nasabah" | "keanggotaan" | "rekening" | "pokok";
export type OnboardingPhase = OnboardingStepKey | "selesai";

export interface OnboardingState {
  /** Selected Nasabah (member identity), captured in step 1. */
  nasabah?: string;
  /** Created Anggota Koperasi name, captured in step 2. */
  anggotaName?: string;
  /** Created Permohonan/Rekening name, captured in step 3. */
  rekeningName?: string;
  /** Status of the rekening/permohonan — pokok step unlocks only when approved. */
  rekeningStatus?: string;
  /** Whether simpanan pokok has been recorded (step 4). */
  pokokPaid?: boolean;
}

/** Statuses that mean the account is usable for a deposit. */
const REKENING_READY = new Set(["Aktif", "Disetujui"]);

const STEP_ORDER: OnboardingStepKey[] = ["nasabah", "keanggotaan", "rekening", "pokok"];

const STEP_LABEL: Record<OnboardingPhase, string> = {
  nasabah: "Pilih nasabah",
  keanggotaan: "Buat keanggotaan",
  rekening: "Buka rekening simpanan",
  pokok: "Setor simpanan pokok",
  selesai: "Onboarding selesai",
};

/** The first step not yet completed, or "selesai" when all are done. */
export function deriveOnboardingStep(state: OnboardingState): OnboardingPhase {
  if (!state.nasabah) return "nasabah";
  if (!state.anggotaName) return "keanggotaan";
  if (!state.rekeningName) return "rekening";
  if (!state.pokokPaid) return "pokok";
  return "selesai";
}

/** True when the rekening is approved/active and a pokok deposit may be recorded. */
export function canProceedToPokok(args: { rekeningStatus?: string }): boolean {
  return args.rekeningStatus !== undefined && REKENING_READY.has(args.rekeningStatus);
}

/** Human label of the next action the operator must take. */
export function nextStepLabel(state: OnboardingState): string {
  return STEP_LABEL[deriveOnboardingStep(state)];
}

export interface OnboardingStepView {
  key: OnboardingStepKey;
  label: string;
  status: WorkflowStepStatus;
}

/**
 * Build per-step view models for the WorkflowStepper: steps before the active
 * one are "done", the active one is "current", later ones are "pending".
 */
export function onboardingSteps(state: OnboardingState): OnboardingStepView[] {
  const active = deriveOnboardingStep(state);
  const activeIdx = active === "selesai" ? STEP_ORDER.length : STEP_ORDER.indexOf(active);
  return STEP_ORDER.map((key, idx) => ({
    key,
    label: STEP_LABEL[key],
    status: idx < activeIdx ? "done" : idx === activeIdx ? "current" : "pending",
  }));
}
