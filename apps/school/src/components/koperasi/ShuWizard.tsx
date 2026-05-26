import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import {
  computeShu,
  distributeEqually,
  totalDistributed,
  validateStep1,
  validateStep3,
  type ItemShuRow,
  type WizardStep1Input,
} from "../../lib/koperasi/shuWizard";

/**
 * SHU Wizard 4-step:
 *   1. Setup  — periode, shu_total, pct_cadangan
 *   2. Preview — cadangan + shu_dibagikan (read-only)
 *   3. Distribusi — load anggota aktif, equal split default, user edit
 *   4. Submit — create Pembagian SHU + items[]
 */

type AnggotaRow = { name: string; nomor_anggota?: string; nasabah?: string };

interface ShuWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (name: string) => void;
}

const STEPS = ["Setup", "Preview", "Distribusi", "Submit"] as const;

function rupiah(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

export function ShuWizard({ open, onClose, onSuccess }: ShuWizardProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [periode, setPeriode] = useState("");
  const [shuTotalStr, setShuTotalStr] = useState("");
  const [pctCadanganStr, setPctCadanganStr] = useState("25");
  const [items, setItems] = useState<ItemShuRow[]>([]);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1: WizardStep1Input = {
    periode,
    shu_total: Number(shuTotalStr) || 0,
    pct_cadangan: Number(pctCadanganStr) || 0,
  };
  const computed = computeShu(step1);

  const anggotaQ = useResourceList<AnggotaRow>(
    "Anggota Koperasi",
    {
      fields: ["name", "nomor_anggota", "nasabah"],
      filters: [["status", "=", "Aktif"]],
      limit_page_length: 0,
    },
    { enabled: step >= 2 },
  );

  // Seed items pertama kali enter step 3.
  useEffect(() => {
    if (step !== 2 || touched) return;
    const list = anggotaQ.data;
    if (!list) return;
    setItems(distributeEqually(list.map((a) => a.name), computed.shu_dibagikan));
  }, [step, anggotaQ.data, computed.shu_dibagikan, touched]);

  const create = useResourceCreate<{ name: string }>("Pembagian SHU");

  const reset = () => {
    setStep(0);
    setPeriode("");
    setShuTotalStr("");
    setPctCadanganStr("25");
    setItems([]);
    setTouched(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const next = () => {
    setError(null);
    if (step === 0) {
      const err = validateStep1(step1);
      if (err) { setError(err); return; }
    }
    if (step === 2) {
      const err = validateStep3(items, computed.shu_dibagikan);
      if (err) { setError(err); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    setError(null);
    try {
      const out = await create.mutateAsync({
        periode: step1.periode,
        shu_total: step1.shu_total,
        pct_cadangan: step1.pct_cadangan,
        items: items.map((it) => ({
          anggota: it.anggota,
          jasa_anggota: it.jasa_anggota,
          jasa_modal: it.jasa_modal,
        })),
      });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Pembagian SHU"] });
      onSuccess?.(out.name);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal submit SHU.");
    }
  };

  const editItem = (idx: number, key: "jasa_anggota" | "jasa_modal", v: number) => {
    setTouched(true);
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: v } : it)));
  };

  const distributedTotal = useMemo(() => totalDistributed(items), [items]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title={`SHU Wizard — Step ${step + 1}/4 · ${STEPS[step]}`} size="lg">
      <div className="space-y-4">
        <ol
          aria-label="Progres wizard SHU"
          role="list"
          className="flex items-center gap-2 text-xs"
        >
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={[
                "flex-1 rounded-md border px-2 py-1 text-center",
                i === step ? "border-brand bg-brand-subtle font-medium" :
                i < step ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                "border-border text-muted-fg",
              ].join(" ")}
            >
              <span className="sr-only">Step </span>{i + 1}. {label}
              {i < step ? <span className="sr-only"> (selesai)</span> : null}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <FormGrid cols={2}>
            <FormField label="Periode" required className="sm:col-span-2">
              <Input value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="2025 / RAT 2025" required />
            </FormField>
            <FormField label="SHU Total (Rp)" required>
              <Input type="number" min={0} value={shuTotalStr} onChange={(e) => setShuTotalStr(e.target.value)} required />
            </FormField>
            <FormField label="Persentase Cadangan (%)" required>
              <Input type="number" min={0} max={100} value={pctCadanganStr} onChange={(e) => setPctCadanganStr(e.target.value)} required />
            </FormField>
          </FormGrid>
        ) : null}

        {step === 1 ? (
          <div className="space-y-2 rounded-lg border border-border bg-bg-subtle p-4 text-sm">
            <Row label="Periode" value={step1.periode} />
            <Row label="SHU Total" value={rupiah(step1.shu_total)} />
            <Row label="Persentase Cadangan" value={`${step1.pct_cadangan}%`} />
            <div className="my-2 border-t border-border" />
            <Row label="Cadangan" value={rupiah(computed.cadangan)} />
            <Row label="SHU Dibagikan" value={rupiah(computed.shu_dibagikan)} strong />
          </div>
        ) : null}

        {step === 2 ? (
          <>
            <Alert tone="info" title="Distribusi awal — equal split">
              Edit jasa per anggota sesuai partisipasi/modal aktual sebelum submit. Total wajib match SHU dibagikan ({rupiah(computed.shu_dibagikan)}).
            </Alert>
            {anggotaQ.isLoading ? (
              <p className="text-sm text-muted-fg">Memuat anggota…</p>
            ) : (
              <div className="max-h-80 overflow-auto rounded border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-bg-subtle text-xs uppercase tracking-wide text-muted-fg">
                    <tr>
                      <th className="px-2 py-1 text-left">Anggota</th>
                      <th className="px-2 py-1 text-right">Jasa Anggota</th>
                      <th className="px-2 py-1 text-right">Jasa Modal</th>
                      <th className="px-2 py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it, idx) => (
                      <tr key={it.anggota}>
                        <td className="px-2 py-1 font-mono text-xs">{it.anggota}</td>
                        <td className="px-2 py-1 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={it.jasa_anggota}
                            onChange={(e) => editItem(idx, "jasa_anggota", Number(e.target.value) || 0)}
                            className="ml-auto w-28 text-right"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={it.jasa_modal}
                            onChange={(e) => editItem(idx, "jasa_modal", Number(e.target.value) || 0)}
                            className="ml-auto w-28 text-right"
                          />
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">{rupiah(it.jasa_anggota + it.jasa_modal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-bg-subtle text-xs font-medium">
                    <tr>
                      <td className="px-2 py-1">Total distribusi</td>
                      <td colSpan={2}></td>
                      <td className="px-2 py-1 text-right tabular-nums">{rupiah(distributedTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <p className="font-medium">Review akhir sebelum submit</p>
            <Row label="Periode" value={step1.periode} />
            <Row label="SHU Total" value={rupiah(step1.shu_total)} />
            <Row label="Cadangan" value={rupiah(computed.cadangan)} />
            <Row label="SHU Dibagikan" value={rupiah(computed.shu_dibagikan)} />
            <Row label="Anggota Penerima" value={`${items.length} orang`} />
            <Row label="Total Distribusi" value={rupiah(distributedTotal)} strong />
            <Alert tone="warning" title="Submit final" className="mt-3">
              Pembagian SHU akan dibuat di Frappe; child items disusun otomatis. Edit lanjutan harus via Frappe desk.
            </Alert>
          </div>
        ) : null}

        {error ? (
          <Alert tone="danger" title="Validasi gagal">{error}</Alert>
        ) : null}

        <div className="flex justify-between gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={create.isPending}>Tutup</Button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={back} disabled={create.isPending}>Kembali</Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Lanjut</Button>
            ) : (
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending ? "Submitting…" : "Submit SHU"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-fg">{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
