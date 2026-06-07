/**
 * Shared approval-gate logic for the dual-control workflow consumed by BOTH
 * the Mutasi Siswa and Kelulusan Siswa detail routes (and, going forward, the
 * Kepsek "Meja Persetujuan" desk). The identical role sets + gate derivation +
 * stepper/badge helpers were copy-pasted in mutasi.$id.tsx and kelulusan.$id.tsx;
 * this is the single source so a fix touches one place.
 *
 * Pure presentation/derivation only — it never mutates a doc. The Frappe
 * Workflow engine (apply_workflow) stays the sole authority for state changes.
 */
import type { WorkflowStep } from "@sekolahpro/ui/components/WorkflowStepper";
import { WORKFLOW_STATE, type WorkflowState } from "./mutasiConstants";

/** Roles allowed to approve at the Ka-TU gate. */
export const ROLE_KATU: ReadonlySet<string> = new Set(["Kepala Tata Usaha", "System Manager"]);
/** Roles allowed to approve at the Kepsek gate. */
export const ROLE_KEPSEK: ReadonlySet<string> = new Set(["Kepala Sekolah", "System Manager"]);
/** Roles allowed to see the restricted audit trail. */
export const ROLE_AUDIT_VIEW: ReadonlySet<string> = new Set([
  "Kepala Sekolah",
  "Bimbingan Konseling",
  "System Manager",
]);

const APPROVE_LABEL_KATU = "Setujui sebagai Ka-TU";
const APPROVE_LABEL_KEPSEK = "Setujui sebagai Kepala Sekolah";
const BLOCK_KATU = "Hanya Kepala Tata Usaha yang dapat menyetujui pada tahap ini.";
const BLOCK_KEPSEK = "Hanya Kepala Sekolah yang dapat menyetujui pada tahap ini.";
const BLOCK_NONE = "Tidak ada aksi approval pada status ini.";

/** True when any of the session roles is a Ka-TU approver. */
export function isKatu(roles: readonly string[]): boolean {
  return roles.some((r) => ROLE_KATU.has(r));
}

/** True when any of the session roles is a Kepsek approver. */
export function isKepsek(roles: readonly string[]): boolean {
  return roles.some((r) => ROLE_KEPSEK.has(r));
}

/** True when any of the session roles may view the restricted audit trail. */
export function canViewAudit(roles: readonly string[]): boolean {
  return roles.some((r) => ROLE_AUDIT_VIEW.has(r));
}

/** The derived approval affordances for a workflow doc in a given state. */
export interface ApprovalGate {
  /** Doc is past Draft → its data fields are read-only. */
  isLocked: boolean;
  canApproveKatu: boolean;
  canApproveKepsek: boolean;
  canApprove: boolean;
  approveLabel: string;
  /** Why the approve action is unavailable (undefined when approval is allowed). */
  blockReason: string | undefined;
  /** Whether to render the approval bar at all (only at a pending gate). */
  showApprovalBar: boolean;
}

/**
 * Derive the approval gate for `state` given the current session `roles`.
 * Mirrors the logic previously inline in mutasi/kelulusan detail pages.
 */
export function deriveApprovalGate(state: WorkflowState, roles: readonly string[]): ApprovalGate {
  const canApproveKatu = state === WORKFLOW_STATE.PENDING_KATU && isKatu(roles);
  const canApproveKepsek = state === WORKFLOW_STATE.PENDING_KEPSEK && isKepsek(roles);
  const canApprove = canApproveKatu || canApproveKepsek;
  const showApprovalBar =
    state === WORKFLOW_STATE.PENDING_KATU || state === WORKFLOW_STATE.PENDING_KEPSEK;

  let blockReason: string | undefined;
  if (!canApprove) {
    if (state === WORKFLOW_STATE.PENDING_KATU) blockReason = BLOCK_KATU;
    else if (state === WORKFLOW_STATE.PENDING_KEPSEK) blockReason = BLOCK_KEPSEK;
    else blockReason = BLOCK_NONE;
  }

  return {
    isLocked: state !== WORKFLOW_STATE.DRAFT,
    canApproveKatu,
    canApproveKepsek,
    canApprove,
    approveLabel: canApproveKepsek ? APPROVE_LABEL_KEPSEK : APPROVE_LABEL_KATU,
    blockReason,
    showApprovalBar,
  };
}

/** Map a workflow state to a Badge tone. */
export function stateBadgeTone(
  state: WorkflowState,
): "neutral" | "warning" | "success" | "danger" {
  if (state === WORKFLOW_STATE.APPROVED) return "success";
  if (state === WORKFLOW_STATE.REJECTED) return "danger";
  if (state === WORKFLOW_STATE.DRAFT) return "neutral";
  return "warning";
}

/**
 * Build the 4-segment visual stepper for the dual-control workflow.
 * `doneLabel` is the caller's name for the terminal step ("Disetujui" for
 * mutasi, "Disahkan" for kelulusan).
 */
export function deriveApprovalSteps(state: WorkflowState, doneLabel: string): WorkflowStep[] {
  const base: { key: string; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "katu", label: "Approval Ka-TU" },
    { key: "kepsek", label: "Approval Kepsek" },
    { key: "done", label: doneLabel },
  ];
  return base.map((s) => {
    if (state === WORKFLOW_STATE.REJECTED) {
      return { ...s, status: s.key === "draft" ? "done" : "rejected" };
    }
    if (state === WORKFLOW_STATE.APPROVED) return { ...s, status: "done" };
    if (state === WORKFLOW_STATE.PENDING_KEPSEK) {
      return {
        ...s,
        status:
          s.key === "draft" || s.key === "katu"
            ? "done"
            : s.key === "kepsek"
              ? "current"
              : "pending",
      };
    }
    if (state === WORKFLOW_STATE.PENDING_KATU) {
      return {
        ...s,
        status: s.key === "draft" ? "done" : s.key === "katu" ? "current" : "pending",
      };
    }
    return { ...s, status: s.key === "draft" ? "current" : "pending" };
  });
}
