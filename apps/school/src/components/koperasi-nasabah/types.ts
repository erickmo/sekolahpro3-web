// Shared Nasabah doc shape — mirrors backend nasabah.json fields read by the
// list/detail pages and KYC panel.
export interface NasabahDoc {
  name: string;
  nomor_nasabah?: string;
  pihak_tipe?: string;
  pihak?: string;
  tanggal_registrasi?: string;
  status?: string;
  is_anggota?: 0 | 1;
  kyc_tier?: string;
  source_of_fund?: string;
  tanggal_review_kyc?: string;
  is_pep?: 0 | 1;
  is_high_risk_country?: 0 | 1;
  kyc_review_overdue?: 0 | 1;
  catatan_kyc?: string;
  sekolah?: string;
  koperasi?: string;
}
