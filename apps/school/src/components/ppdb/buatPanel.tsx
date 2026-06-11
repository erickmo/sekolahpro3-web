/**
 * BuatPanel — wizard "Buat Pendaftaran PPDB" yang dipakai HANYA oleh route
 * src/routes/sch.$sekolah.ppdb.buat.tsx. Diekstrak dari route agar file route
 * tetap ramping (< 300 baris) dan panel ini fokus pada alur form berurut.
 *
 * Alur (dipertahankan dari versi sebelumnya — submit/mutation TIDAK berubah):
 *   1. Gelombang (pilih existing atau buat baru inline)
 *   2. Calon Siswa (pilih existing atau buat baru inline)
 *   3. Konfigurasi (tahap pembayaran + auto-terima)
 *   4. Konfirmasi (ringkasan/preview)
 *   5. Hasil (no_pendaftaran + aksi lanjutan)
 *
 * Penyempurnaan redesain: pesan VALIDASI inline (Bahasa Indonesia) pada tiap
 * langkah alih-alih sekadar menonaktifkan tombol, plus ringkasan preview.
 *
 * Struktur: seluruh state + logika alur ada di hook `./buat/useBuatWizard`;
 * sub-komponen presentational + types/constants/helpers di folder `./buat/*`
 * agar setiap file tetap < 300 baris (refactor struktural murni).
 */

import { useNavigate } from "@tanstack/react-router";
import { Alert, SectionCard, WorkflowStepper } from "@sekolahpro/ui";
import { buildStepperSteps } from "./buat/types";
import { useBuatWizard } from "./buat/useBuatWizard";
import { GelombangStep } from "./buat/stepsGelombang";
import { CalonStep } from "./buat/stepsCalon";
import { ConfigStep, KonfirmasiStep } from "./buat/stepsConfig";
import { ResultPanel } from "./buat/result";
import { TahunAjaranCreateModal } from "./buat/TahunAjaranCreateModal";

/**
 * Panel wizard pembuatan pendaftaran PPDB. `sekolah` dipakai untuk navigasi
 * Link/useNavigate berbasis params route induk.
 */
export function BuatPanel({ sekolah }: { sekolah: string }) {
  const navigate = useNavigate();
  const w = useBuatWizard();

  return (
    <div className="space-y-6">
      <SectionCard>
        <WorkflowStepper steps={buildStepperSteps(w.step)} />
      </SectionCard>

      {w.validationMsg && w.step !== "hasil" && (
        <Alert tone="danger" title="Lengkapi data dulu">
          {w.validationMsg}
        </Alert>
      )}

      {w.step === "gelombang" && (
        <GelombangStep
          tahunAjaran={w.tahunAjaran}
          onChangeTahunAjaran={(v) => {
            w.setTahunAjaran(v);
            w.setGelombangName("");
            w.setValidationMsg(null);
          }}
          tahunAjaranOpts={(w.tahunAjaranQ.data ?? []).map((t) => ({
            value: t.name,
            label: t.judul ?? t.name,
          }))}
          tahunAjaranLoading={w.tahunAjaranQ.isLoading}
          onNewTahunAjaran={() => w.setShowTaModal(true)}
          mode={w.gelombangMode}
          onMode={w.setGelombangMode}
          gelombangName={w.gelombangName}
          onGelombangName={w.setGelombangName}
          gelombangOpts={w.filteredGelombangList}
          gelombangLoading={w.gelombangQ.isLoading}
          selectedGelombang={w.selectedGelombang}
          form={w.gelombangForm}
          onForm={(patch) => w.setGelombangForm((s) => ({ ...s, ...patch }))}
          sekolahOpts={(w.sekolahQ.data ?? []).map((sk) => ({
            value: sk.name,
            label: sk.nama ?? sk.name,
          }))}
          sekolahLoading={w.sekolahQ.isLoading}
          gelombangErr={w.gelombangErr}
          creating={w.creatingGelombang}
          onNext={w.goNext}
          onCreateInline={w.submitGelombangInline}
        />
      )}

      {w.step === "calon" && (
        <CalonStep
          mode={w.calonMode}
          onMode={w.setCalonMode}
          calonName={w.calonName}
          onCalonName={w.setCalonName}
          calonOpts={(w.calonQ.data ?? []).map((c) => ({
            value: c.name,
            label: `${c.nama_lengkap ?? "—"}${c.nisn ? ` · NISN ${c.nisn}` : ""} (${c.name})`,
          }))}
          calonLoading={w.calonQ.isLoading}
          form={w.calonForm}
          onForm={(patch) => w.setCalonForm((s) => ({ ...s, ...patch }))}
          onBack={w.goBack}
          onNext={w.goNext}
        />
      )}

      {w.step === "config" && (
        <ConfigStep config={w.config} onConfig={w.setConfig} onBack={w.goBack} onNext={w.goNext} />
      )}

      {w.step === "konfirmasi" && (
        <KonfirmasiStep
          gelombangLabel={w.selectedGelombang?.nama ?? w.gelombangName}
          tahunAjaran={w.tahunAjaran}
          calonLabel={w.calonLabel}
          paymentPhase={w.config.paymentPhase}
          autoTerima={w.config.autoTerima}
          biaya={w.selectedGelombang?.biaya_pendaftaran ?? 0}
          submitErr={w.submitErr}
          submitting={w.submitting}
          onBack={w.goBack}
          onSubmit={w.doSubmit}
        />
      )}

      {w.step === "hasil" && w.result && (
        <ResultPanel
          result={w.result}
          paymentPhase={w.config.paymentPhase}
          autoTerima={w.config.autoTerima}
          sekolah={sekolah}
          onSetSeleksi={w.onSetSeleksi}
          onCreatePayment={async () => {
            const po = await w.createPayment.mutateAsync({
              pendaftaran_ppdb: w.result!.pendaftaranName,
            });
            window.open(po.payment_url, "_blank");
          }}
          onNew={() => navigate({ to: "/sch/$sekolah/akademik/ppdb/buat", params: { sekolah } })}
        />
      )}

      <TahunAjaranCreateModal
        open={w.showTaModal}
        onClose={() => w.setShowTaModal(false)}
        onCreated={async (name) => {
          await w.tahunAjaranQ.refetch();
          w.setTahunAjaran(name);
          w.setGelombangName("");
        }}
        sekolahOpts={(w.sekolahQ.data ?? []).map((sk) => ({
          value: sk.name,
          label: sk.nama ?? sk.name,
        }))}
      />
    </div>
  );
}
