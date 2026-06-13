import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  FormField,
  Modal,
  SearchableSelect,
  Textarea,
} from "@sekolahpro/ui";
import {
  getResource,
  humanizeFrappeError,
  listResource,
  useResourceCreate,
} from "@sekolahpro/api-client";
import {
  KYC_TIERS,
  PIHAK_TIPE_OPTIONS,
  SOURCE_OF_FUND_OPTIONS,
  buildNasabahPayload,
  effectiveKycTier,
  isSourceOfFundRequired,
  isTierLockedHigh,
  type KycTier,
} from "../../lib/koperasi/nasabahKyc";
import { FormSection } from "../shared/FormSection";
import { DynamicLinkPicker } from "../shared/DynamicLinkPicker";

const DOCTYPE = "Nasabah";

// Review dates stay near the present.
const MIN_YEAR = new Date().getFullYear() - 5;
const MAX_YEAR = new Date().getFullYear() + 1;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

/**
 * Daftarkan Nasabah baru (identitas + profil KYC PPATK PMK 1/2023).
 *
 * Backend contract: { pihak_tipe*, pihak*, status*, kyc_tier*,
 * source_of_fund (wajib utk Medium/High), is_pep, is_high_risk_country,
 * tanggal_review_kyc?, catatan_kyc?, sekolah? }. PEP / negara FATF mengunci
 * tier ke High (mirror controller). Duplikat pihak dicek client-side
 * (backend menerima duplikat — guard di sini mencegah dobel input kasir).
 */
export function NasabahFormModal({ open, onClose, onCreated }: Props) {
  const [pihakTipe, setPihakTipe] = useState<string>(PIHAK_TIPE_OPTIONS[0]!.doctype);
  const [pihak, setPihak] = useState("");
  const [tier, setTier] = useState<KycTier>("Low");
  const [isPep, setIsPep] = useState(false);
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [sourceOfFund, setSourceOfFund] = useState("");
  const [tanggalReview, setTanggalReview] = useState("");
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [warn, setWarn] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(DOCTYPE);

  const locked = isTierLockedHigh({ isPep, isHighRiskCountry: isHighRisk });
  const shownTier = effectiveKycTier({ tier, isPep, isHighRiskCountry: isHighRisk });
  const sourceRequired = isSourceOfFundRequired(shownTier);

  const reset = () => {
    setPihak("");
    setTier("Low");
    setIsPep(false);
    setIsHighRisk(false);
    setSourceOfFund("");
    setTanggalReview("");
    setCatatan("");
    setErr({});
    setWarn(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pihak) errs.pihak = "Wajib";
    if (sourceRequired && !sourceOfFund) errs.source = "Wajib untuk tier Medium/High";
    if (Object.keys(errs).length) {
      setErr(errs);
      return;
    }
    setErr({});
    setWarn(null);
    setSubmitting(true);
    try {
      // Guard duplikat: satu pihak idealnya satu Nasabah.
      const dup = await listResource<{ name: string }>(DOCTYPE, {
        fields: ["name"],
        filters: [
          ["pihak_tipe", "=", pihakTipe],
          ["pihak", "=", pihak],
        ],
        limit_page_length: 1,
      });
      if (dup.length > 0) {
        setWarn(`Pihak ini sudah terdaftar sebagai nasabah ${dup[0]!.name}.`);
        setSubmitting(false);
        return;
      }
      // Anchor sekolah ke sekolah asal pihak bila ada (Siswa/Pegawai membawa
      // field sekolah); selain itu backend menurunkan dari koperasi aktif.
      let pihakSekolah: string | undefined;
      try {
        const pihakDoc = await getResource<{ sekolah?: string }>(pihakTipe, pihak);
        if (typeof pihakDoc.sekolah === "string" && pihakDoc.sekolah) pihakSekolah = pihakDoc.sekolah;
      } catch {
        // Pihak tanpa akses baca detail — biarkan backend yang menurunkan.
      }
      const payload = buildNasabahPayload({
        pihakTipe,
        pihak,
        status: "Aktif",
        tier,
        isPep,
        isHighRiskCountry: isHighRisk,
        ...(sourceOfFund ? { sourceOfFund } : {}),
        ...(tanggalReview ? { tanggalReviewKyc: tanggalReview } : {}),
        ...(catatan ? { catatanKyc: catatan } : {}),
        ...(pihakSekolah ? { sekolah: pihakSekolah } : {}),
      });
      const doc = await create.mutateAsync(payload);
      void qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
      reset();
      onCreated?.(doc.name);
      onClose();
    } catch (e2) {
      setWarn(humanizeFrappeError(e2) ?? (e2 instanceof Error ? e2.message : "Gagal mendaftarkan nasabah"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daftarkan Nasabah"
      description="Identitas pihak + profil KYC. Tanda * wajib diisi."
      size="mega"
      tone="brand"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={submitting} onClick={(e) => void submit(e as unknown as FormEvent)}>
            {submitting ? "Menyimpan..." : "Daftarkan"}
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-5">
        <FormSection
          title="Identitas Pihak"
          description="Siapa orang di balik nasabah ini. Nomor nasabah dibuat otomatis (NSB-…)."
        >
          <DynamicLinkPicker
            options={PIHAK_TIPE_OPTIONS}
            doctype={pihakTipe}
            onDoctypeChange={setPihakTipe}
            value={pihak}
            onValueChange={setPihak}
            typeLabel="Tipe Pihak"
            valueLabel="Pihak"
            required
            valueError={err.pihak}
          />
        </FormSection>

        <FormSection
          title="Profil KYC — PPATK PMK 1/2023"
          description="PEP atau negara risiko tinggi FATF otomatis menaikkan tier ke High (EDD wajib)."
        >
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
          <FormField
            label="Sumber Dana"
            {...(sourceRequired ? { required: true } : {})}
            error={err.source}
            hint="Wajib untuk tier Medium dan High."
          >
            <SearchableSelect
              value={sourceOfFund}
              onChange={setSourceOfFund}
              options={SOURCE_OF_FUND_OPTIONS.map((s) => ({ value: s, label: s }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="PEP (Politically Exposed Person)">
            <Checkbox checked={isPep} onChange={(e) => setIsPep(e.target.checked)} label="Pejabat publik / keluarga inti pejabat" />
          </FormField>
          <FormField label="Negara Risiko Tinggi (FATF)">
            <Checkbox checked={isHighRisk} onChange={(e) => setIsHighRisk(e.target.checked)} label="Masuk daftar FATF grey/black list" />
          </FormField>
          <FormField label="Tanggal Review KYC Terakhir" hint="Medium: review tiap 12 bulan; High: tiap 6 bulan.">
            <DatePicker
              value={tanggalReview}
              onChange={setTanggalReview}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Catatan KYC" className="col-span-2">
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} placeholder="Catatan due diligence (opsional)" />
          </FormField>
        </FormSection>

        {warn ? <Alert tone="warning" statusRole>{warn}</Alert> : null}
      </form>
    </Modal>
  );
}
