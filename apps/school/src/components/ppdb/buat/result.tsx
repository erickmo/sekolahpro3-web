/**
 * Langkah 5 wizard "Buat PPDB": Hasil. Berisi ResultPanel (panel hasil
 * pasca-submit) dan ResultLink (kartu tautan ke detail pendaftaran). Diekstrak
 * dari buatPanel.tsx tanpa perubahan perilaku.
 */

import { Link } from "@tanstack/react-router";
import { Alert, SectionCard } from "@sekolahpro/ui";
import { ActionCard } from "./primitives";
import type { PaymentPhase, SubmitResult } from "./types";

// ===== Langkah 5: Hasil =====

/** Panel hasil pasca-submit: tautan pendaftaran + aksi lanjutan. */
export function ResultPanel({
  result,
  paymentPhase,
  autoTerima,
  onSetSeleksi,
  onCreatePayment,
  onNew,
  sekolah,
}: {
  result: SubmitResult;
  paymentPhase: PaymentPhase;
  autoTerima: boolean;
  onSetSeleksi: (hasil: "Lulus" | "Tidak Lulus") => Promise<void>;
  onCreatePayment: () => Promise<void>;
  onNew: () => void;
  sekolah: string;
}) {
  return (
    <SectionCard title="5. Hasil" description="Pendaftaran berhasil dibuat.">
      <div className="space-y-4">
        <Alert tone="success" title="Pendaftaran terbuat">
          No. Pendaftaran:{" "}
          <Link
            to="/sch/$sekolah/akademik/ppdb/$noPendaftaran"
            params={{ sekolah, noPendaftaran: result.pendaftaranName }}
            className="font-mono text-brand underline"
          >
            {result.pendaftaranName}
          </Link>
        </Alert>
        {result.warnings.length > 0 && (
          <Alert tone="warning" title="Peringatan">
            <ul className="ml-4 list-disc">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Alert>
        )}
        {result.paymentUrl && (
          <Alert tone="info" title="Order pembayaran terbuat">
            Order ID: <code className="font-mono">{result.paymentOrderId}</code>
            <div className="mt-2">
              <a
                href={result.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white"
              >
                Buka Halaman Bayar
              </a>
            </div>
          </Alert>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ResultLink sekolah={sekolah} noPendaftaran={result.pendaftaranName} />
          {!autoTerima && (
            <>
              <ActionCard
                title="Set Seleksi: Lulus"
                description="Tandai seleksi sebagai lulus (butuh Seleksi PPDB)."
                onClick={() => onSetSeleksi("Lulus")}
              />
              <ActionCard
                title="Set Seleksi: Tidak Lulus"
                description="Tandai seleksi sebagai tidak lulus."
                onClick={() => onSetSeleksi("Tidak Lulus")}
              />
            </>
          )}
          {paymentPhase === "setelah_diterima" && !result.paymentUrl && (
            <ActionCard
              title="Buat Pembayaran"
              description="Generate payment order setelah diterima."
              onClick={onCreatePayment}
            />
          )}
          <ActionCard
            title="Buat Pendaftaran Lain"
            description="Mulai wizard baru."
            onClick={onNew}
          />
        </div>
      </div>
    </SectionCard>
  );
}

/** Kartu tautan ke detail pendaftaran (primary) menggunakan Link router. */
function ResultLink({ sekolah, noPendaftaran }: { sekolah: string; noPendaftaran: string }) {
  return (
    <Link
      to="/sch/$sekolah/akademik/ppdb/$noPendaftaran"
      params={{ sekolah, noPendaftaran }}
      className="block rounded-lg border border-brand bg-brand/10 p-3 text-left transition hover:border-brand"
    >
      <div className="text-sm font-medium">Verifikasi / Detail</div>
      <div className="mt-0.5 text-xs text-muted-fg">Buka detail pendaftaran untuk approval workflow.</div>
    </Link>
  );
}
