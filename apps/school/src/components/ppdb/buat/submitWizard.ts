/**
 * submitWizard — pipeline async pembuatan pendaftaran PPDB (inline gelombang,
 * resolve calon, auto-terima, payment order, submit penuh, set seleksi).
 * Diekstrak dari useBuatWizard sebagai modul murni (tanpa hook React) agar file
 * hook tetap < 300 baris. Fungsi menerima dependency (state snapshot, setter,
 * objek mutation) sebagai argumen biasa — submit/mutation TIDAK berubah.
 */

import { frappeFetch } from "@sekolahpro/api-client";
import type {
  HasilSeleksi,
  PaymentOrderResult,
  VerifikasiStatus,
} from "../../../lib/ppdbApi";
import type { SubmitResult, WizardConfig } from "./types";

// Bentuk minimal mutation yang dipakai pipeline; V = variabel, T = hasil.
// Generik atas V agar cocok dengan signature spesifik tiap hook (no variance
// mismatch) — useResourceCreate memakai Record<string, unknown>, hook ppdbApi
// memakai shape spesifik seperti { pendaftaran_ppdb: string }.
type Mutation<V, T> = { mutateAsync: (vars: V) => Promise<T> };
type GelombangFormState = {
  nama: string;
  sekolah: string;
  tingkat: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  kuota: string;
  biaya_pendaftaran: string;
};
type CalonFormState = {
  nama_lengkap: string;
  jenis_kelamin: string;
  nisn: string;
  nik: string;
  no_hp: string;
  asal_sekolah: string;
  email: string;
};

/** Dependency yang dibutuhkan pipeline; disuplai oleh hook tiap render. */
export interface WizardActionDeps {
  // State snapshot
  tahunAjaran: string;
  gelombangMode: "existing" | "new";
  gelombangName: string;
  gelombangForm: GelombangFormState;
  calonMode: "existing" | "new";
  calonName: string;
  calonForm: CalonFormState;
  config: WizardConfig;
  result: SubmitResult | null;
  // Validasi langkah gelombang (dipakai sebelum submit inline).
  validateGelombang: () => string | null;
  // Setter
  setValidationMsg: (v: string | null) => void;
  setGelombangErr: (v: string | null) => void;
  setCreatingGelombang: (v: boolean) => void;
  setGelombangName: (v: string) => void;
  setGelombangMode: (v: "existing" | "new") => void;
  setStep: (v: "gelombang" | "calon" | "config" | "konfirmasi" | "hasil") => void;
  setSubmitErr: (v: string | null) => void;
  setSubmitting: (v: boolean) => void;
  setResult: (v: SubmitResult) => void;
  // Mutation + query — V per hook agar cocok signature spesifik TanStack.
  createGelombang: Mutation<Record<string, unknown>, { name: string }>;
  createCalon: Mutation<Record<string, unknown>, { name: string }>;
  createPendaftaran: Mutation<Record<string, unknown>, { name: string }>;
  ajukan: Mutation<{ pendaftaran_ppdb: string }, unknown>;
  verifikasi: Mutation<
    { pendaftaran_ppdb: string; status: VerifikasiStatus; catatan?: string },
    unknown
  >;
  setHasil: Mutation<{ seleksi_ppdb: string; hasil: HasilSeleksi }, unknown>;
  createPayment: Mutation<{ pendaftaran_ppdb: string }, PaymentOrderResult>;
  refetchGelombang: () => Promise<unknown>;
}

/** Bangun fungsi-fungsi aksi alur dari dependency render saat ini. */
export function createWizardActions(d: WizardActionDeps) {
  /** Buat Gelombang PPDB inline (status Aktif) lalu lanjut ke langkah berikut. */
  async function submitGelombangInline() {
    const msg = d.validateGelombang();
    if (msg) {
      d.setValidationMsg(msg);
      return;
    }
    d.setValidationMsg(null);
    d.setGelombangErr(null);
    d.setCreatingGelombang(true);
    try {
      const g = await d.createGelombang.mutateAsync({
        nama: d.gelombangForm.nama,
        tahun_ajaran: d.tahunAjaran || undefined,
        sekolah: d.gelombangForm.sekolah || undefined,
        tingkat: d.gelombangForm.tingkat || undefined,
        tanggal_buka: d.gelombangForm.tanggal_buka || undefined,
        tanggal_tutup: d.gelombangForm.tanggal_tutup || undefined,
        kuota: d.gelombangForm.kuota ? Number(d.gelombangForm.kuota) : undefined,
        biaya_pendaftaran: d.gelombangForm.biaya_pendaftaran
          ? Number(d.gelombangForm.biaya_pendaftaran)
          : undefined,
        status: "Aktif",
      });
      d.setGelombangName(g.name);
      await d.refetchGelombang();
      d.setGelombangMode("existing");
      d.setStep("calon");
    } catch (e) {
      d.setGelombangErr((e as Error)?.message ?? "Gagal membuat gelombang.");
    } finally {
      d.setCreatingGelombang(false);
    }
  }

  /** Resolusi calon siswa: pakai existing atau buat baru → kembalikan name. */
  async function resolveCalon(): Promise<string> {
    if (d.calonMode !== "new") return d.calonName;
    const c = await d.createCalon.mutateAsync({
      nama_lengkap: d.calonForm.nama_lengkap,
      jenis_kelamin: d.calonForm.jenis_kelamin,
      nisn: d.calonForm.nisn || undefined,
      nik: d.calonForm.nik || undefined,
      no_hp: d.calonForm.no_hp || undefined,
      asal_sekolah: d.calonForm.asal_sekolah || undefined,
      email: d.calonForm.email || undefined,
    });
    return c.name;
  }

  /** Jalankan workflow auto-terima (Diverifikasi → Diterima); kumpulkan warning. */
  async function runAutoTerima(pendaftaranName: string, warnings: string[]) {
    try {
      await d.verifikasi.mutateAsync({
        pendaftaran_ppdb: pendaftaranName,
        status: "Diverifikasi",
        catatan: "Auto-verifikasi via Buat PPDB wizard",
      });
      await d.verifikasi.mutateAsync({
        pendaftaran_ppdb: pendaftaranName,
        status: "Diterima",
        catatan: "Auto-terima via Buat PPDB wizard",
      });
    } catch {
      warnings.push("Auto-terima gagal — peran admin mungkin diperlukan.");
    }
  }

  /** Buat payment order bila konfigurasi menghendaki; isi result + warning. */
  async function maybeCreatePayment(
    pendaftaranName: string,
    warnings: string[],
  ): Promise<{ paymentUrl?: string; paymentOrderId?: string }> {
    const wantNow =
      d.config.paymentPhase === "sebelum_seleksi" ||
      (d.config.paymentPhase === "setelah_diterima" && d.config.autoTerima);
    if (!wantNow) return {};
    try {
      const po = await d.createPayment.mutateAsync({ pendaftaran_ppdb: pendaftaranName });
      return { paymentUrl: po.payment_url, paymentOrderId: po.order_id };
    } catch {
      warnings.push("Gagal buat payment order — silakan ulang dari halaman Pembayaran.");
      return {};
    }
  }

  /** Submit penuh: Calon → Pendaftaran → Ajukan → (auto-terima) → (payment). */
  async function doSubmit() {
    d.setSubmitErr(null);
    d.setSubmitting(true);
    const warnings: string[] = [];
    try {
      const resolvedCalon = await resolveCalon();
      const p = await d.createPendaftaran.mutateAsync({
        calon_siswa: resolvedCalon,
        gelombang_ppdb: d.gelombangName,
      });
      const pendaftaranName = p.name;
      try {
        await d.ajukan.mutateAsync({ pendaftaran_ppdb: pendaftaranName });
      } catch {
        warnings.push("Gagal otomatis Ajukan — silakan ajukan manual di detail.");
      }
      if (d.config.autoTerima) await runAutoTerima(pendaftaranName, warnings);
      const pay = await maybeCreatePayment(pendaftaranName, warnings);
      d.setResult({ pendaftaranName, ...pay, warnings });
      d.setStep("hasil");
    } catch (e) {
      d.setSubmitErr((e as Error)?.message ?? "Gagal membuat pendaftaran.");
    } finally {
      d.setSubmitting(false);
    }
  }

  /** Set hasil seleksi best-effort dengan mencari Seleksi PPDB terkait. */
  async function onSetSeleksi(hasil: "Lulus" | "Tidak Lulus") {
    if (!d.result) return;
    const list = await frappeFetch<Array<{ name: string }>>("frappe.client.get_list", {
      doctype: "Seleksi PPDB",
      filters: [["pendaftaran_ppdb", "=", d.result.pendaftaranName]],
      fields: ["name"],
      limit_page_length: 1,
    });
    const seleksiName = list[0]?.name;
    if (!seleksiName) {
      alert("Belum ada Seleksi PPDB untuk pendaftaran ini.");
      return;
    }
    await d.setHasil.mutateAsync({ seleksi_ppdb: seleksiName, hasil });
    alert(`Hasil seleksi: ${hasil}.`);
  }

  return { submitGelombangInline, doSubmit, onSetSeleksi };
}
