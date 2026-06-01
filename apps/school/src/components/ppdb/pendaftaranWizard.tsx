/**
 * "Tambah Pendaftar" two-step wizard for the Pendaftaran PPDB list page.
 *
 * Extracted from the route file so the page stays within the 300-line budget
 * (Vernon). ONLY sch.$sekolah.ppdb.daftar.tsx imports this module. Behavior is
 * unchanged from the original in-route wizard: step 1 picks a Calon Siswa,
 * step 2 picks an active Gelombang, then submits a new Pendaftaran PPDB doc.
 */

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Modal, SearchableSelect } from "@sekolahpro/ui";
import { useResourceList, useResourceCreate } from "@sekolahpro/api-client";
import { useGelombangAktif } from "../../lib/ppdbApi";

export interface PendaftaranWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  sekolah: string;
}

type CalonOpt = { name: string; nama_lengkap?: string };

const CALON_DOCTYPE = "Calon Siswa";
const PENDAFTARAN_DOCTYPE = "Pendaftaran PPDB";
const CALON_LIMIT = 100;
const SUBMIT_ERROR = "Gagal membuat pendaftaran.";

/** Footer controls: step navigation + submit, varying by current step. */
function WizardFooter({
  step, canNext, canSubmit, pending, onPrev, onNext, onSubmit,
}: {
  step: 1 | 2;
  canNext: boolean;
  canSubmit: boolean;
  pending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-fg">Langkah {step} dari 2</span>
      <div className="flex gap-2">
        {step === 2 && (
          <Button variant="outline" onClick={onPrev} disabled={pending}>
            Sebelumnya
          </Button>
        )}
        {step === 1 ? (
          <Button onClick={onNext} disabled={!canNext}>
            Lanjut
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={!canSubmit || pending}>
            {pending ? "Membuat..." : "Buat Pendaftaran"}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Step 1 body: searchable Calon Siswa picker + add-new hint. */
function CalonStep({
  value, onChange, loading, sekolah, options,
}: {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  sekolah: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-muted-fg">Calon Siswa</label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={loading ? "Memuat..." : "Cari nama atau ID calon..."}
      />
      <p className="mt-2 text-xs text-muted-fg">
        Calon belum terdaftar?{" "}
        <Link to="/sch/$sekolah/ppdb/calon-siswa" params={{ sekolah }} className="text-brand hover:underline">
          Tambah Calon Siswa
        </Link>
        .
      </p>
    </div>
  );
}

/** Step 2 body: searchable active Gelombang picker + empty-state hint. */
function GelombangStep({
  value, onChange, loading, empty, sekolah, options,
}: {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  empty: boolean;
  sekolah: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-muted-fg">Gelombang Aktif</label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={loading ? "Memuat..." : "Pilih gelombang..."}
      />
      {empty && (
        <p className="mt-2 text-xs text-amber-700">
          Belum ada gelombang aktif.{" "}
          <Link to="/sch/$sekolah/ppdb/gelombang" params={{ sekolah }} className="underline">
            Buka pengaturan gelombang
          </Link>
          .
        </p>
      )}
    </div>
  );
}

/** Two-step wizard creating a Pendaftaran PPDB from a Calon Siswa + Gelombang. */
export function PendaftaranWizard({ open, onClose, onCreated, sekolah }: PendaftaranWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [calon, setCalon] = useState<string>("");
  const [gelombang, setGelombang] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const calonQ = useResourceList<CalonOpt>(CALON_DOCTYPE, {
    fields: ["name", "nama_lengkap"],
    order_by: "`modified` desc",
    limit_page_length: CALON_LIMIT,
  }, { enabled: open });

  const gelombangQ = useGelombangAktif();
  const create = useResourceCreate<{ name: string }>(PENDAFTARAN_DOCTYPE);

  /** Reset wizard form back to its initial state. */
  const reset = () => {
    setStep(1);
    setCalon("");
    setGelombang("");
    setErr(null);
  };

  /** Submit the new pendaftaran; surface backend errors inline. */
  const submit = async () => {
    setErr(null);
    try {
      await create.mutateAsync({ calon_siswa: calon, gelombang_ppdb: gelombang });
      onCreated();
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? SUBMIT_ERROR);
    }
  };

  const calonOpts = (calonQ.data ?? []).map((c) => ({
    value: c.name,
    label: `${c.nama_lengkap ?? "—"} (${c.name})`,
  }));
  const gelombangOpts = (gelombangQ.data ?? []).map((g) => ({
    value: g.name,
    label: `${g.nama}${g.tahun_ajaran ? ` · TA ${g.tahun_ajaran}` : ""}${g.sekolah ? ` · ${g.sekolah}` : ""}`,
  }));

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size="lg"
      title="Tambah Pendaftaran PPDB"
      description="Pilih calon siswa dan gelombang aktif."
      tone="brand"
      footer={
        <WizardFooter
          step={step}
          canNext={!!calon}
          canSubmit={!!gelombang}
          pending={create.isPending}
          onPrev={() => setStep(1)}
          onNext={() => setStep(2)}
          onSubmit={submit}
        />
      }
    >
      <div className="space-y-4">
        {step === 1 && (
          <CalonStep
            value={calon}
            onChange={setCalon}
            loading={calonQ.isLoading}
            sekolah={sekolah}
            options={calonOpts}
          />
        )}
        {step === 2 && (
          <GelombangStep
            value={gelombang}
            onChange={setGelombang}
            loading={gelombangQ.isLoading}
            empty={gelombangQ.data?.length === 0}
            sekolah={sekolah}
            options={gelombangOpts}
          />
        )}
        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
