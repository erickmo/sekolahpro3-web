/**
 * Live data hooks for the role-adaptive Beranda dashboard.
 *
 * HOOK module (not a pure lib): wraps useResourceList / the keuangan-live hooks
 * and the auth session, then feeds the pure selectors (berandaInbox /
 * berandaSignals) the shapes they need. All cross-doctype number-crunching lives
 * in the pure helpers (./derive, ../berandaInbox, ../berandaSignals) so this file
 * stays thin wiring. Queries are role-gated via the react-query `enabled` option
 * so a guru never fetches finance/oversight data (role-scoped load).
 *
 * School scoping is automatic (the resource layer injects X-Active-Sekolah), so
 * no `sekolah` filter is passed — only user/date/status scoping.
 *
 * v1 wires the high-confidence live sources (rombel, SK, finance, pesan,
 * pengganti, siswa, pegawai, agenda). Per-guru/per-rombel teaching counts that
 * need a user→Pegawai→Slot Jadwal resolution are deferred to v2 and render an
 * honest empty-state rather than a fabricated number (see plan §Keputusan / risiko).
 */
import { useMemo } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import type { AttentionItem } from "@sekolahpro/ui";
import { deriveBerandaRoles, type BerandaRole } from "../berandaRole";
import type { DerivedRoles } from "../sessionRole";
import { buildInbox, type BerandaInboxInput, type BerandaWorkItem } from "../berandaInbox";
import { buildSignals } from "../berandaSignals";
import { useTagihanLive, usePengeluaranLive } from "../../data/keuangan-live";
import type { TagihanRow } from "../../data/keuangan";
import type { PegawaiApi } from "../../features/pegawai/roles";
import type { SiswaRow } from "../orang/siswaStats";
import {
  berandaTodayISO,
  countMissingAbsensiHarian,
  countRombelTanpaWali,
  computeTunggakanBesar,
  type RombelRow,
} from "./derive";

const PEGAWAI_FIELDS = ["name", "is_aktif", "sudah_sertifikasi", "jabatan_fungsional", "roles.role", "jenis_kelamin"];
const TAGIHAN_DONE = new Set(["Lunas", "Dibatalkan"]);

/** A KPI tile in the collapsible "Konteks" strip. */
export interface KonteksMetric {
  label: string;
  value: string;
  hint?: string;
}

/** A row in the "Hari Saya" strip (agenda / deadline / next slot). */
export interface HariSayaItem {
  id: string;
  time?: string;
  title: string;
  subtitle?: string;
}

/** Everything the pure <BerandaView> renders for the active persona. */
export interface BerandaData {
  inbox: BerandaWorkItem[];
  signals: AttentionItem[];
  konteks: KonteksMetric[];
  hariSaya: HariSayaItem[];
  isLoading: boolean;
  isError: boolean;
}

/** Read the logged-in user id from the session, tolerating a missing provider. */
function useSessionUser(): string | null {
  try {
    return useSession().user;
  } catch {
    return null;
  }
}

/** Read the session role strings, tolerating a missing provider. */
function useSessionRoles(): string[] {
  try {
    return useSession().roles ?? [];
  } catch {
    return [];
  }
}

/** Rombels the current user is wali_kelas of (drives the wali_kelas role override + scope). */
export function useMyRombels(): RombelRow[] {
  const user = useSessionUser();
  const q = useResourceList<RombelRow>(
    "Rombongan Belajar",
    {
      fields: ["name", "wali_kelas"],
      filters: user ? [["wali_kelas", "=", user]] : [],
      limit_page_length: 0,
    },
    { enabled: !!user },
  );
  return q.data ?? [];
}

/**
 * Derive the user's Beranda personas + primary. A user who is wali of >=1 rombel
 * gains the wali_kelas persona even without the Frappe "Wali Kelas" role
 * (the role is both a Frappe role AND a data fact — see berandaRole.ts).
 */
export function useBerandaRole(): DerivedRoles<BerandaRole> {
  const raw = useSessionRoles();
  const myRombels = useMyRombels();
  const rawKey = raw.join(",");
  return useMemo(() => {
    const derived = deriveBerandaRoles(raw);
    if (myRombels.length > 0 && !derived.roles.includes("wali_kelas")) {
      return { roles: [...derived.roles, "wali_kelas"], primary: derived.primary };
    }
    return derived;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawKey, myRombels.length]);
}

/** Format a rupiah amount compactly for KPI tiles. */
function rupiah(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

/** Count outstanding (unpaid, not cancelled) invoices — the tu_operator "proses" bucket. */
function pendingTagihanCount(rows: readonly TagihanRow[]): number {
  return rows.filter((t) => !TAGIHAN_DONE.has(t.status) && t.jumlah - t.dibayar > 0).length;
}

/**
 * Orchestrate the live queries for the active persona and assemble the data the
 * dashboard renders. Every query is gated by `enabled` so only the active
 * persona's sources are fetched.
 */
export function useBerandaData(role: BerandaRole, today: string): BerandaData {
  const isKepala = role === "kepala_sekolah";
  const isBendahara = role === "bendahara";
  const isTu = role === "tu_operator";
  const isTeaching = role === "guru" || role === "wali_kelas";

  const rombelQ = useResourceList<RombelRow>(
    "Rombongan Belajar",
    { fields: ["name", "wali_kelas"], limit_page_length: 0 },
    { enabled: isKepala || isTu },
  );
  const absensiHarianQ = useResourceList<{ name: string; rombel?: string }>(
    "Absensi Harian",
    { fields: ["name", "rombel"], filters: [["tanggal", "=", today]], limit_page_length: 0 },
    { enabled: isTu },
  );
  const skQ = useResourceList<{ name: string }>(
    "SK Mengajar",
    { fields: ["name"], filters: [["status_validitas", "=", "Akan Berakhir"]], limit_page_length: 0 },
    { enabled: isKepala },
  );
  const pesanQ = useResourceList<{ name: string }>(
    "Contact Inbox SekolahPro",
    { fields: ["name"], filters: [["status", "!=", "Selesai"]], limit_page_length: 0 },
    { enabled: isTu },
  );
  const penggantiQ = useResourceList<{ name: string }>(
    "Pengganti Guru",
    { fields: ["name"], filters: [["status", "=", "Belum Ditugaskan"]], limit_page_length: 0 },
    { enabled: isTu || isTeaching },
  );
  const siswaQ = useResourceList<SiswaRow>(
    "Siswa",
    { fields: ["name", "status"], limit_page_length: 0 },
    { enabled: isKepala },
  );
  const pegawaiQ = useResourceList<PegawaiApi>(
    "Pegawai",
    { fields: PEGAWAI_FIELDS, limit_page_length: 0 },
    { enabled: isKepala },
  );
  const agendaQ = useResourceList<{ name: string; judul?: string; tanggal_mulai?: string; lokasi?: string }>(
    "Agenda Sekolah",
    { fields: ["name", "judul", "tanggal_mulai", "lokasi"], filters: [["status", "=", "Terbit"]], limit_page_length: 0 },
    { enabled: isKepala },
  );

  // Finance reuses the company-scoped keuangan hooks (they always fetch; only
  // bendahara/kepala DISPLAY the result — a minor extra read, not a correctness issue).
  const tagihan = useTagihanLive();
  const pengeluaran = usePengeluaranLive();

  return useMemo(() => {
    const rombels = rombelQ.data ?? [];
    const tagihanRows = tagihan.rows;

    const inboxInput: BerandaInboxInput = { today, role };
    if (isBendahara) {
      inboxInput.finance = { tagihan: tagihanRows, pengeluaran: pengeluaran.rows, sptDraftCount: 0 };
    }
    if (isKepala) {
      inboxInput.decisions = {
        rombelTanpaWali: countRombelTanpaWali(rombels),
        skAkanBerakhir: (skQ.data ?? []).length,
        tunggakanBesar: computeTunggakanBesar(tagihanRows, today),
      };
    }
    if (isTu) {
      const withAttendance = (absensiHarianQ.data ?? []).map((r) => r.rombel ?? "");
      inboxInput.counts = {
        guruBelumAbsensi: countMissingAbsensiHarian(rombels.map((r) => r.name), withAttendance),
        pembayaranProses: pendingTagihanCount(tagihanRows),
        pesanBelumDibalas: (pesanQ.data ?? []).length,
        penggantiPending: (penggantiQ.data ?? []).length,
      };
    }
    if (isTeaching) {
      // v1: only the substitute/leave status is cleanly queryable without a
      // user->Pegawai->Slot Jadwal resolution; per-guru attendance/grades = v2.
      inboxInput.counts = { penggantiPending: (penggantiQ.data ?? []).length };
    }
    const inbox = buildInbox(inboxInput);

    const signals = buildSignals({
      role,
      ...(isKepala ? { pegawai: pegawaiQ.data ?? [], siswa: siswaQ.data ?? [] } : {}),
      inboxIds: inbox.map((i) => i.id),
    });

    const konteks = buildKonteks(role, {
      totalSiswa: (siswaQ.data ?? []).length,
      tunggakan: computeTunggakanBesar(tagihanRows, today),
      rombelTanpaWali: countRombelTanpaWali(rombels),
    });

    const hariSaya = isKepala ? agendaToday(agendaQ.data ?? [], today) : [];

    return {
      inbox,
      signals,
      konteks,
      hariSaya,
      isLoading: rombelQ.isLoading || tagihan.isLoading || skQ.isLoading || siswaQ.isLoading || agendaQ.isLoading,
      isError: rombelQ.isError || tagihan.isError || pegawaiQ.isError,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    role,
    today,
    rombelQ.data,
    absensiHarianQ.data,
    skQ.data,
    pesanQ.data,
    penggantiQ.data,
    siswaQ.data,
    pegawaiQ.data,
    agendaQ.data,
    tagihan.rows,
    pengeluaran.rows,
    rombelQ.isLoading,
    tagihan.isLoading,
  ]);
}

/** Build the persona's KPI strip from already-computed aggregates. */
function buildKonteks(
  role: BerandaRole,
  agg: { totalSiswa: number; tunggakan: { count: number; total: number }; rombelTanpaWali: number },
): KonteksMetric[] {
  if (role === "kepala_sekolah") {
    return [
      { label: "Total Siswa", value: agg.totalSiswa.toLocaleString("id-ID"), hint: "terdaftar" },
      { label: "Tunggakan", value: rupiah(agg.tunggakan.total), hint: `${agg.tunggakan.count} siswa` },
      { label: "Rombel tanpa wali", value: String(agg.rombelTanpaWali), hint: "perlu ditunjuk" },
    ];
  }
  if (role === "bendahara") {
    return [{ label: "Tunggakan", value: rupiah(agg.tunggakan.total), hint: `${agg.tunggakan.count} siswa` }];
  }
  return [];
}

/** Filter published agenda to today's WIB date and shape for the Hari Saya strip. */
function agendaToday(
  rows: readonly { name: string; judul?: string; tanggal_mulai?: string; lokasi?: string }[],
  today: string,
): HariSayaItem[] {
  return rows
    .filter((r) => (r.tanggal_mulai ?? "").slice(0, 10) === today)
    .map((r) => ({
      id: r.name,
      ...(r.tanggal_mulai && r.tanggal_mulai.length > 10 ? { time: r.tanggal_mulai.slice(11, 16) } : {}),
      title: r.judul ?? r.name,
      ...(r.lokasi ? { subtitle: r.lokasi } : {}),
    }));
}

/** Re-export for convenience: compute the WIB "today" once in the route. */
export { berandaTodayISO };
