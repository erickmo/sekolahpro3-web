/**
 * Pure aggregation/derivation functions for the Pengaturan redesign dashboards.
 *
 * No React, no DB, no session — every function takes plain data in and returns
 * plain data / chart-ready arrays out, so the whole module is trivially
 * unit-testable. Views import these to render StatCards, donuts, gauges, etc.
 */
import type {
  Billing,
  CurrentUsage,
  Integrasi,
  Keamanan,
  NotifikasiPref,
  PengaturanState,
  PengaturanTabKey,
  Peran,
} from "../data/pengaturan";
import type { ChartDatum, DistributionSegment, Tone } from "../components/viz/charts";

const PERCENT_SCALE = 100;
const PERCENT_MIN = 0;
const PERCENT_MAX = 100;

/** Clamp a number into the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Compute a percentage (rounded), guarding against divide-by-zero.
 *
 * @param part the numerator.
 * @param whole the denominator.
 * @returns round(part/whole*100), or 0 when whole is 0.
 */
function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * PERCENT_SCALE);
}

// --- Integrations ----------------------------------------------------------

/** Aggregate connection counts for the integrations grid. */
export interface IntegrationStats {
  terhubung: number;
  belum: number;
  error: number;
  total: number;
  healthPct: number;
}

/**
 * Count integrations by status and derive a health percentage.
 *
 * @param list the integrations.
 * @returns counts plus healthPct = round(terhubung/total*100), 0 when empty.
 */
export function integrationStats(list: Integrasi[]): IntegrationStats {
  const terhubung = list.filter((i) => i.status === "Terhubung").length;
  const belum = list.filter((i) => i.status === "Belum").length;
  const error = list.filter((i) => i.status === "Error").length;
  const total = list.length;
  return { terhubung, belum, error, total, healthPct: pct(terhubung, total) };
}

/**
 * Build a donut dataset for integration status, omitting zero-value buckets.
 *
 * @param list the integrations.
 * @returns toned ChartDatum entries for non-zero buckets only.
 */
export function integrationDonut(list: Integrasi[]): ChartDatum[] {
  const s = integrationStats(list);
  const buckets: ChartDatum[] = [
    { label: "Terhubung", value: s.terhubung, tone: "emerald" },
    { label: "Belum", value: s.belum, tone: "neutral" },
    { label: "Error", value: s.error, tone: "rose" },
  ];
  return buckets.filter((b) => b.value > 0);
}

// --- Security --------------------------------------------------------------

/** One scored security factor (a single hardening check). */
export interface SecurityFactor {
  label: string;
  ok: boolean;
}

/** Overall security posture: 0-100 score, letter grade, and factor breakdown. */
export interface SecurityScore {
  score: number;
  grade: "A" | "B" | "C" | "D";
  factors: SecurityFactor[];
}

const FACTOR_POINTS = 20;
const MIN_PASSWORD_LENGTH = 8;
const MAX_SESSION_TIMEOUT = 60;
const MIN_AUDIT_RETENTION = 180;
const TWO_FA_DISABLED = "Tidak aktif";
const BACKUP_DISABLED = "Tidak aktif";
const GRADE_A_MIN = 90;
const GRADE_B_MIN = 75;
const GRADE_C_MIN = 50;

/**
 * Map a 0-100 security score to a letter grade.
 *
 * @param score the security score.
 * @returns "A" (>=90), "B" (>=75), "C" (>=50), else "D".
 */
export function securityGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= GRADE_A_MIN) return "A";
  if (score >= GRADE_B_MIN) return "B";
  if (score >= GRADE_C_MIN) return "C";
  return "D";
}

/**
 * Score the security policy against 5 hardening factors (20 points each).
 *
 * @param k the security configuration.
 * @returns the score (0-100), grade, and the 5 factor results.
 */
export function securityScore(k: Keamanan): SecurityScore {
  const backupConfigured = k.backupOtomatis.trim() !== "" && k.backupOtomatis !== BACKUP_DISABLED;
  const factors: SecurityFactor[] = [
    { label: "Panjang minimum password ≥ 8", ok: k.panjangMin >= MIN_PASSWORD_LENGTH },
    { label: "2FA aktif", ok: k.dua2faWajib !== TWO_FA_DISABLED },
    { label: "Session timeout ≤ 60 menit", ok: k.sessionTimeout <= MAX_SESSION_TIMEOUT },
    { label: "Backup otomatis aktif", ok: backupConfigured },
    { label: "Retensi audit ≥ 180 hari", ok: k.auditRetensi >= MIN_AUDIT_RETENTION },
  ];
  const score = factors.reduce((sum, f) => sum + (f.ok ? FACTOR_POINTS : 0), 0);
  return { score, grade: securityGrade(score), factors };
}

// --- Roles -----------------------------------------------------------------

const DISTRIBUTION_TONES: readonly Tone[] = ["brand", "emerald", "amber", "violet", "sky", "rose", "neutral"];

/**
 * Build a user-count-per-role dataset, sorted descending, with cycling tones.
 *
 * @param peran the role list.
 * @returns ChartDatum entries (label = role name, value = jumlahUser).
 */
export function roleDistribution(peran: Peran[]): ChartDatum[] {
  return [...peran]
    .sort((a, b) => b.jumlahUser - a.jumlahUser)
    .map((p, i) => ({
      label: p.nama,
      value: p.jumlahUser,
      tone: DISTRIBUTION_TONES[i % DISTRIBUTION_TONES.length] as Tone,
    }));
}

// --- Notifications ---------------------------------------------------------

const NOTIF_CHANNEL_COUNT = 4;

/** Per-channel enabled counts plus an overall coverage percentage. */
export interface NotifCoverage {
  email: number;
  push: number;
  sms: number;
  inApp: number;
  total: number;
  coveragePct: number;
}

/**
 * Count enabled channels per notification preference row.
 *
 * @param prefs the notification preferences.
 * @returns per-channel true counts; coveragePct = round(sumTrue/(total*4)*100).
 */
export function notificationCoverage(prefs: NotifikasiPref[]): NotifCoverage {
  const email = prefs.filter((p) => p.email).length;
  const push = prefs.filter((p) => p.push).length;
  const sms = prefs.filter((p) => p.sms).length;
  const inApp = prefs.filter((p) => p.inApp).length;
  const total = prefs.length;
  const sumTrue = email + push + sms + inApp;
  return { email, push, sms, inApp, total, coveragePct: pct(sumTrue, total * NOTIF_CHANNEL_COUNT) };
}

/**
 * Build a distribution-bar dataset of enabled channels.
 *
 * @param prefs the notification preferences.
 * @returns four toned segments: Email, Push, SMS, In-App.
 */
export function notificationSegments(prefs: NotifikasiPref[]): DistributionSegment[] {
  const cov = notificationCoverage(prefs);
  return [
    { label: "Email", value: cov.email, tone: "brand" },
    { label: "Push", value: cov.push, tone: "emerald" },
    { label: "SMS", value: cov.sms, tone: "amber" },
    { label: "In-App", value: cov.inApp, tone: "violet" },
  ];
}

// --- Plan usage ------------------------------------------------------------

/** A single used/max usage pair with a clamped percentage. */
export interface UsageGauge {
  used: number;
  max: number;
  pct: number;
}

/** Usage gauges for the three plan dimensions. */
export interface PlanUsage {
  siswa: UsageGauge;
  pegawai: UsageGauge;
  storage: UsageGauge;
}

/** Parse the leading numeric value from a storage string like "100 GB". */
function parseStorageMax(penyimpanan: string): number {
  const match = penyimpanan.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

/** Build a usage gauge with a percentage clamped to [0, 100]. */
function gauge(used: number, max: number): UsageGauge {
  return { used, max, pct: clamp(pct(used, max), PERCENT_MIN, PERCENT_MAX) };
}

/**
 * Compare live usage against the billing plan limits.
 *
 * @param billing the subscription plan (limits + storage string).
 * @param usage the live usage counters.
 * @returns per-dimension {@link UsageGauge}s.
 */
export function planUsage(billing: Billing, usage: CurrentUsage): PlanUsage {
  return {
    siswa: gauge(usage.siswaAktif, billing.maksSiswa),
    pegawai: gauge(usage.pegawaiAktif, billing.maksPegawai),
    storage: gauge(usage.storageGB, parseStorageMax(billing.penyimpanan)),
  };
}

// --- Setup completeness ----------------------------------------------------

/** One onboarding/setup check and the tab that fixes it. */
export interface SetupItem {
  label: string;
  tab: PengaturanTabKey;
  done: boolean;
}

/** Overall setup progress with the per-item breakdown. */
export interface SetupCompleteness {
  pct: number;
  total: number;
  done: number;
  items: SetupItem[];
}

/**
 * Evaluate onboarding-relevant configuration checks across the settings state.
 *
 * @param state the aggregate settings state.
 * @returns the checklist items and the completion percentage.
 */
export function setupCompleteness(state: PengaturanState): SetupCompleteness {
  const items: SetupItem[] = [
    {
      label: "Identitas sekolah (nama & NPSN) terisi",
      tab: "sekolah",
      done: state.identitas.nama.trim() !== "" && state.identitas.npsn.trim() !== "",
    },
    {
      label: "Email kontak sekolah terisi",
      tab: "sekolah",
      done: state.alamat.email.trim() !== "",
    },
    {
      label: "Tahun ajaran aktif ditetapkan",
      tab: "akademik",
      done: state.tahun.tahun.trim() !== "",
    },
    {
      label: "Skala penilaian dikonfigurasi",
      tab: "akademik",
      done: state.skala.aMin > 0 && state.skala.bMin > 0 && state.skala.cMin > 0,
    },
    {
      label: "Minimal satu integrasi terhubung",
      tab: "integrasi",
      done: state.integrasi.some((i) => i.status === "Terhubung"),
    },
    {
      label: "2FA diaktifkan",
      tab: "keamanan",
      done: state.keamanan.dua2faWajib !== TWO_FA_DISABLED,
    },
    {
      label: "Paket berlangganan dipilih",
      tab: "billing",
      done: state.billing.paket.trim() !== "",
    },
  ];
  const done = items.filter((i) => i.done).length;
  return { pct: pct(done, items.length), total: items.length, done, items };
}

// --- Module / feature-flag counts -----------------------------------------

/** A generic active/total count with its percentage. */
export interface CountStat {
  aktif: number;
  total: number;
  pct: number;
}

/**
 * Count active modules (aktif === 1) out of all rows.
 *
 * @param rows module rows carrying an optional `aktif` flag.
 * @returns the active/total counts and percentage.
 */
export function moduleStats(rows: { aktif?: number }[]): CountStat {
  const aktif = rows.filter((r) => r.aktif === 1).length;
  const total = rows.length;
  return { aktif, total, pct: pct(aktif, total) };
}

/**
 * Count enabled feature flags (enabled === 1) out of all rows.
 *
 * @param rows feature-flag rows carrying an optional `enabled` flag.
 * @returns the active/total counts and percentage.
 */
export function flagStats(rows: { enabled?: number }[]): CountStat {
  const aktif = rows.filter((r) => r.enabled === 1).length;
  const total = rows.length;
  return { aktif, total, pct: pct(aktif, total) };
}
