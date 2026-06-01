/**
 * Pure derivation helpers for the Perpustakaan dashboard route (lib layer).
 *
 * Turns the lists the route already fetches (loans, denda, BA, opname,
 * pengadaan) into the StatCard counters and the "Perlu Perhatian" attention
 * queue. No backend calls and no `Date.now()` — the reference date is passed in
 * — so every function is deterministic and unit-testable, mirroring the
 * approach in `dashboardViz.ts`. The route only wires these into `useMemo`.
 */
import type { AttentionItem } from "@sekolahpro/ui";

/** Raw loan statuses the dashboard counters & attention queue branch on. */
const STATUS_AKTIF = "Aktif";
const STATUS_TERLAMBAT = "Terlambat";
const STATUS_HILANG = "Hilang";

/** Loan row fields the dashboard counter & attention builders read. */
export interface DashboardPinjamRow {
  name: string;
  anggota?: string | undefined;
  tanggal_kembali_rencana?: string | undefined;
  status?: string | undefined;
}

/** Pending-incident row (Berita Acara Kerusakan Buku, docstatus 0). */
export interface DashboardBARow {
  name: string;
  tanggal_kejadian?: string | undefined;
}

/** Draft stock-opname row (docstatus 0). */
export interface DashboardOpnameRow {
  name: string;
  tanggal?: string | undefined;
}

/** Denda row contributing to the outstanding total. */
export interface DashboardDendaRow {
  nominal?: number | undefined;
}

/** Pengadaan row contributing to this-month exemplar count. */
export interface DashboardPengadaanRow {
  total_eksemplar?: number | undefined;
}

/** All counters surfaced by the dashboard StatCards. */
export interface DashboardStats {
  totalJudul: number;
  aktif: number;
  terlambat: number;
  jatuhTempoHariIni: number;
  dendaOutstanding: number;
  dendaCount: number;
  baPendingCount: number;
  opnameDraftCount: number;
  pengadaanEksBulanIni: number;
}

/** Inputs needed to compute the dashboard counters in one pass. */
export interface DashboardStatsInput {
  buku: ReadonlyArray<unknown>;
  pinjam: ReadonlyArray<DashboardPinjamRow>;
  denda: ReadonlyArray<DashboardDendaRow>;
  baPending: ReadonlyArray<unknown>;
  opnameDrafts: ReadonlyArray<unknown>;
  pengadaanBulanIni: ReadonlyArray<DashboardPengadaanRow>;
  /** ISO reference date used for the "jatuh tempo hari ini" branch. */
  today: string;
}

/**
 * Compute every dashboard counter from the lists already fetched by the route.
 * Pure: no fetching, no `Date.now()` — the reference date is passed in.
 */
export function buildDashboardStats(input: DashboardStatsInput): DashboardStats {
  const { buku, pinjam, denda, baPending, opnameDrafts, pengadaanBulanIni, today } = input;
  const totalJudul = buku.length;
  const aktif = pinjam.filter((p) => p.status === STATUS_AKTIF).length;
  const terlambat = pinjam.filter((p) => p.status === STATUS_TERLAMBAT).length;
  // Actionable: buku jatuh tempo hari ini (dueDate == today) — masih Aktif.
  const jatuhTempoHariIni = pinjam.filter(
    (p) => p.status === STATUS_AKTIF && p.tanggal_kembali_rencana === today,
  ).length;
  const dendaOutstanding = denda.reduce((s, d) => s + (d.nominal ?? 0), 0);
  const dendaCount = denda.length;
  const baPendingCount = baPending.length;
  const opnameDraftCount = opnameDrafts.length;
  const pengadaanEksBulanIni = pengadaanBulanIni.reduce((s, p) => s + (p.total_eksemplar ?? 0), 0);
  return {
    totalJudul, aktif, terlambat, jatuhTempoHariIni, dendaOutstanding, dendaCount,
    baPendingCount, opnameDraftCount, pengadaanEksBulanIni,
  };
}

/** Inputs for the "Perlu Perhatian" attention queue. */
export interface PerluPerhatianInput {
  pinjam: ReadonlyArray<DashboardPinjamRow>;
  baPending: ReadonlyArray<DashboardBARow>;
  opnameDrafts: ReadonlyArray<DashboardOpnameRow>;
  /** ISO reference date used for the due-today branch. */
  today: string;
}

/** Append the draft-opname resume items to the attention queue. */
function pushOpnameItems(items: AttentionItem[], opnameDrafts: ReadonlyArray<DashboardOpnameRow>): void {
  for (const op of opnameDrafts) {
    items.push({
      id: `opname-${op.name}`,
      label: `Opname ${op.name}`,
      description: `Draft sesi ${op.tanggal ?? "—"} belum disubmit — lanjutkan scan`,
      tone: "neutral",
      badge: "Draft",
      actionLabel: "Resume",
      actionHref: `/sch/$sekolah/perpustakaan/inventaris/opname/${op.name}`,
    });
  }
}

/** Append the pending-BA approval items to the attention queue. */
function pushBaItems(items: AttentionItem[], baPending: ReadonlyArray<DashboardBARow>): void {
  for (const ba of baPending) {
    items.push({
      id: `ba-${ba.name}`,
      label: `BA ${ba.name}`,
      description: `Insiden ${ba.tanggal_kejadian ?? "—"} menunggu approval Kepala Perpustakaan`,
      tone: "warning",
      badge: "Approval",
      actionLabel: "Review",
      actionHref: `/sch/$sekolah/perpustakaan/inventaris/berita-acara/${ba.name}`,
    });
  }
}

/** Append overdue / lost / due-today loan items to the attention queue. */
function pushPinjamItems(
  items: AttentionItem[],
  pinjam: ReadonlyArray<DashboardPinjamRow>,
  today: string,
): void {
  for (const p of pinjam) {
    if (p.status === STATUS_TERLAMBAT) {
      items.push({
        id: `terlambat-${p.name}`,
        label: p.name,
        description: `${p.anggota ?? "—"} · jatuh tempo ${p.tanggal_kembali_rencana ?? "—"}`,
        tone: "warning",
        badge: "Terlambat",
        actionLabel: "Kirim Pengingat",
        actionHref: "/sch/$sekolah/perpustakaan/peminjaman",
      });
    } else if (p.status === STATUS_HILANG) {
      items.push({
        id: `hilang-${p.name}`,
        label: p.name,
        description: `${p.anggota ?? "—"} · buku hilang — butuh penggantian`,
        tone: "danger",
        badge: "Hilang",
        actionLabel: "Buat Denda",
        actionHref: "/sch/$sekolah/perpustakaan/denda",
      });
    } else if (p.status === STATUS_AKTIF && p.tanggal_kembali_rencana === today) {
      items.push({
        id: `due-${p.name}`,
        label: p.name,
        description: `${p.anggota ?? "—"} · jatuh tempo hari ini`,
        tone: "neutral",
        actionLabel: "Cek Peminjaman",
        actionHref: "/sch/$sekolah/perpustakaan/peminjaman",
      });
    }
  }
}

/**
 * Build the "Perlu Perhatian" queue: draft opnames, pending BA approvals, then
 * overdue / lost / due-today loans — in that display order. Pure; the reference
 * date is passed in.
 */
export function buildPerluPerhatianItems(input: PerluPerhatianInput): AttentionItem[] {
  const { pinjam, baPending, opnameDrafts, today } = input;
  const items: AttentionItem[] = [];
  pushOpnameItems(items, opnameDrafts);
  pushBaItems(items, baPending);
  pushPinjamItems(items, pinjam, today);
  return items;
}
