/**
 * Tata Usaha reporting obligations (Kewajiban) + packets (Paket) for Pusat Lapor.
 *
 * v1 ships these as a FRONTEND config map (no DB): a Kewajiban is a recurring
 * reporting duty with a due day + target, bundling 2-6 member reports. Status is
 * derived per-period from Laporan Terjadwal.last_run + a local receipt log. The
 * "Paket Lapor" doctype is a deferred fast-follow for cross-device persistence.
 */

/** Mirror of the BE PERIODE_CHOICES. */
export type KewajibanPeriode = "Harian" | "Mingguan" | "Bulanan" | "Semesteran" | "Tahunan";

/** Who the packet is submitted to. */
export type KewajibanTarget = "Dinas" | "Yayasan" | "Internal";

/** A member report of a packet. */
export interface ReportRef {
  reportName: string;
  /** Default export format for this report (the channel decides availability). */
  defaultFmt: "xlsx" | "pdf" | "csv" | "json";
  /** Whether the report is scoped per-rombel or sekolah-wide. */
  scope?: "sekolah" | "rombel";
}

export interface Kewajiban {
  id: string;
  nama: string;
  target: KewajibanTarget;
  periode: KewajibanPeriode;
  /** Day of the period the submission is due (day-of-month for Bulanan). */
  dueDay: number;
  paket: ReportRef[];
}

export type DueState = "overdue" | "due-soon" | "upcoming";

const DUE_SOON_DAYS = 7;
const MS_PER_DAY = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Compute the due date + state for an obligation relative to `refDate`.
 * Bulanan: due on `dueDay` of refDate's month. Other periodes are not modelled
 * yet and report "upcoming" (deadline tracking refines in a follow-up).
 */
export function computeDueState(
  periode: KewajibanPeriode,
  dueDay: number,
  refDate: Date,
): { dueDate: string; state: DueState } {
  if (periode !== "Bulanan") {
    return { dueDate: "", state: "upcoming" };
  }
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-based
  const due = new Date(year, month, dueDay);
  const dueDate = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
  const diffDays = Math.ceil((due.getTime() - refDate.getTime()) / MS_PER_DAY);
  let state: DueState;
  if (diffDays < 0) state = "overdue";
  else if (diffDays <= DUE_SOON_DAYS) state = "due-soon";
  else state = "upcoming";
  return { dueDate, state };
}

/** An obligation paired with its computed due date + state. */
export interface KewajibanWithDue {
  kewajiban: Kewajiban;
  dueDate: string;
  state: DueState;
}

const URGENCY_RANK: Record<DueState, number> = { overdue: 0, "due-soon": 1, upcoming: 2 };

/** Sort obligations by urgency (overdue → due-soon → upcoming, then by due date). */
export function sortKewajibanByUrgency(
  items: readonly Kewajiban[],
  refDate: Date,
): KewajibanWithDue[] {
  return items
    .map((kewajiban) => {
      const { dueDate, state } = computeDueState(kewajiban.periode, kewajiban.dueDay, refDate);
      return { kewajiban, dueDate, state };
    })
    .sort(
      (a, b) => URGENCY_RANK[a.state] - URGENCY_RANK[b.state] || a.dueDate.localeCompare(b.dueDate),
    );
}

/** TU reporting obligations — v1 config (seeded from the 6 TU compliance reports). */
export const KEWAJIBAN_TU: Kewajiban[] = [
  {
    id: "dapodik-bulanan",
    nama: "Pelaporan Dapodik Bulanan",
    target: "Dinas",
    periode: "Bulanan",
    dueDay: 5,
    paket: [
      { reportName: "Data Siswa Dapodik", defaultFmt: "xlsx", scope: "sekolah" },
      { reportName: "Siswa Missing NISN", defaultFmt: "xlsx", scope: "sekolah" },
    ],
  },
  {
    id: "absensi-bulanan",
    nama: "Rekap Absensi Bulanan",
    target: "Dinas",
    periode: "Bulanan",
    dueDay: 5,
    paket: [{ reportName: "Rekap Absensi Siswa", defaultFmt: "xlsx", scope: "rombel" }],
  },
  {
    id: "buku-induk-semester",
    nama: "Buku Induk & Rombel (Semesteran)",
    target: "Internal",
    periode: "Semesteran",
    dueDay: 10,
    paket: [
      { reportName: "Buku Induk Siswa", defaultFmt: "xlsx", scope: "sekolah" },
      { reportName: "Rekap Siswa per Rombel", defaultFmt: "xlsx", scope: "sekolah" },
    ],
  },
  {
    id: "tpg-bulanan",
    nama: "Laporan TPG (Tunjangan Profesi Guru)",
    target: "Dinas",
    periode: "Bulanan",
    dueDay: 10,
    paket: [{ reportName: "Laporan TPG", defaultFmt: "xlsx", scope: "sekolah" }],
  },
];
