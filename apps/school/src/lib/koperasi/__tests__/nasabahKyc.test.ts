import { describe, it, expect } from "vitest";
import {
  KYC_TIERS,
  SOURCE_OF_FUND_OPTIONS,
  PIHAK_TIPE_OPTIONS,
  effectiveKycTier,
  isSourceOfFundRequired,
  isTierLockedHigh,
  kycReviewDueDate,
  isKycReviewOverdue,
  buildNasabahPayload,
} from "../nasabahKyc";

// Mirrors backend nasabah.py + utils/kyc_review.py:
//   - is_pep OR is_high_risk_country ⇒ tier auto-elevates to High
//   - source_of_fund required for Medium AND High
//   - review interval: Medium 365 hari, High 180 hari; Low tidak pernah due
//   - null tanggal_review_kyc pada tier reviewable ⇒ overdue

describe("effectiveKycTier / isTierLockedHigh", () => {
  it("elevates to High when is_pep", () => {
    expect(effectiveKycTier({ tier: "Low", isPep: true, isHighRiskCountry: false })).toBe("High");
    expect(isTierLockedHigh({ isPep: true, isHighRiskCountry: false })).toBe(true);
  });

  it("elevates to High when is_high_risk_country", () => {
    expect(effectiveKycTier({ tier: "Medium", isPep: false, isHighRiskCountry: true })).toBe("High");
    expect(isTierLockedHigh({ isPep: false, isHighRiskCountry: true })).toBe(true);
  });

  it("keeps the chosen tier when no elevation flag", () => {
    expect(effectiveKycTier({ tier: "Medium", isPep: false, isHighRiskCountry: false })).toBe("Medium");
    expect(isTierLockedHigh({ isPep: false, isHighRiskCountry: false })).toBe(false);
  });
});

describe("isSourceOfFundRequired", () => {
  it("requires source for Medium and High, not Low", () => {
    expect(isSourceOfFundRequired("Low")).toBe(false);
    expect(isSourceOfFundRequired("Medium")).toBe(true);
    expect(isSourceOfFundRequired("High")).toBe(true);
  });
});

describe("kycReviewDueDate / isKycReviewOverdue", () => {
  it("Low is never overdue, even without a review date", () => {
    expect(kycReviewDueDate("Low", "2025-01-01")).toBeNull();
    expect(isKycReviewOverdue({ tier: "Low", lastReview: undefined, today: "2026-06-13" })).toBe(false);
  });

  it("Medium due 365 days after last review", () => {
    expect(kycReviewDueDate("Medium", "2025-06-13")).toBe("2026-06-13");
    expect(isKycReviewOverdue({ tier: "Medium", lastReview: "2025-06-13", today: "2026-06-13" })).toBe(false);
    expect(isKycReviewOverdue({ tier: "Medium", lastReview: "2025-06-12", today: "2026-06-13" })).toBe(true);
  });

  it("High due 180 days after last review", () => {
    expect(kycReviewDueDate("High", "2026-01-01")).toBe("2026-06-30");
    expect(isKycReviewOverdue({ tier: "High", lastReview: "2026-01-01", today: "2026-06-13" })).toBe(false);
    expect(isKycReviewOverdue({ tier: "High", lastReview: "2025-12-01", today: "2026-06-13" })).toBe(true);
  });

  it("reviewable tier without a review date is overdue", () => {
    expect(isKycReviewOverdue({ tier: "Medium", lastReview: undefined, today: "2026-06-13" })).toBe(true);
    expect(isKycReviewOverdue({ tier: "High", lastReview: "", today: "2026-06-13" })).toBe(true);
  });
});

describe("buildNasabahPayload", () => {
  const base = {
    pihakTipe: "Siswa",
    pihak: "S-001",
    status: "Aktif" as const,
    tier: "Low" as const,
    isPep: false,
    isHighRiskCountry: false,
  };

  it("emits the exact backend keys with effective tier", () => {
    expect(buildNasabahPayload(base)).toEqual({
      pihak_tipe: "Siswa",
      pihak: "S-001",
      status: "Aktif",
      kyc_tier: "Low",
      is_pep: 0,
      is_high_risk_country: 0,
    });
  });

  it("applies auto-elevation and optional fields", () => {
    const p = buildNasabahPayload({
      ...base,
      isPep: true,
      sourceOfFund: "Gaji",
      tanggalReviewKyc: "2026-06-01",
      catatanKyc: "EDD selesai",
      sekolah: "SCH-001",
    });
    expect(p).toMatchObject({
      kyc_tier: "High",
      is_pep: 1,
      source_of_fund: "Gaji",
      tanggal_review_kyc: "2026-06-01",
      catatan_kyc: "EDD selesai",
      sekolah: "SCH-001",
    });
  });

  it("omits empty optionals", () => {
    const p = buildNasabahPayload({ ...base, sourceOfFund: "", catatanKyc: "  " });
    expect("source_of_fund" in p).toBe(false);
    expect("catatan_kyc" in p).toBe(false);
    expect("sekolah" in p).toBe(false);
  });
});

describe("constants", () => {
  it("exposes exact backend select values", () => {
    expect(KYC_TIERS).toEqual(["Low", "Medium", "High"]);
    expect(SOURCE_OF_FUND_OPTIONS).toEqual(["Gaji", "Usaha", "Warisan", "Hibah", "Investasi", "Lainnya"]);
    expect(PIHAK_TIPE_OPTIONS.map((o) => o.doctype)).toEqual(["Siswa", "Pegawai", "User"]);
  });
});
