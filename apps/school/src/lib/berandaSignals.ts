/**
 * "Sinyal" panel selector for the role-adaptive Beranda dashboard.
 *
 * Pure + unit-testable. Produces an AttentionItem[] of cross-module signals for
 * the two personas whose layout includes the Sinyal panel:
 *  - kepala_sekolah: school-wide, by REUSING the shipped deriveStaffActionQueue
 *    (SK/coverage) + deriveActionQueue (siswa) builders — not re-derived here.
 *  - wali_kelas: scoped to the user's own rombel, from simple counts.
 *
 * Dedup-vs-inbox (Keputusan #2): any signal whose id already appears as an
 * "Antrean Saya" inbox row is dropped, so the same concern never double-surfaces.
 */
import type { AttentionItem } from "@sekolahpro/ui";
import { deriveStaffActionQueue } from "./orang/staffStats";
import { deriveActionQueue, type SiswaRow } from "./orang/siswaStats";
import type { PegawaiApi } from "../features/pegawai/roles";
import type { BerandaRole } from "./berandaRole";

/** Rombel-scoped counts for the wali_kelas Sinyal panel. */
export interface WaliSignalCounts {
  alpaHariIni?: number;
  nunggakSpp?: number;
  dataIncomplete?: number;
}

/** Inputs for {@link buildSignals}. Only the role-relevant fields are read. */
export interface BerandaSignalsInput {
  role: BerandaRole;
  /** kepala: full pegawai list (school-wide SK/coverage signals). */
  pegawai?: PegawaiApi[];
  /** kepala: full siswa list (calon/mutasi signals). */
  siswa?: SiswaRow[];
  /** wali_kelas: counts scoped to the user's rombel. */
  wali?: WaliSignalCounts;
  /** Ids already shown in the Antrean Saya inbox — excluded from signals. */
  inboxIds?: readonly string[];
}

const ROUTE_ABSENSI_PELAJARAN = "/sch/$sekolah/absensi/pelajaran";
const ROUTE_KEUANGAN = "/sch/$sekolah/keuangan";
const ROUTE_SISWA = "/sch/$sekolah/siswa/daftar";

/** Build the rombel-scoped wali_kelas signals (skips zero counts). */
function waliSignals(c: WaliSignalCounts): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (c.alpaHariIni && c.alpaHariIni > 0) {
    items.push({
      id: "alpa-hari-ini",
      tone: "danger",
      label: "Siswa alpa hari ini",
      description: "Tindak lanjuti dan hubungi wali murid",
      badge: String(c.alpaHariIni),
      actionLabel: "Tindak lanjut",
      actionHref: ROUTE_ABSENSI_PELAJARAN,
    });
  }
  if (c.nunggakSpp && c.nunggakSpp > 0) {
    items.push({
      id: "nunggak-spp",
      tone: "warning",
      label: "Siswa nunggak SPP",
      description: "Ingatkan wali murid soal tagihan tertunggak",
      badge: String(c.nunggakSpp),
      actionLabel: "Lihat",
      actionHref: ROUTE_KEUANGAN,
    });
  }
  if (c.dataIncomplete && c.dataIncomplete > 0) {
    items.push({
      id: "data-tidak-lengkap",
      tone: "info",
      label: "Data siswa belum lengkap",
      description: "Lengkapi berkas/identitas siswa",
      badge: String(c.dataIncomplete),
      actionLabel: "Lengkapi",
      actionHref: ROUTE_SISWA,
    });
  }
  return items;
}

/** Drop signals whose id already appears as an inbox row. */
function dedupeAgainstInbox(items: AttentionItem[], inboxIds: readonly string[]): AttentionItem[] {
  if (inboxIds.length === 0) return items;
  const seen = new Set(inboxIds);
  return items.filter((i) => !seen.has(i.id));
}

/**
 * Build the persona's Sinyal list. kepala reuses the staff/siswa action-queue
 * builders (school-wide); wali_kelas uses rombel-scoped counts; other personas
 * have no Sinyal panel. Inbox ids are deduped out last.
 */
export function buildSignals(input: BerandaSignalsInput): AttentionItem[] {
  let items: AttentionItem[] = [];
  if (input.role === "kepala_sekolah") {
    items = [...deriveStaffActionQueue(input.pegawai ?? []), ...deriveActionQueue(input.siswa ?? [])];
  } else if (input.role === "wali_kelas") {
    items = waliSignals(input.wali ?? {});
  }
  return dedupeAgainstInbox(items, input.inboxIds ?? []);
}
