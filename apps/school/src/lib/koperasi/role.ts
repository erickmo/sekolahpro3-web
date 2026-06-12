/**
 * Koperasi role vocabulary for guide-step framing.
 *
 * Presentation labels only — they tag who a guide step speaks to and never
 * gate access (mirrors lib/aset/role.ts and lib/perpustakaanRole.ts). A small
 * koperasi often has 1-2 staff wearing every hat, so steps stay visible to all.
 */
export type KoperasiRole = "teller" | "admin" | "supervisor";

/** Bahasa Indonesia label per koperasi role, rendered as guide-step badges. */
export const KOPERASI_ROLE_LABEL: Record<KoperasiRole, string> = {
  teller: "Teller",
  admin: "Admin Koperasi",
  supervisor: "Supervisor",
};
