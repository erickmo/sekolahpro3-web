/**
 * Work-queue selector for the Keuangan hub "Pekerjaan Hari Ini" cockpit.
 *
 * Pure + unit-testable: turns the already-loaded live rows (Tagihan, Pengeluaran,
 * SPT draft count) into a single urgency-ranked list of actionable items. It only
 * READS and DEEP-LINKS — it never mutates a financial document (bulk approve/post
 * is a deferred, guarded follow-up; see the design spec). `today` is passed in.
 *
 * Role only REORDERS (the role-relevant type floats to the top) — it never
 * filters anything out, honouring the emphasis-not-visibility contract.
 */
import type { TagihanRow, PengeluaranRow } from "../data/keuangan";
import type { KeuanganRole } from "./keuanganRole";

/** Colour/urgency bucket for a queue row. */
export type WorkSeverity = "red" | "amber" | "emerald";

/** What kind of work a row represents. */
export type WorkType = "tagihan" | "belanja" | "pajak";

/** A single actionable row in the work-queue. */
export interface WorkItem {
  id: string;
  type: WorkType;
  label: string;
  /** Rupiah amount at stake (0 for aggregate items). */
  amount: number;
  /** Days since the relevant date (overdue days, or age of the request). */
  ageDays: number;
  /** Human label for the deadline/age, Bahasa Indonesia. */
  dueLabel: string;
  severity: WorkSeverity;
  /** Deep-link to the page that resolves this work. */
  to: string;
}

/** Inputs for {@link buildWorkQueue}. */
export interface WorkQueueInput {
  tagihan: TagihanRow[];
  pengeluaran: PengeluaranRow[];
  sptDraftCount: number;
  /** ISO yyyy-mm-dd. */
  today: string;
  role?: KeuanganRole;
}

const MS_PER_DAY = 86_400_000;
const DUE_SOON_WITHIN_DAYS = 7; // include invoices due within a week
const RED_WITHIN_DAYS = 3;

const ROUTE_TAGIHAN = "/sch/$sekolah/keuangan/tagihan";
const ROUTE_PENGELUARAN = "/sch/$sekolah/keuangan/pengeluaran";
const ROUTE_SPT_PPN = "/sch/$sekolah/akuntansi/pajak/spt-ppn";

/** Severity rank for sorting (most urgent first). */
const SEVERITY_RANK: Record<WorkSeverity, number> = { red: 0, amber: 1, emerald: 2 };

/** Statuses that take an invoice out of the actionable queue. */
const TAGIHAN_DONE_STATUS = new Set(["Lunas", "Dibatalkan"]);

/** The single expense status that means "waiting for me to approve". */
const PENGELUARAN_AWAITING_STATUS = "Approval";

/** Which work types a role most wants floated to the top. */
const ROLE_PREFERRED_TYPES: Record<KeuanganRole, WorkType[]> = {
  kasir: ["tagihan"],
  bendahara: ["belanja", "tagihan"],
  akuntan: ["pajak"],
  kepala: [],
};

/** Parse an ISO yyyy-mm-dd into a UTC-midnight Date. */
function parseISO(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** Whole days from `due` to `today` (positive = overdue). */
function overdueDays(today: Date, dueISO: string): number {
  return Math.round((today.getTime() - parseISO(dueISO).getTime()) / MS_PER_DAY);
}

/** Map overdue-days to severity (>0 overdue or <=3 to go = red, <=7 = amber). */
function tagihanSeverity(daysOverdue: number): WorkSeverity {
  if (daysOverdue > 0) return "red";
  if (-daysOverdue <= RED_WITHIN_DAYS) return "red";
  return "amber";
}

/** Build the queue items for overdue / due-soon invoices. */
function tagihanItems(rows: TagihanRow[], today: Date): WorkItem[] {
  const items: WorkItem[] = [];
  for (const t of rows) {
    if (TAGIHAN_DONE_STATUS.has(t.status)) continue;
    const sisa = t.jumlah - t.dibayar;
    if (sisa <= 0) continue;
    const daysOverdue = overdueDays(today, t.jatuhTempo);
    // Only surface overdue or due within the next week — far-future bills are not "today's work".
    if (-daysOverdue > DUE_SOON_WITHIN_DAYS) continue;
    const dueLabel = daysOverdue > 0 ? `${daysOverdue} hari telat` : `jatuh tempo ${-daysOverdue} hari`;
    items.push({
      id: t.id,
      type: "tagihan",
      label: `${t.siswa} · ${t.judul}`,
      amount: sisa,
      ageDays: daysOverdue,
      dueLabel,
      severity: tagihanSeverity(daysOverdue),
      to: ROUTE_TAGIHAN,
    });
  }
  return items;
}

/** Build the queue items for expenses awaiting approval. */
function belanjaItems(rows: PengeluaranRow[], today: Date): WorkItem[] {
  const items: WorkItem[] = [];
  for (const e of rows) {
    if (e.status !== PENGELUARAN_AWAITING_STATUS) continue;
    items.push({
      id: e.id,
      type: "belanja",
      label: `${e.deskripsi} · ${e.penerima}`,
      amount: e.jumlah,
      ageDays: Math.max(0, overdueDays(today, e.tanggal)),
      dueLabel: "menunggu persetujuan",
      severity: "amber",
      to: ROUTE_PENGELUARAN,
    });
  }
  return items;
}

/** Build the single aggregate tax item when SPT drafts exist. */
function pajakItems(sptDraftCount: number): WorkItem[] {
  if (sptDraftCount <= 0) return [];
  return [
    {
      id: "spt-ppn-draft",
      type: "pajak",
      label: `${sptDraftCount} SPT Masa PPN draft perlu dilaporkan`,
      amount: 0,
      ageDays: 0,
      dueLabel: "perlu dilaporkan",
      severity: "amber",
      to: ROUTE_SPT_PPN,
    },
  ];
}

/** Base ordering: severity then amount desc. */
function bySeverityThenAmount(a: WorkItem, b: WorkItem): number {
  const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (sev !== 0) return sev;
  return b.amount - a.amount;
}

/**
 * Stable-reorder so that types preferred by `role` come first, preserving the
 * base order within each partition. Nothing is removed.
 */
function floatRolePreferred(items: WorkItem[], role: KeuanganRole): WorkItem[] {
  const preferred = new Set(ROLE_PREFERRED_TYPES[role]);
  const top = items.filter((i) => preferred.has(i.type));
  const rest = items.filter((i) => !preferred.has(i.type));
  return [...top, ...rest];
}

/**
 * Build the urgency-ranked work-queue from the live rows. Role (optional) only
 * floats its preferred work types to the top; it never filters items out.
 */
export function buildWorkQueue(input: WorkQueueInput): WorkItem[] {
  const today = parseISO(input.today);
  const items = [
    ...tagihanItems(input.tagihan, today),
    ...belanjaItems(input.pengeluaran, today),
    ...pajakItems(input.sptDraftCount),
  ].sort(bySeverityThenAmount);

  return input.role ? floatRolePreferred(items, input.role) : items;
}

/** Inbox-zero progress: how many queue items have been handled. */
export function inboxProgress(items: WorkItem[], doneIds: readonly string[]): { done: number; total: number } {
  const done = new Set(doneIds);
  return { done: items.filter((i) => done.has(i.id)).length, total: items.length };
}
