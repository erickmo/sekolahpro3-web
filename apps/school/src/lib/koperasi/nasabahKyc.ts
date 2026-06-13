/**
 * Pure helpers for the Nasabah KYC contract (PPATK PMK 1/2023).
 *
 * Mirrors backend rules — single sources of truth:
 *   - sekolahpro/koperasi/doctype/nasabah/nasabah.py
 *     (_AUTO_HIGH_FLAGS: is_pep OR is_high_risk_country ⇒ tier High;
 *      source_of_fund wajib untuk Medium/High)
 *   - sekolahpro/koperasi/utils/kyc_review.py
 *     (interval review: Medium 365 hari, High 180 hari; Low tidak direview;
 *      tanggal_review_kyc kosong pada tier reviewable = overdue)
 * Server tetap otoritatif; mirror ini hanya untuk UX instan + worklist.
 */

export type KycTier = "Low" | "Medium" | "High";
export type NasabahStatus = "Aktif" | "Tidak Aktif";

export const KYC_TIERS: readonly KycTier[] = ["Low", "Medium", "High"];
export const NASABAH_STATUSES: readonly NasabahStatus[] = ["Aktif", "Tidak Aktif"];

/** Exact backend Select values (minus the leading blank option). */
export const SOURCE_OF_FUND_OPTIONS: readonly string[] = [
  "Gaji",
  "Usaha",
  "Warisan",
  "Hibah",
  "Investasi",
  "Lainnya",
];

/**
 * Person doctypes a Nasabah may point to (pihak_tipe allowlist). The Dynamic
 * Link technically accepts any DocType; UI membatasi ke tipe orang yang nyata
 * ada di bench ini. labelField = kolom nama untuk SearchableSelect.
 */
export const PIHAK_TIPE_OPTIONS: ReadonlyArray<{
  doctype: string;
  label: string;
  labelField: string;
}> = [
  { doctype: "Siswa", label: "Siswa", labelField: "nama_lengkap" },
  { doctype: "Pegawai", label: "Pegawai (Guru/Staf)", labelField: "nama_lengkap" },
  { doctype: "User", label: "User Sistem", labelField: "full_name" },
];

// Review intervals per kyc_review.py.
const REVIEW_INTERVAL_DAYS: Record<KycTier, number | null> = {
  Low: null,
  Medium: 365,
  High: 180,
};

const DAY_MS = 86_400_000;

/** Shift an ISO yyyy-mm-dd date by `days` using UTC math (stable in tests). */
function addDaysIso(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Tier yang berlaku setelah aturan auto-elevation (PEP / negara FATF ⇒ High). */
export function effectiveKycTier(args: {
  tier: KycTier;
  isPep: boolean;
  isHighRiskCountry: boolean;
}): KycTier {
  return args.isPep || args.isHighRiskCountry ? "High" : args.tier;
}

/** True bila tier terkunci High oleh flag (select tier harus disabled). */
export function isTierLockedHigh(args: { isPep: boolean; isHighRiskCountry: boolean }): boolean {
  return args.isPep || args.isHighRiskCountry;
}

/** Sumber dana wajib untuk tier Medium dan High (PMK 1/2023 ps.18(3)). */
export function isSourceOfFundRequired(tier: KycTier): boolean {
  return tier === "Medium" || tier === "High";
}

/** Tanggal jatuh tempo review berikutnya, atau null bila tier tak direview. */
export function kycReviewDueDate(tier: KycTier, lastReview: string | undefined | null): string | null {
  const interval = REVIEW_INTERVAL_DAYS[tier];
  if (interval === null) return null;
  if (!lastReview) return null;
  return addDaysIso(lastReview, interval);
}

/**
 * Overdue mirror dari scheduler kyc_review.py: Low tidak pernah overdue;
 * tier reviewable tanpa tanggal review = overdue; selebihnya bandingkan
 * due-date dengan `today` (ISO compare aman secara leksikografis).
 */
export function isKycReviewOverdue(args: {
  tier: KycTier;
  lastReview: string | undefined | null;
  today: string;
}): boolean {
  if (REVIEW_INTERVAL_DAYS[args.tier] === null) return false;
  if (!args.lastReview) return true;
  const due = kycReviewDueDate(args.tier, args.lastReview);
  return due !== null && due < args.today;
}

export interface NasabahPayloadInput {
  pihakTipe: string;
  pihak: string;
  status: NasabahStatus;
  tier: KycTier;
  isPep: boolean;
  isHighRiskCountry: boolean;
  sourceOfFund?: string;
  tanggalReviewKyc?: string;
  catatanKyc?: string;
  /**
   * Sekolah asal pihak (Siswa/Pegawai membawa sekolah sendiri). Optional —
   * bila kosong, backend menurunkan dari koperasi aktif (tenant hook).
   */
  sekolah?: string;
}

/** Build create payload dengan key backend persis + tier ter-elevasi. */
export function buildNasabahPayload(input: NasabahPayloadInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    pihak_tipe: input.pihakTipe,
    pihak: input.pihak,
    status: input.status,
    kyc_tier: effectiveKycTier({
      tier: input.tier,
      isPep: input.isPep,
      isHighRiskCountry: input.isHighRiskCountry,
    }),
    is_pep: input.isPep ? 1 : 0,
    is_high_risk_country: input.isHighRiskCountry ? 1 : 0,
  };
  if (input.sourceOfFund?.trim()) out["source_of_fund"] = input.sourceOfFund.trim();
  if (input.tanggalReviewKyc?.trim()) out["tanggal_review_kyc"] = input.tanggalReviewKyc.trim();
  if (input.catatanKyc?.trim()) out["catatan_kyc"] = input.catatanKyc.trim();
  if (input.sekolah?.trim()) out["sekolah"] = input.sekolah.trim();
  return out;
}
