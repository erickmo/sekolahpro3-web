import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  DatePicker,
  FormField,
  FormGrid,
  SearchableSelect,
  SectionCard,
  Textarea,
} from "@sekolahpro/ui";
import { humanizeFrappeError, useResourceUpdate } from "@sekolahpro/api-client";
import {
  KYC_TIERS,
  SOURCE_OF_FUND_OPTIONS,
  effectiveKycTier,
  isKycReviewOverdue,
  isSourceOfFundRequired,
  isTierLockedHigh,
  kycReviewDueDate,
  type KycTier,
} from "../../lib/koperasi/nasabahKyc";
import type { NasabahDoc } from "./types";

const DOCTYPE = "Nasabah";
const MIN_YEAR = new Date().getFullYear() - 5;
const MAX_YEAR = new Date().getFullYear() + 1;

export const KYC_TIER_TONE: Record<string, "neutral" | "warning" | "danger"> = {
  Low: "neutral",
  Medium: "warning",
  High: "danger",
};

/**
 * Panel KYC editable pada detail Nasabah. Menyimpan via PATCH; setelah
 * sukses SELALU refetch dokumen — hook sanctions-screening backend bisa
 * menaikkan tier/PEP setelah save, jadi state lokal tidak boleh dipercaya.
 */
export function KycPanel({ doc, onSaved }: { doc: NasabahDoc; onSaved?: () => void }) {
  const qc = useQueryClient();
  const update = useResourceUpdate(DOCTYPE);
  const [tier, setTier] = useState<KycTier>((doc.kyc_tier as KycTier) ?? "Low");
  const [isPep, setIsPep] = useState(Boolean(doc.is_pep));
  const [isHighRisk, setIsHighRisk] = useState(Boolean(doc.is_high_risk_country));
  const [sourceOfFund, setSourceOfFund] = useState(doc.source_of_fund ?? "");
  const [tanggalReview, setTanggalReview] = useState(doc.tanggal_review_kyc ?? "");
  const [catatan, setCatatan] = useState(doc.catatan_kyc ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sinkronkan form saat dokumen di-refetch (mis. setelah sanctions hook).
  useEffect(() => {
    setTier((doc.kyc_tier as KycTier) ?? "Low");
    setIsPep(Boolean(doc.is_pep));
    setIsHighRisk(Boolean(doc.is_high_risk_country));
    setSourceOfFund(doc.source_of_fund ?? "");
    setTanggalReview(doc.tanggal_review_kyc ?? "");
    setCatatan(doc.catatan_kyc ?? "");
  }, [doc]);

  const locked = isTierLockedHigh({ isPep, isHighRiskCountry: isHighRisk });
  const shownTier = effectiveKycTier({ tier, isPep, isHighRiskCountry: isHighRisk });
  const sourceRequired = isSourceOfFundRequired(shownTier);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = isKycReviewOverdue({ tier: shownTier, lastReview: tanggalReview, today });
  const dueDate = kycReviewDueDate(shownTier, tanggalReview);

  const save = () => {
    if (sourceRequired && !sourceOfFund) {
      setError("Sumber dana wajib diisi untuk tier Medium/High.");
      return;
    }
    setError(null);
    setSaved(false);
    update.mutate(
      {
        name: doc.name,
        patch: {
          kyc_tier: shownTier,
          is_pep: isPep ? 1 : 0,
          is_high_risk_country: isHighRisk ? 1 : 0,
          source_of_fund: sourceOfFund,
          tanggal_review_kyc: tanggalReview || null,
          catatan_kyc: catatan,
        },
      },
      {
        onSuccess: () => {
          setSaved(true);
          // Refetch wajib: sanctions hook bisa mengubah tier/PEP server-side.
          void qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE] });
          void qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
          onSaved?.();
        },
        onError: (e) =>
          setError(humanizeFrappeError(e) ?? (e instanceof Error ? e.message : "Gagal menyimpan KYC")),
      },
    );
  };

  return (
    <SectionCard
      title="Profil KYC"
      description="PPATK PMK 1/2023 — PEP / negara FATF otomatis tier High."
    >
      <div className="space-y-4">
        {overdue ? (
          <Alert tone="warning" title="Review KYC jatuh tempo" statusRole>
            {tanggalReview
              ? `Review terakhir ${tanggalReview} — sudah melewati interval tier ${shownTier}.`
              : `Tier ${shownTier} wajib review berkala, tetapi belum pernah tercatat review.`}
            {" "}Perbarui tanggal review setelah due diligence selesai.
          </Alert>
        ) : dueDate ? (
          <p className="text-xs text-muted-fg">Review berikutnya paling lambat {dueDate}.</p>
        ) : null}
        <FormGrid cols={2}>
          <FormField
            label="Tier KYC"
            required
            {...(locked ? { hint: "Terkunci High karena flag PEP / negara risiko tinggi." } : {})}
          >
            <SearchableSelect
              value={shownTier}
              onChange={(v) => setTier(v as KycTier)}
              options={KYC_TIERS.map((t) => ({ value: t, label: t }))}
              placeholder="— pilih —"
              disabled={locked}
            />
          </FormField>
          <FormField label="Sumber Dana" {...(sourceRequired ? { required: true } : {})}>
            <SearchableSelect
              value={sourceOfFund}
              onChange={setSourceOfFund}
              options={SOURCE_OF_FUND_OPTIONS.map((s) => ({ value: s, label: s }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="PEP">
            <Checkbox checked={isPep} onChange={(e) => setIsPep(e.target.checked)} label="Politically Exposed Person" />
          </FormField>
          <FormField label="Negara Risiko Tinggi (FATF)">
            <Checkbox checked={isHighRisk} onChange={(e) => setIsHighRisk(e.target.checked)} label="FATF grey/black list" />
          </FormField>
          <FormField label="Tanggal Review KYC Terakhir">
            <DatePicker
              value={tanggalReview}
              onChange={setTanggalReview}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Status Review">
            {overdue ? (
              <Badge tone="danger" dot>Overdue</Badge>
            ) : shownTier === "Low" ? (
              <Badge tone="neutral">Tidak wajib review</Badge>
            ) : (
              <Badge tone="success" dot>Terjadwal</Badge>
            )}
          </FormField>
          <FormField label="Catatan KYC" className="col-span-2">
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Catatan due diligence…" />
          </FormField>
        </FormGrid>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {saved && !error ? (
          <p className="text-xs text-emerald-600">Profil KYC tersimpan.</p>
        ) : null}
        <div className="flex justify-end">
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? "Menyimpan..." : "Simpan KYC"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
