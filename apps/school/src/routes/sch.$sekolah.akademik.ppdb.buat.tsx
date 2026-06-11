/**
 * Buat Pendaftaran PPDB — halaman alur pembuatan pendaftaran (wizard berurut).
 *
 * Route ini sengaja ramping: ia hanya merangkai header, tutorial (PageGuide),
 * dan panel wizard BuatPanel (komponen kolokasi yang HANYA dipakai halaman ini).
 * Seluruh logika submit/mutation + field set dipertahankan di BuatPanel dari
 * versi sebelumnya — endpoint backend tidak berubah:
 *   sekolahpro.ppdb.api.ppdb.ajukan_pendaftaran
 *   sekolahpro.ppdb.api.ppdb.verifikasi_pendaftaran
 *   sekolahpro.ppdb.api.ppdb.set_hasil_seleksi
 *   sekolahpro.ppdb.api.ppdb.create_payment_order
 */

import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Button, PageHeader } from "@sekolahpro/ui";
import { PageGuide, type PageGuideStep } from "../components/guide/PageGuide";
import { BuatPanel } from "../components/ppdb/buatPanel";

// storageId tutorial (no magic strings) — dipakai PageGuide untuk persist state.
const GUIDE_STORAGE_ID = "ppdb-buat";

// Langkah tutorial alur — Bahasa Indonesia, selaras dengan stepper wizard.
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pilih tahun ajaran lalu gelombang",
    detail: "Gelombang di-scope per tahun ajaran. Bisa buat gelombang baru inline.",
  },
  {
    title: "Tentukan calon siswa",
    detail: "Pilih calon yang sudah ada atau isi data calon baru langsung di sini.",
  },
  {
    title: "Atur konfigurasi pembayaran & auto-terima",
    detail: "Pilih kapan order pembayaran dibuat; aktifkan auto-terima untuk walk-in/admin.",
  },
  {
    title: "Tinjau ringkasan lalu submit",
    detail: "Periksa preview sebelum mengirim. Pendaftaran otomatis Diajukan setelah submit.",
  },
];

const GUIDE_TIPS = [
  "Field bertanda * wajib diisi; pesan validasi muncul saat mencoba lanjut.",
  "Auto-terima memerlukan peran admin — jika gagal, lanjutkan manual di halaman detail.",
];

/** Halaman Buat Pendaftaran PPDB: header + tutorial + wizard panel. */
function PpdbBuatPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Buat Pendaftaran PPDB"
        description="Alur lengkap: Gelombang → Calon Siswa → Konfigurasi → Konfirmasi → Hasil."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/sch/$sekolah/akademik/ppdb", params: { sekolah } })}
          >
            Batal
          </Button>
        }
      />

      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro="Ikuti langkah berurut berikut untuk membuat satu pendaftaran PPDB dari awal hingga selesai."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <BuatPanel sekolah={sekolah} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/ppdb/buat")({ component: PpdbBuatPage });
