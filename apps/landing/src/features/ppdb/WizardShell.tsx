import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { fullPpdbSchema, type FullPpdbInput } from "./schema";
import { loadDraft, saveDraft, clearDraft } from "./storage";
import { useDaftarCalonSiswa } from "./api";
import { Step1Jalur } from "./steps/Step1Jalur";
import { Step2DataDiri } from "./steps/Step2DataDiri";
import { Step3Ortu } from "./steps/Step3Ortu";
import { Step4Dokumen } from "./steps/Step4Dokumen";
import { Step5Review } from "./steps/Step5Review";

const STEP_FIELDS = [
  ["jalur", "gelombang_ppdb"],
  ["calon"],
  ["ortu"],
  ["dokumen"],
  ["consent", "turnstile_token"],
] as const;

const STEP_TITLES = [
  "Jalur & Gelombang",
  "Data Diri",
  "Data Orang Tua",
  "Upload Dokumen",
  "Review & Submit",
];

export function WizardShell() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const methods = useForm<FullPpdbInput>({
    resolver: zodResolver(fullPpdbSchema),
    mode: "onBlur",
    defaultValues: loadDraft<FullPpdbInput>() ?? {
      jalur: "Reguler",
      dokumen: [],
      consent: false as unknown as true,
      turnstile_token: "",
    },
  });

  const daftar = useDaftarCalonSiswa();

  useEffect(() => {
    const sub = methods.watch((values) => saveDraft(values));
    return () => sub.unsubscribe();
  }, [methods]);

  async function next() {
    const ok = await methods.trigger(STEP_FIELDS[step] as never);
    if (ok && step < 4) setStep((s) => s + 1);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function onSubmit(values: FullPpdbInput) {
    const res = await daftar.mutateAsync(values);
    clearDraft();
    navigate(`/ppdb/sukses?no=${encodeURIComponent(res.nomor_pendaftaran)}`);
  }

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Progress step={step} />
        <h2 className="mt-6 text-2xl font-semibold">{STEP_TITLES[step]}</h2>

        <form onSubmit={methods.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {step === 0 && <Step1Jalur />}
          {step === 1 && <Step2DataDiri />}
          {step === 2 && <Step3Ortu />}
          {step === 3 && <Step4Dokumen />}
          {step === 4 && <Step5Review />}

          {daftar.isError && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700">
              {(daftar.error as Error).message}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0 || daftar.isPending}
              className="rounded border px-4 py-2 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                type="submit"
                disabled={daftar.isPending}
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {daftar.isPending ? "Mengirim…" : "Submit Pendaftaran"}
              </button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex gap-2">
      {STEP_TITLES.map((t, i) => (
        <div
          key={t}
          className={`h-2 flex-1 rounded ${i <= step ? "bg-blue-600" : "bg-gray-200"}`}
          title={t}
        />
      ))}
    </div>
  );
}
