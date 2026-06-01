/**
 * useBuatWizard — hook yang menampung state + query/mutation + validasi sinkron
 * + navigasi langkah wizard "Buat PPDB". Pipeline submit async (buat gelombang
 * inline, submit penuh, set seleksi) didelegasikan ke `./submitWizard` agar file
 * tetap < 300 baris. Murni structural split: hook dipanggil dari body komponen
 * sehingga urutan hook React + konteks render identik — submit/mutation TIDAK
 * berubah.
 */

import { useMemo, useState } from "react";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import {
  useAjukanPendaftaran,
  useCreatePaymentOrder,
  useGelombangAktif,
  useSetHasilSeleksi,
  useVerifikasiPendaftaran,
  type GelombangAktif,
} from "../../../lib/ppdbApi";
import {
  MSG_CALON_FORM_WAJIB,
  MSG_CALON_WAJIB,
  MSG_GELOMBANG_FORM_WAJIB,
  MSG_GELOMBANG_WAJIB,
  MSG_TA_WAJIB,
  STEP_KEYS,
  type CalonRow,
  type SekolahRow,
  type StepKey,
  type SubmitResult,
  type TahunAjaranRow,
  type WizardConfig,
} from "./types";
import { createWizardActions } from "./submitWizard";

/** State + logika alur wizard; dipakai komponen render BuatPanel. */
export function useBuatWizard() {
  const [step, setStep] = useState<StepKey>("gelombang");
  // Pesan validasi inline langkah aktif (null = tidak ada error).
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  // Step 1
  const [tahunAjaran, setTahunAjaran] = useState<string>("");
  const [showTaModal, setShowTaModal] = useState(false);
  const [gelombangMode, setGelombangMode] = useState<"existing" | "new">("existing");
  const [gelombangName, setGelombangName] = useState<string>("");
  const [gelombangForm, setGelombangForm] = useState({
    nama: "",
    sekolah: "",
    tingkat: "",
    tanggal_buka: "",
    tanggal_tutup: "",
    kuota: "",
    biaya_pendaftaran: "",
  });
  const [creatingGelombang, setCreatingGelombang] = useState(false);
  const [gelombangErr, setGelombangErr] = useState<string | null>(null);

  // Step 2
  const [calonMode, setCalonMode] = useState<"existing" | "new">("existing");
  const [calonName, setCalonName] = useState<string>("");
  const [calonForm, setCalonForm] = useState({
    nama_lengkap: "",
    jenis_kelamin: "",
    nisn: "",
    nik: "",
    no_hp: "",
    asal_sekolah: "",
    email: "",
  });

  // Step 3
  const [config, setConfig] = useState<WizardConfig>({
    paymentPhase: "sebelum_seleksi",
    autoTerima: false,
  });

  // Step 5
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const gelombangQ = useGelombangAktif();
  const calonQ = useResourceList<CalonRow>("Calon Siswa", {
    fields: ["name", "nama_lengkap", "nisn"],
    order_by: "`modified` desc",
    limit_page_length: 100,
  });
  const tahunAjaranQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: ["name", "judul"],
    order_by: "`name` desc",
    limit_page_length: 50,
  });
  const sekolahQ = useResourceList<SekolahRow>("Sekolah", {
    fields: ["name", "nama"],
    order_by: "`nama` asc",
    limit_page_length: 50,
  });

  const createGelombang = useResourceCreate<{ name: string }>("Gelombang PPDB");
  const createCalon = useResourceCreate<{ name: string }>("Calon Siswa");
  const createPendaftaran = useResourceCreate<{ name: string }>("Pendaftaran PPDB");
  const ajukan = useAjukanPendaftaran();
  const verifikasi = useVerifikasiPendaftaran();
  const setHasil = useSetHasilSeleksi();
  const createPayment = useCreatePaymentOrder();

  const selectedGelombang: GelombangAktif | undefined = useMemo(
    () => (gelombangQ.data ?? []).find((g) => g.name === gelombangName),
    [gelombangQ.data, gelombangName],
  );

  const filteredGelombangList = useMemo(
    () =>
      (gelombangQ.data ?? []).filter(
        (g) => !tahunAjaran || g.tahun_ajaran === tahunAjaran,
      ),
    [gelombangQ.data, tahunAjaran],
  );

  /** Validasi langkah Gelombang; kembalikan pesan error atau null bila valid. */
  function validateGelombang(): string | null {
    if (!tahunAjaran) return MSG_TA_WAJIB;
    if (gelombangMode === "existing") {
      return gelombangName ? null : MSG_GELOMBANG_WAJIB;
    }
    const f = gelombangForm;
    const ok =
      f.nama && f.tingkat && f.tanggal_buka && f.tanggal_tutup && f.kuota && f.biaya_pendaftaran;
    return ok ? null : MSG_GELOMBANG_FORM_WAJIB;
  }

  /** Validasi langkah Calon Siswa; kembalikan pesan error atau null. */
  function validateCalon(): string | null {
    if (calonMode === "existing") return calonName ? null : MSG_CALON_WAJIB;
    return calonForm.nama_lengkap && calonForm.jenis_kelamin ? null : MSG_CALON_FORM_WAJIB;
  }

  /** Validasi langkah aktif (selain langkah yang tidak punya field wajib). */
  function validateStep(target: StepKey): string | null {
    if (target === "gelombang") return validateGelombang();
    if (target === "calon") return validateCalon();
    return null;
  }

  /** Maju ke langkah berikutnya bila valid; jika tidak, tampilkan validasi. */
  function goNext() {
    const msg = validateStep(step);
    if (msg) {
      setValidationMsg(msg);
      return;
    }
    setValidationMsg(null);
    const idx = STEP_KEYS.indexOf(step);
    const next = STEP_KEYS[idx + 1];
    if (next) setStep(next);
  }

  /** Mundur satu langkah, membersihkan pesan validasi. */
  function goBack() {
    setValidationMsg(null);
    const idx = STEP_KEYS.indexOf(step);
    const prev = STEP_KEYS[idx - 1];
    if (prev) setStep(prev);
  }

  // Pipeline submit async (gelombang inline, submit penuh, set seleksi) di modul
  // terpisah; disuplai dependency state/setter/mutation render saat ini.
  const actions = createWizardActions({
    tahunAjaran,
    gelombangMode,
    gelombangName,
    gelombangForm,
    calonMode,
    calonName,
    calonForm,
    config,
    result,
    validateGelombang,
    setValidationMsg,
    setGelombangErr,
    setCreatingGelombang,
    setGelombangName,
    setGelombangMode,
    setStep,
    setSubmitErr,
    setSubmitting,
    setResult,
    createGelombang,
    createCalon,
    createPendaftaran,
    ajukan,
    verifikasi,
    setHasil,
    createPayment,
    refetchGelombang: () => gelombangQ.refetch(),
  });

  const calonLabel =
    calonMode === "existing"
      ? (calonQ.data ?? []).find((c) => c.name === calonName)?.nama_lengkap ?? calonName
      : `${calonForm.nama_lengkap} (baru)`;

  return {
    step,
    validationMsg,
    setValidationMsg,
    tahunAjaran,
    setTahunAjaran,
    showTaModal,
    setShowTaModal,
    gelombangMode,
    setGelombangMode,
    gelombangName,
    setGelombangName,
    gelombangForm,
    setGelombangForm,
    creatingGelombang,
    gelombangErr,
    calonMode,
    setCalonMode,
    calonName,
    setCalonName,
    calonForm,
    setCalonForm,
    config,
    setConfig,
    submitting,
    submitErr,
    result,
    calonQ,
    tahunAjaranQ,
    sekolahQ,
    gelombangQ,
    createPayment,
    selectedGelombang,
    filteredGelombangList,
    calonLabel,
    goNext,
    goBack,
    submitGelombangInline: actions.submitGelombangInline,
    doSubmit: actions.doSubmit,
    onSetSeleksi: actions.onSetSeleksi,
  };
}
