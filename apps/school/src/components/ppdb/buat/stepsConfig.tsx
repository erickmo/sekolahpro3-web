/**
 * Langkah 3 & 4 wizard "Buat PPDB": Konfigurasi (tahap pembayaran + auto-terima)
 * dan Konfirmasi (ringkasan/preview sebelum submit). Diekstrak dari
 * buatPanel.tsx tanpa perubahan perilaku.
 */

import { Alert, Badge, Button, SectionCard } from "@sekolahpro/ui";
import { ChoiceCard, StepNav, Summary } from "./primitives";
import type { PaymentPhase, WizardConfig } from "./types";

// ===== Langkah 3: Konfigurasi =====

/** Langkah konfigurasi tahap pembayaran + auto-terima. */
export function ConfigStep({
  config,
  onConfig,
  onBack,
  onNext,
}: {
  config: WizardConfig;
  onConfig: (c: WizardConfig) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <SectionCard title="3. Konfigurasi" description="Atur tahap pembayaran dan auto-terima.">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-fg">Tahap Pembayaran</label>
          <div className="grid gap-2 sm:grid-cols-3">
            <ChoiceCard
              active={config.paymentPhase === "sebelum_seleksi"}
              onClick={() => onConfig({ ...config, paymentPhase: "sebelum_seleksi" })}
              title="Sebelum Seleksi"
              hint="Order dibuat langsung setelah pendaftaran."
            />
            <ChoiceCard
              active={config.paymentPhase === "setelah_diterima"}
              onClick={() => onConfig({ ...config, paymentPhase: "setelah_diterima" })}
              title="Setelah Diterima"
              hint="Order dibuat setelah seleksi lolos."
            />
            <ChoiceCard
              active={config.paymentPhase === "tidak"}
              onClick={() => onConfig({ ...config, paymentPhase: "tidak" })}
              title="Tanpa Bayar Sekarang"
              hint="Atur manual nanti dari Pembayaran."
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:border-brand">
          <input
            type="checkbox"
            checked={config.autoTerima}
            onChange={(e) => onConfig({ ...config, autoTerima: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium">Auto-Terima</span>
            <span className="block text-xs text-muted-fg">
              Langsung jalankan workflow Diverifikasi → Diterima setelah submit. Cocok untuk
              pendaftaran walk-in/admin.
            </span>
          </span>
        </label>
      </div>
      <StepNav onBack={onBack} onNext={onNext} />
    </SectionCard>
  );
}

// ===== Langkah 4: Konfirmasi =====

/** Ringkasan/preview sebelum submit pendaftaran. */
export function KonfirmasiStep({
  gelombangLabel,
  tahunAjaran,
  calonLabel,
  paymentPhase,
  autoTerima,
  biaya,
  submitErr,
  submitting,
  onBack,
  onSubmit,
}: {
  gelombangLabel: string;
  tahunAjaran: string;
  calonLabel: string;
  paymentPhase: PaymentPhase;
  autoTerima: boolean;
  biaya: number;
  submitErr: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const paymentLabel =
    paymentPhase === "sebelum_seleksi"
      ? "Sebelum Seleksi"
      : paymentPhase === "setelah_diterima"
        ? "Setelah Diterima"
        : "Manual";
  return (
    <SectionCard title="4. Konfirmasi" description="Tinjau ringkasan sebelum submit.">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Summary label="Gelombang">{gelombangLabel}</Summary>
        <Summary label="Tahun Ajaran">{tahunAjaran || "—"}</Summary>
        <Summary label="Calon Siswa">{calonLabel}</Summary>
        <Summary label="Tahap Pembayaran">{paymentLabel}</Summary>
        <Summary label="Auto-Terima">
          <Badge tone={autoTerima ? "success" : "neutral"} dot>
            {autoTerima ? "Ya" : "Tidak"}
          </Badge>
        </Summary>
        <Summary label="Biaya Pendaftaran">Rp {biaya.toLocaleString("id-ID")}</Summary>
      </dl>
      {submitErr && (
        <Alert tone="danger" title="Submit gagal" className="mt-4">
          {submitErr}
        </Alert>
      )}
      <div className="mt-5 flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          Sebelumnya
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? "Memproses..." : "Submit Pendaftaran"}
        </Button>
      </div>
    </SectionCard>
  );
}
