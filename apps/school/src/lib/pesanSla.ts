/**
 * Communication-health (SLA) derivation for the Kepsek oversight cockpit.
 *
 * Pure, deterministic core: given the inbound "Contact Inbox SekolahPro" rows and a
 * response-time window (jam), it answers the three zero-click signals the headmaster
 * reads at a glance — how many messages are unanswered, how long the oldest has waited,
 * how many have blown the SLA — plus a single one-sentence verdict.
 *
 * "now" is injected (never read from the clock here) so the function is unit-testable
 * and side-effect free; the hook/component passes Date.now(). The SLA window lives in
 * the backend `Pengaturan Pesan` Single eventually; until then DEFAULT_SLA_JAM is the
 * honest hardcoded fallback (see the Kepsek tournament plan, open question on SLA).
 */

/** Minimal shape of an inbox row needed for health derivation. */
export interface CommHealthRow {
  status?: string;
  submitted_at?: string;
  creation?: string;
}

/** The one-sentence headmaster verdict. */
export type CommVerdict = "SEHAT" | "PERLU PERHATIAN" | "TERLAMBAT";

/** Derived communication-health signals for the oversight panel. */
export interface CommHealth {
  /** Inbound messages still unanswered (status "Baru"). */
  belumDibalas: number;
  /** Age in whole hours of the oldest unanswered message (0 when none/unparseable). */
  terlamaMenungguJam: number;
  /** Unanswered messages whose wait already exceeds the SLA window. */
  lewatSla: number;
  /** One-glance verdict derived from the signals above. */
  verdict: CommVerdict;
}

/** Inbox status that means "not yet answered". */
const STATUS_BARU = "Baru";

/** Default SLA response window (jam) until the `Pengaturan Pesan` Single overrides it. */
export const DEFAULT_SLA_JAM = 24;

const MS_PER_HOUR = 3600_000;

/** Whole-hour age of a row relative to `nowMs`; 0 when no timestamp parses. */
function ageJam(row: CommHealthRow, nowMs: number): number {
  const iso = row.submitted_at ?? row.creation;
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((nowMs - t) / MS_PER_HOUR));
}

/**
 * Derive the three communication-health signals + verdict from inbox rows.
 * Only unanswered (status "Baru") rows contribute to wait/SLA; replied or resolved
 * rows are healthy regardless of age.
 */
export function deriveCommHealth(
  rows: readonly CommHealthRow[],
  slaJam: number = DEFAULT_SLA_JAM,
  nowMs: number = Date.now(),
): CommHealth {
  const window = slaJam ?? DEFAULT_SLA_JAM;
  let belumDibalas = 0;
  let terlamaMenungguJam = 0;
  let lewatSla = 0;

  for (const row of rows) {
    if (row.status !== STATUS_BARU) continue;
    belumDibalas += 1;
    const age = ageJam(row, nowMs);
    if (age > terlamaMenungguJam) terlamaMenungguJam = age;
    if (age > window) lewatSla += 1;
  }

  const verdict: CommVerdict =
    lewatSla > 0 ? "TERLAMBAT" : belumDibalas > 0 ? "PERLU PERHATIAN" : "SEHAT";

  return { belumDibalas, terlamaMenungguJam, lewatSla, verdict };
}
