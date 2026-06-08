/**
 * Approval-gate logic for the Pesan official-broadcast workflow (Kepsek "Meja
 * Persetujuan Pesan").
 *
 * Deliberately NOT a reuse of lib/kelasApproval.ts: that helper is hardwired to the
 * Mutasi/Kelulusan DUAL-control workflow (states "Draft"/"Pending Ka-TU"/"Pending
 * Kepsek", a Ka-TU gate, a 4-step stepper) and would never match the Pesan broadcast
 * lifecycle, which is a SINGLE Kepsek gate with its own Bahasa-Indonesia state strings
 * ("Draf"/"Menunggu Kepsek"/"Disetujui"/"Ditolak"). We mirror only the PATTERN
 * (pure ApprovalGate derivation + a badge-tone mapper); the real state authority stays
 * the Frappe Workflow engine (apply_workflow).
 */

/** Workflow states of the `Pesan Broadcast` doctype (matches the Workflow fixture). */
export const PESAN_WORKFLOW_STATE = {
  DRAF: "Draf",
  MENUNGGU_KEPSEK: "Menunggu Kepsek",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
} as const;

export type PesanWorkflowState = (typeof PESAN_WORKFLOW_STATE)[keyof typeof PESAN_WORKFLOW_STATE];

/** Roles allowed to approve an official broadcast at the Kepsek gate. */
const ROLE_KEPSEK: ReadonlySet<string> = new Set(["Kepala Sekolah", "System Manager"]);

const BLOCK_KEPSEK = "Hanya Kepala Sekolah yang dapat menyetujui pengumuman resmi.";

/** True when any session role may approve at the Kepsek gate. */
export function isKepsekApprover(roles: readonly string[]): boolean {
  return roles.some((r) => ROLE_KEPSEK.has(r));
}

/** Derived approval affordances for a broadcast in a given workflow state. */
export interface BroadcastGate {
  /** Past Draf → content fields are read-only. */
  isLocked: boolean;
  /** Whether the current session may approve right now. */
  canApprove: boolean;
  /** Whether to render the approval bar (only at the pending gate). */
  showApprovalBar: boolean;
  /** Why approval is unavailable (undefined when allowed or no bar shown). */
  blockReason: string | undefined;
}

/** Derive the single-gate approval affordances for `state` given session `roles`. */
export function deriveBroadcastGate(
  state: PesanWorkflowState,
  roles: readonly string[],
): BroadcastGate {
  const showApprovalBar = state === PESAN_WORKFLOW_STATE.MENUNGGU_KEPSEK;
  const canApprove = showApprovalBar && isKepsekApprover(roles);
  return {
    isLocked: state !== PESAN_WORKFLOW_STATE.DRAF,
    canApprove,
    showApprovalBar,
    blockReason: showApprovalBar && !canApprove ? BLOCK_KEPSEK : undefined,
  };
}

/** Map a broadcast workflow state to a Badge tone. */
export function pesanStateBadgeTone(
  state: PesanWorkflowState,
): "neutral" | "warning" | "success" | "danger" {
  if (state === PESAN_WORKFLOW_STATE.DISETUJUI) return "success";
  if (state === PESAN_WORKFLOW_STATE.DITOLAK) return "danger";
  if (state === PESAN_WORKFLOW_STATE.DRAF) return "neutral";
  return "warning";
}
