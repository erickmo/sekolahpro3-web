import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  FormField,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import {
  humanizeFrappeError,
  useResourceCreate,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

const DOCTYPE = "E-Money Wallet";

// Default batas saldo wallet (mirror default backend 2 juta).
const DEFAULT_BATAS = 2_000_000;
// Auto top-up nominal mengikuti batas Top Up backend (1rb..10jt).
const TOPUP_MIN = 1_000;
const TOPUP_MAX = 10_000_000;

export interface WalletEditable {
  name: string;
  kartu: string;
  batas_saldo?: number;
  auto_topup?: 0 | 1;
  threshold_topup?: number;
  nominal_topup?: number;
  rekening_sumber?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edit mode: wallet yang sudah ada. Tanpa ini = create. */
  wallet?: WalletEditable;
  onSaved?: (name: string) => void;
}

/**
 * Buat / ubah E-Money Wallet. Backend contract: { kartu* (emoney, unik per
 * wallet — create-only), batas_saldo* (>0), auto_topup, threshold_topup,
 * nominal_topup, rekening_sumber }. `saldo` TIDAK PERNAH dikirim — read-only,
 * dimiliki mesin debit/credit/recompute backend. Saat auto top-up menyala,
 * ketiga isiannya wajib (backend tidak memvalidasi — scheduler hanya no-op
 * diam-diam bila konfigurasi pincang).
 */
export function WalletFormModal({ open, onClose, wallet, onSaved }: Props) {
  const isEdit = Boolean(wallet);
  const [kartu, setKartu] = useState(wallet?.kartu ?? "");
  const [batas, setBatas] = useState(String(wallet?.batas_saldo ?? DEFAULT_BATAS));
  const [autoTopup, setAutoTopup] = useState(Boolean(wallet?.auto_topup));
  const [threshold, setThreshold] = useState(wallet?.threshold_topup ? String(wallet.threshold_topup) : "");
  const [nominal, setNominal] = useState(wallet?.nominal_topup ? String(wallet.nominal_topup) : "");
  const [rekening, setRekening] = useState(wallet?.rekening_sumber ?? "");
  const [err, setErr] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(DOCTYPE);
  const update = useResourceUpdate<{ name: string }>(DOCTYPE);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const batasN = Number(batas);
    const thresholdN = Number(threshold);
    const nominalN = Number(nominal);
    if (!isEdit && !kartu) errs.kartu = "Wajib";
    if (!batasN || batasN <= 0) errs.batas = "Harus > 0";
    if (autoTopup) {
      if (!thresholdN || thresholdN <= 0) errs.threshold = "Wajib saat auto top-up aktif";
      if (!nominalN || nominalN < TOPUP_MIN || nominalN > TOPUP_MAX) {
        errs.nominal = `Rp ${TOPUP_MIN.toLocaleString("id-ID")} – ${TOPUP_MAX.toLocaleString("id-ID")}`;
      }
      if (!rekening) errs.rekening = "Wajib saat auto top-up aktif";
    }
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    setError(null);
    const payload: Record<string, unknown> = {
      batas_saldo: batasN,
      auto_topup: autoTopup ? 1 : 0,
    };
    if (autoTopup) {
      payload["threshold_topup"] = thresholdN;
      payload["nominal_topup"] = nominalN;
      payload["rekening_sumber"] = rekening;
    } else if (rekening) {
      payload["rekening_sumber"] = rekening;
    }
    const onOk = (name: string) => {
      void qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
      void qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE] });
      onSaved?.(name);
      onClose();
    };
    const onFail = (e2: unknown) =>
      setError(humanizeFrappeError(e2) ?? (e2 instanceof Error ? e2.message : "Gagal menyimpan wallet"));
    if (isEdit) {
      update.mutate({ name: wallet!.name, patch: payload }, { onSuccess: (d) => onOk(d.name ?? wallet!.name), onError: onFail });
    } else {
      payload["kartu"] = kartu;
      create.mutate(payload, { onSuccess: (d) => onOk(d.name), onError: onFail });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Ubah Wallet ${wallet!.name}` : "Buat Wallet E-Money"}
      description="Satu kartu e-money = satu wallet. Tanda * wajib diisi."
      size="mega"
      tone="brand"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={pending} onClick={(e) => submit(e as unknown as FormEvent)}>
            {pending ? "Menyimpan..." : isEdit ? "Simpan" : "Buat Wallet"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <FormSection
          title="Kartu & Batas"
          description="Kartu bertipe emoney; batas saldo membatasi total dana di wallet."
        >
          <FormField label="Kartu" required error={err.kartu}
            {...(isEdit ? { hint: "Kartu tidak bisa diganti setelah wallet dibuat." } : {})}
          >
            {isEdit ? (
              <Input value={kartu} disabled />
            ) : (
              <SearchableSelect
                value={kartu}
                onChange={setKartu}
                loadOptions={(q) => searchLink("Kartu", "uid_nfc", q, [["tipe_kartu", "=", "emoney"]])}
                placeholder="Cari kartu e-money…"
              />
            )}
          </FormField>
          <FormField label="Batas Saldo (Rp)" required error={err.batas}>
            <Input inputMode="numeric" value={batas} onChange={(e) => setBatas(e.target.value.replace(/\D/g, ""))} />
          </FormField>
        </FormSection>
        <FormSection
          title="Auto Top-up"
          description="Isi otomatis dari rekening simpanan saat saldo turun di bawah ambang."
        >
          <FormField label="Status" className="col-span-2">
            <Checkbox
              checked={autoTopup}
              onChange={(e) => setAutoTopup(e.target.checked)}
              label="Aktifkan auto top-up"
            />
          </FormField>
          {autoTopup ? (
            <>
              <FormField label="Ambang Saldo (Rp)" required error={err.threshold} hint="Auto top-up jalan saat saldo < ambang.">
                <Input inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value.replace(/\D/g, ""))} />
              </FormField>
              <FormField label="Nominal Top-up (Rp)" required error={err.nominal}>
                <Input inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} />
              </FormField>
              <FormField label="Rekening Sumber" required error={err.rekening} className="col-span-2">
                <SearchableSelect
                  value={rekening}
                  onChange={setRekening}
                  loadOptions={(q) => searchLink("Rekening Simpanan", "name", q)}
                  placeholder="Cari rekening…"
                />
              </FormField>
            </>
          ) : null}
        </FormSection>
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
