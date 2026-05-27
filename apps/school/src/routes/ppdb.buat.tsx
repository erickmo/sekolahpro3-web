/**
 * PPDB Create Flow — wizard end-to-end:
 *   1. Pilih / buat Gelombang aktif
 *   2. Calon Siswa (pilih existing atau buat baru inline)
 *   3. Konfigurasi: payment timing + auto-terima
 *   4. Konfirmasi & submit Pendaftaran (auto-Ajukan)
 *   5. Hasil: tampilkan no_pendaftaran + drive lanjutan
 *        Verifikasi (workflow) → Seleksi (auto-Lulus opsional) → Pembayaran / Daftar Ulang
 *
 * Backend endpoints dipakai (sudah ada):
 *   sekolahpro.ppdb.api.ppdb.ajukan_pendaftaran
 *   sekolahpro.ppdb.api.ppdb.verifikasi_pendaftaran
 *   sekolahpro.ppdb.api.ppdb.set_hasil_seleksi
 *   sekolahpro.ppdb.api.ppdb.create_payment_order
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Alert,
  Badge,
  Button,
  Modal,
  PageHeader,
  SearchableSelect,
  SectionCard,
  WorkflowStepper,
  type WorkflowStep,
} from "@sekolahpro/ui";
import {
  useResourceCreate,
  useResourceList,
} from "@sekolahpro/api-client";
import {
  useAjukanPendaftaran,
  useCreatePaymentOrder,
  useGelombangAktif,
  useSetHasilSeleksi,
  useVerifikasiPendaftaran,
  type GelombangAktif,
} from "../lib/ppdbApi";

type CalonRow = { name: string; nama_lengkap?: string; nisn?: string };
type TahunAjaranRow = { name: string; judul?: string };
type SekolahRow = { name: string; nama?: string };

const TINGKAT_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

type PaymentPhase = "sebelum_seleksi" | "setelah_diterima" | "tidak";

interface WizardConfig {
  paymentPhase: PaymentPhase;
  autoTerima: boolean;
}

interface SubmitResult {
  pendaftaranName: string;
  seleksiName?: string | undefined;
  paymentUrl?: string | undefined;
  paymentOrderId?: string | undefined;
  warnings: string[];
}

const STEP_KEYS = ["gelombang", "calon", "config", "konfirmasi", "hasil"] as const;
type StepKey = (typeof STEP_KEYS)[number];

const STEP_LABELS: Record<StepKey, string> = {
  gelombang: "Gelombang",
  calon: "Calon Siswa",
  config: "Konfigurasi",
  konfirmasi: "Konfirmasi",
  hasil: "Hasil",
};

function PpdbBuatPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepKey>("gelombang");

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

  const stepperSteps: WorkflowStep[] = STEP_KEYS.map((k) => {
    const curIdx = STEP_KEYS.indexOf(step);
    const idx = STEP_KEYS.indexOf(k);
    return {
      key: k,
      label: STEP_LABELS[k],
      status: idx < curIdx ? "done" : idx === curIdx ? "current" : "pending",
    };
  });

  const goNext = () => {
    const idx = STEP_KEYS.indexOf(step);
    const next = STEP_KEYS[idx + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    const idx = STEP_KEYS.indexOf(step);
    const prev = STEP_KEYS[idx - 1];
    if (prev) setStep(prev);
  };

  const filteredGelombangList = useMemo(
    () =>
      (gelombangQ.data ?? []).filter(
        (g) => !tahunAjaran || g.tahun_ajaran === tahunAjaran,
      ),
    [gelombangQ.data, tahunAjaran],
  );

  const canNextGelombang =
    !!tahunAjaran &&
    (gelombangMode === "existing"
      ? !!gelombangName
      : !!gelombangForm.nama &&
        !!gelombangForm.tingkat &&
        !!gelombangForm.tanggal_buka &&
        !!gelombangForm.tanggal_tutup &&
        !!gelombangForm.kuota &&
        !!gelombangForm.biaya_pendaftaran);

  const submitGelombangInline = async () => {
    setGelombangErr(null);
    setCreatingGelombang(true);
    try {
      const g = await createGelombang.mutateAsync({
        nama: gelombangForm.nama,
        tahun_ajaran: tahunAjaran || undefined,
        sekolah: gelombangForm.sekolah || undefined,
        tingkat: gelombangForm.tingkat || undefined,
        tanggal_buka: gelombangForm.tanggal_buka || undefined,
        tanggal_tutup: gelombangForm.tanggal_tutup || undefined,
        kuota: gelombangForm.kuota ? Number(gelombangForm.kuota) : undefined,
        biaya_pendaftaran: gelombangForm.biaya_pendaftaran
          ? Number(gelombangForm.biaya_pendaftaran)
          : undefined,
        status: "Aktif",
      });
      setGelombangName(g.name);
      await gelombangQ.refetch();
      setGelombangMode("existing");
      goNext();
    } catch (e) {
      setGelombangErr((e as Error)?.message ?? "Gagal membuat gelombang.");
    } finally {
      setCreatingGelombang(false);
    }
  };
  const canNextCalon =
    calonMode === "existing"
      ? !!calonName
      : !!calonForm.nama_lengkap && !!calonForm.jenis_kelamin;

  const doSubmit = async () => {
    setSubmitErr(null);
    setSubmitting(true);
    const warnings: string[] = [];
    try {
      // 1. Calon Siswa (create if new)
      let resolvedCalon = calonName;
      if (calonMode === "new") {
        const c = await createCalon.mutateAsync({
          nama_lengkap: calonForm.nama_lengkap,
          jenis_kelamin: calonForm.jenis_kelamin,
          nisn: calonForm.nisn || undefined,
          nik: calonForm.nik || undefined,
          no_hp: calonForm.no_hp || undefined,
          asal_sekolah: calonForm.asal_sekolah || undefined,
          email: calonForm.email || undefined,
        });
        resolvedCalon = c.name;
      }

      // 2. Pendaftaran PPDB (Draft)
      const p = await createPendaftaran.mutateAsync({
        calon_siswa: resolvedCalon,
        gelombang_ppdb: gelombangName,
      });
      const pendaftaranName = p.name;

      // 3. Ajukan (Draft → Diajukan)
      try {
        await ajukan.mutateAsync({ pendaftaran_ppdb: pendaftaranName });
      } catch (e) {
        warnings.push("Gagal otomatis Ajukan — silakan ajukan manual di detail.");
      }

      // 4. Auto-terima (opt-in): Diajukan → Diverifikasi → Diterima
      if (config.autoTerima) {
        try {
          await verifikasi.mutateAsync({
            pendaftaran_ppdb: pendaftaranName,
            status: "Diverifikasi",
            catatan: "Auto-verifikasi via Buat PPDB wizard",
          });
          await verifikasi.mutateAsync({
            pendaftaran_ppdb: pendaftaranName,
            status: "Diterima",
            catatan: "Auto-terima via Buat PPDB wizard",
          });
        } catch (e) {
          warnings.push("Auto-terima gagal — peran admin mungkin diperlukan.");
        }
      }

      // 5. Payment order
      let paymentUrl: string | undefined;
      let paymentOrderId: string | undefined;
      const wantPaymentNow =
        config.paymentPhase === "sebelum_seleksi" ||
        (config.paymentPhase === "setelah_diterima" && config.autoTerima);
      if (wantPaymentNow) {
        try {
          const po = await createPayment.mutateAsync({ pendaftaran_ppdb: pendaftaranName });
          paymentUrl = po.payment_url;
          paymentOrderId = po.order_id;
        } catch (e) {
          warnings.push("Gagal buat payment order — silakan ulang dari halaman Pembayaran.");
        }
      }

      setResult({ pendaftaranName, paymentUrl, paymentOrderId, warnings });
      setStep("hasil");
    } catch (e) {
      setSubmitErr((e as Error)?.message ?? "Gagal membuat pendaftaran.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Buat Pendaftaran PPDB"
        description="Alur lengkap: Gelombang → Calon Siswa → Approval → Seleksi → Pembayaran."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/ppdb" })}>
            Batal
          </Button>
        }
      />

      <SectionCard>
        <WorkflowStepper steps={stepperSteps} />
      </SectionCard>

      {step === "gelombang" && (
        <SectionCard title="1. Gelombang" description="Pilih tahun ajaran lalu pilih atau buat gelombang.">
          <div className="mb-4">
            <Field label="Tahun Ajaran *">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={tahunAjaran}
                    onChange={(v) => {
                      setTahunAjaran(v);
                      setGelombangName("");
                    }}
                    options={(tahunAjaranQ.data ?? []).map((t) => ({
                      value: t.name,
                      label: t.judul ?? t.name,
                    }))}
                    placeholder={tahunAjaranQ.isLoading ? "Memuat..." : "Pilih tahun ajaran..."}
                  />
                </div>
                <Button onClick={() => setShowTaModal(true)}>
                  + Baru
                </Button>
              </div>
            </Field>
          </div>

          {!tahunAjaran ? (
            <Alert tone="info" title="Pilih tahun ajaran dulu">
              Gelombang dan pendaftaran di-scope per tahun ajaran.
            </Alert>
          ) : (
            <>
          <div className="mb-4 flex gap-2">
            <ModeBtn active={gelombangMode === "existing"} onClick={() => setGelombangMode("existing")}>
              Pilih Existing
            </ModeBtn>
            <ModeBtn active={gelombangMode === "new"} onClick={() => setGelombangMode("new")}>
              Buat Baru
            </ModeBtn>
          </div>

          {gelombangMode === "existing" ? (
            gelombangQ.isLoading ? (
              <div className="py-6 text-center text-sm text-muted-fg">Memuat gelombang...</div>
            ) : filteredGelombangList.length === 0 ? (
              <Alert tone="warning" title="Belum ada gelombang aktif untuk TA ini">
                Klik <strong>Buat Baru</strong> di atas untuk membuat gelombang inline.
              </Alert>
            ) : (
              <div className="space-y-3">
                <SearchableSelect
                  value={gelombangName}
                  onChange={setGelombangName}
                  options={filteredGelombangList.map((g) => ({
                    value: g.name,
                    label: `${g.nama}${g.sekolah ? ` · ${g.sekolah}` : ""}${g.tingkat ? ` · Tk ${g.tingkat}` : ""}`,
                  }))}
                  placeholder="Pilih gelombang aktif..."
                />
                {selectedGelombang && (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-fg">
                    <div>
                      <strong>Kuota:</strong> {selectedGelombang.kuota ?? "∞"}
                    </div>
                    <div>
                      <strong>Biaya Pendaftaran:</strong> Rp{" "}
                      {(selectedGelombang.biaya_pendaftaran ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div>
                      <strong>Periode:</strong> {selectedGelombang.tanggal_buka ?? "—"} s/d{" "}
                      {selectedGelombang.tanggal_tutup ?? "—"}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama Gelombang *">
                <input
                  value={gelombangForm.nama}
                  onChange={(e) => setGelombangForm((s) => ({ ...s, nama: e.target.value }))}
                  className={inputCls}
                  placeholder="Gelombang 1 SMA 2026/2027"
                />
              </Field>
              <Field label="Sekolah">
                <SearchableSelect
                  value={gelombangForm.sekolah}
                  onChange={(v) => setGelombangForm((s) => ({ ...s, sekolah: v }))}
                  options={(sekolahQ.data ?? []).map((sk) => ({
                    value: sk.name,
                    label: sk.nama ?? sk.name,
                  }))}
                  placeholder={sekolahQ.isLoading ? "Memuat..." : "Pilih sekolah..."}
                />
              </Field>
              <Field label="Tingkat *">
                <select
                  value={gelombangForm.tingkat}
                  onChange={(e) => setGelombangForm((s) => ({ ...s, tingkat: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— pilih —</option>
                  {TINGKAT_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tanggal Buka *">
                <input
                  type="date"
                  value={gelombangForm.tanggal_buka}
                  onChange={(e) => setGelombangForm((s) => ({ ...s, tanggal_buka: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Tanggal Tutup *">
                <input
                  type="date"
                  value={gelombangForm.tanggal_tutup}
                  onChange={(e) => setGelombangForm((s) => ({ ...s, tanggal_tutup: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Kuota *">
                <input
                  type="number"
                  value={gelombangForm.kuota}
                  onChange={(e) => setGelombangForm((s) => ({ ...s, kuota: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Biaya Pendaftaran (Rp) *">
                <input
                  type="number"
                  value={gelombangForm.biaya_pendaftaran}
                  onChange={(e) =>
                    setGelombangForm((s) => ({ ...s, biaya_pendaftaran: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
              {gelombangErr && (
                <div className="sm:col-span-2">
                  <Alert tone="danger" title="Gagal membuat gelombang">
                    {gelombangErr}
                  </Alert>
                </div>
              )}
              <div className="sm:col-span-2 text-xs text-muted-fg">
                Status otomatis <strong>Aktif</strong> sehingga langsung bisa dipakai pendaftaran.
              </div>
            </div>
          )}

          {gelombangMode === "new" ? (
            <div className="mt-5 flex justify-between gap-2">
              <span />
              <Button
                onClick={submitGelombangInline}
                disabled={!canNextGelombang || creatingGelombang}
              >
                {creatingGelombang ? "Membuat..." : "Buat & Lanjut"}
              </Button>
            </div>
          ) : (
            <StepNav onBack={null} onNext={goNext} nextDisabled={!canNextGelombang} />
          )}
            </>
          )}
        </SectionCard>
      )}

      {step === "calon" && (
        <SectionCard title="2. Calon Siswa" description="Pilih calon yang sudah ada atau buat baru.">
          <div className="mb-4 flex gap-2">
            <ModeBtn active={calonMode === "existing"} onClick={() => setCalonMode("existing")}>
              Pilih Existing
            </ModeBtn>
            <ModeBtn active={calonMode === "new"} onClick={() => setCalonMode("new")}>
              Buat Baru
            </ModeBtn>
          </div>

          {calonMode === "existing" ? (
            <SearchableSelect
              value={calonName}
              onChange={setCalonName}
              options={(calonQ.data ?? []).map((c) => ({
                value: c.name,
                label: `${c.nama_lengkap ?? "—"}${c.nisn ? ` · NISN ${c.nisn}` : ""} (${c.name})`,
              }))}
              placeholder={calonQ.isLoading ? "Memuat..." : "Cari nama atau NISN..."}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama Lengkap *">
                <input
                  value={calonForm.nama_lengkap}
                  onChange={(e) => setCalonForm((s) => ({ ...s, nama_lengkap: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Jenis Kelamin *">
                <select
                  value={calonForm.jenis_kelamin}
                  onChange={(e) => setCalonForm((s) => ({ ...s, jenis_kelamin: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— pilih —</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </Field>
              <Field label="NISN">
                <input
                  value={calonForm.nisn}
                  onChange={(e) => setCalonForm((s) => ({ ...s, nisn: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="NIK">
                <input
                  value={calonForm.nik}
                  onChange={(e) => setCalonForm((s) => ({ ...s, nik: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="No. HP">
                <input
                  value={calonForm.no_hp}
                  onChange={(e) => setCalonForm((s) => ({ ...s, no_hp: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={calonForm.email}
                  onChange={(e) => setCalonForm((s) => ({ ...s, email: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Asal Sekolah" cols={2}>
                <input
                  value={calonForm.asal_sekolah}
                  onChange={(e) => setCalonForm((s) => ({ ...s, asal_sekolah: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          <StepNav onBack={goBack} onNext={goNext} nextDisabled={!canNextCalon} />
        </SectionCard>
      )}

      {step === "config" && (
        <SectionCard title="3. Konfigurasi" description="Atur tahap pembayaran dan auto-terima.">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-fg">
                Tahap Pembayaran
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                <ChoiceCard
                  active={config.paymentPhase === "sebelum_seleksi"}
                  onClick={() => setConfig((c) => ({ ...c, paymentPhase: "sebelum_seleksi" }))}
                  title="Sebelum Seleksi"
                  hint="Order dibuat langsung setelah pendaftaran."
                />
                <ChoiceCard
                  active={config.paymentPhase === "setelah_diterima"}
                  onClick={() => setConfig((c) => ({ ...c, paymentPhase: "setelah_diterima" }))}
                  title="Setelah Diterima"
                  hint="Order dibuat setelah seleksi lolos."
                />
                <ChoiceCard
                  active={config.paymentPhase === "tidak"}
                  onClick={() => setConfig((c) => ({ ...c, paymentPhase: "tidak" }))}
                  title="Tanpa Bayar Sekarang"
                  hint="Atur manual nanti dari Pembayaran."
                />
              </div>
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:border-brand">
                <input
                  type="checkbox"
                  checked={config.autoTerima}
                  onChange={(e) => setConfig((c) => ({ ...c, autoTerima: e.target.checked }))}
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
          </div>
          <StepNav onBack={goBack} onNext={goNext} />
        </SectionCard>
      )}

      {step === "konfirmasi" && (
        <SectionCard title="4. Konfirmasi" description="Tinjau ringkasan sebelum submit.">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Summary label="Gelombang">
              {selectedGelombang?.nama ?? gelombangName}
            </Summary>
            <Summary label="Tahun Ajaran">{tahunAjaran || "—"}</Summary>
            <Summary label="Calon Siswa">
              {calonMode === "existing"
                ? (calonQ.data ?? []).find((c) => c.name === calonName)?.nama_lengkap ?? calonName
                : calonForm.nama_lengkap + " (baru)"}
            </Summary>
            <Summary label="Tahap Pembayaran">
              {config.paymentPhase === "sebelum_seleksi"
                ? "Sebelum Seleksi"
                : config.paymentPhase === "setelah_diterima"
                  ? "Setelah Diterima"
                  : "Manual"}
            </Summary>
            <Summary label="Auto-Terima">
              <Badge tone={config.autoTerima ? "success" : "neutral"} dot>
                {config.autoTerima ? "Ya" : "Tidak"}
              </Badge>
            </Summary>
            <Summary label="Biaya Pendaftaran">
              Rp {(selectedGelombang?.biaya_pendaftaran ?? 0).toLocaleString("id-ID")}
            </Summary>
          </dl>

          {submitErr && (
            <Alert tone="danger" title="Submit gagal" className="mt-4">
              {submitErr}
            </Alert>
          )}

          <div className="mt-5 flex justify-between gap-2">
            <Button variant="outline" onClick={goBack} disabled={submitting}>
              Sebelumnya
            </Button>
            <Button onClick={doSubmit} disabled={submitting}>
              {submitting ? "Memproses..." : "Submit Pendaftaran"}
            </Button>
          </div>
        </SectionCard>
      )}

      {step === "hasil" && result && (
        <ResultPanel
          result={result}
          paymentPhase={config.paymentPhase}
          autoTerima={config.autoTerima}
          onSetSeleksi={async (hasil) => {
            // Set hasil pada Seleksi pertama yang terkait — best effort.
            // Endpoint set_hasil_seleksi expects seleksi name, bukan pendaftaran.
            // Cari Seleksi by pendaftaran.
            const list = await fetch(
              `/api/method/frappe.client.get_list?doctype=Seleksi PPDB&filters=${encodeURIComponent(
                JSON.stringify([["pendaftaran_ppdb", "=", result.pendaftaranName]]),
              )}&fields=${encodeURIComponent(JSON.stringify(["name"]))}&limit_page_length=1`,
              { credentials: "include" },
            )
              .then((r) => r.json())
              .then((j) => j.message ?? []);
            const seleksiName = list[0]?.name;
            if (!seleksiName) {
              alert("Belum ada Seleksi PPDB untuk pendaftaran ini.");
              return;
            }
            await setHasil.mutateAsync({ seleksi_ppdb: seleksiName, hasil });
            alert(`Hasil seleksi: ${hasil}.`);
          }}
          onCreatePayment={async () => {
            const po = await createPayment.mutateAsync({
              pendaftaran_ppdb: result.pendaftaranName,
            });
            window.open(po.payment_url, "_blank");
          }}
        />
      )}

      <TahunAjaranCreateModal
        open={showTaModal}
        onClose={() => setShowTaModal(false)}
        onCreated={async (name) => {
          await tahunAjaranQ.refetch();
          setTahunAjaran(name);
          setGelombangName("");
        }}
        sekolahOpts={(sekolahQ.data ?? []).map((sk) => ({
          value: sk.name,
          label: sk.nama ?? sk.name,
        }))}
      />
    </div>
  );
}

function ResultPanel({
  result,
  paymentPhase,
  autoTerima,
  onSetSeleksi,
  onCreatePayment,
}: {
  result: SubmitResult;
  paymentPhase: PaymentPhase;
  autoTerima: boolean;
  onSetSeleksi: (hasil: "Lulus" | "Tidak Lulus") => Promise<void>;
  onCreatePayment: () => Promise<void>;
}) {
  return (
    <SectionCard title="5. Hasil" description="Pendaftaran berhasil dibuat.">
      <div className="space-y-4">
        <Alert tone="success" title="Pendaftaran terbuat">
          No. Pendaftaran:{" "}
          <Link
            to="/ppdb/$noPendaftaran"
            params={{ noPendaftaran: result.pendaftaranName }}
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
          <ActionCard
            title="Verifikasi / Detail"
            description="Buka detail pendaftaran untuk approval workflow."
            href={`/ppdb/${result.pendaftaranName}`}
            primary
          />
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
            href="/ppdb/buat"
          />
        </div>
      </div>
    </SectionCard>
  );
}

// ===== Small UI helpers =====

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Lanjut",
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-5 flex justify-between gap-2">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          Sebelumnya
        </Button>
      ) : (
        <span />
      )}
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md border px-3 py-1.5 text-xs font-medium transition " +
        (active ? "border-brand bg-brand text-white" : "border-border bg-card hover:border-brand")
      }
    >
      {children}
    </button>
  );
}

function ChoiceCard({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md border p-3 text-left transition " +
        (active
          ? "border-brand bg-brand/10 ring-1 ring-brand"
          : "border-border bg-card hover:border-brand")
      }
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-muted-fg">{hint}</div>
    </button>
  );
}

function Summary({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-fg">{label}</dt>
      <dd className="mt-0.5 text-sm text-fg">{children}</dd>
    </div>
  );
}

function Field({
  label,
  children,
  cols = 1,
}: {
  label: string;
  children: React.ReactNode;
  cols?: 1 | 2;
}) {
  return (
    <label className={"block " + (cols === 2 ? "sm:col-span-2" : "")}>
      <span className="mb-1 block text-xs font-medium text-muted-fg">{label}</span>
      {children}
    </label>
  );
}

function ActionCard({
  title,
  description,
  href,
  onClick,
  primary,
}: {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void | Promise<void>;
  primary?: boolean;
}) {
  const cls =
    "block rounded-lg border p-3 text-left transition " +
    (primary
      ? "border-brand bg-brand/10 hover:border-brand"
      : "border-border bg-card hover:border-brand");
  const body = (
    <>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-muted-fg">{description}</div>
    </>
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={() => onClick?.()} className={cls + " w-full"}>
      {body}
    </button>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

function TahunAjaranCreateModal({
  open,
  onClose,
  onCreated,
  sekolahOpts,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
  sekolahOpts: { value: string; label: string }[];
}) {
  const [form, setForm] = useState({
    nama: "",
    sekolah: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate<{ name: string }>("Tahun Ajaran");

  const reset = () => {
    setForm({ nama: "", sekolah: "", tanggal_mulai: "", tanggal_selesai: "" });
    setErr(null);
  };

  const canSubmit =
    !!form.nama && !!form.sekolah && !!form.tanggal_mulai && !!form.tanggal_selesai;

  const submit = async () => {
    setErr(null);
    try {
      const r = await create.mutateAsync({
        nama: form.nama,
        sekolah: form.sekolah,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        status: "Aktif",
      });
      reset();
      onCreated(r.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat tahun ajaran.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Buat Tahun Ajaran"
      description="Nama akan digabung dengan kode sekolah secara otomatis."
      size="md"
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Membuat..." : "Buat"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama *" cols={2}>
          <input
            value={form.nama}
            onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))}
            className={inputCls}
            placeholder="2026-2027"
          />
        </Field>
        <Field label="Sekolah *" cols={2}>
          <SearchableSelect
            value={form.sekolah}
            onChange={(v) => setForm((s) => ({ ...s, sekolah: v }))}
            options={sekolahOpts}
            placeholder="Pilih sekolah..."
          />
        </Field>
        <Field label="Tanggal Mulai *">
          <input
            type="date"
            value={form.tanggal_mulai}
            onChange={(e) => setForm((s) => ({ ...s, tanggal_mulai: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="Tanggal Selesai *">
          <input
            type="date"
            value={form.tanggal_selesai}
            onChange={(e) => setForm((s) => ({ ...s, tanggal_selesai: e.target.value }))}
            className={inputCls}
          />
        </Field>
      </div>
      {err && (
        <div className="mt-3">
          <Alert tone="danger" title="Gagal">{err}</Alert>
        </div>
      )}
    </Modal>
  );
}

export const Route = createFileRoute("/ppdb/buat")({ component: PpdbBuatPage });
