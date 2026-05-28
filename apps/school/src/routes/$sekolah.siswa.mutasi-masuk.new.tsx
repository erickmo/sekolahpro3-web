import { useCallback, useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  SectionCard,
  Textarea,
  FormField,
  SearchableSelect,
  InfoField,
  InfoGrid,
  type SearchableOption,
} from "@sekolahpro/ui";
import { WorkflowStepper, type WorkflowStep } from "@sekolahpro/ui/components/WorkflowStepper";

interface DapodikData {
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  nama_sekolah_asal: string;
  npsn_asal: string;
  jenjang: string;
  tingkat_terakhir?: string;
  nama_ayah_kk?: string;
  nama_ibu_kk?: string;
  verified: boolean;
}

interface RombelInfo {
  name: string;
  nama_rombel: string;
  kapasitas: number;
  terisi: number;
}

const NPSN_REGEX = /^\d{8}$/;
const NISN_REGEX = /^\d{10}$/;

async function verifyDapodik(npsn: string, nisn: string): Promise<DapodikData> {
  const res = await fetch("/api/method/sekolahpro.integrasi.dapodik.verify_siswa", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ npsn, nisn }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dapodik tidak tersedia: ${res.status} ${txt}`);
  }
  const json = (await res.json()) as { message?: DapodikData };
  if (!json.message || !json.message.verified) {
    throw new Error("Data tidak ditemukan di Dapodik atau status tidak terverifikasi.");
  }
  return json.message;
}

async function loadRombel(query: string): Promise<SearchableOption[]> {
  const params: Parameters<typeof listResource>[1] = {
    fields: ["name", "nama_rombel", "kapasitas", "terisi"],
    limit_page_length: 20,
  };
  if (query) params.filters = [["nama_rombel", "like", `%${query}%`]];
  const rows = await listResource<RombelInfo>("Rombongan Belajar", params);
  return rows.map((r) => {
    const opt: SearchableOption = {
      value: r.name,
      label: r.nama_rombel ?? r.name,
    };
    if (r.kapasitas != null && r.terisi != null) {
      opt.hint = `${r.terisi}/${r.kapasitas} terisi`;
    }
    return opt;
  });
}

function buildSteps(current: 1 | 2 | 3): WorkflowStep[] {
  const labels = [
    { key: "verify", label: "Verifikasi Dapodik" },
    { key: "detail", label: "Data Tambahan" },
    { key: "confirm", label: "Konfirmasi" },
  ];
  return labels.map((l, idx) => ({
    ...l,
    status: idx + 1 < current ? "done" : idx + 1 === current ? "current" : "pending",
  }));
}

function MutasiMasukNewPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const create = useResourceCreate<{ name: string }>("Mutasi Masuk");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [npsn, setNpsn] = useState("");
  const [nisn, setNisn] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [dapodik, setDapodik] = useState<DapodikData | null>(null);

  // step 2 inputs
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  const [rombelTujuan, setRombelTujuan] = useState("");
  const [alasanPindah, setAlasanPindah] = useState("");

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const handleVerify = useCallback(async () => {
    setVerifyErr(null);
    if (!NPSN_REGEX.test(npsn)) {
      setVerifyErr("NPSN harus 8 digit angka.");
      return;
    }
    if (!NISN_REGEX.test(nisn)) {
      setVerifyErr("NISN harus 10 digit angka.");
      return;
    }
    setVerifying(true);
    try {
      const data = await verifyDapodik(npsn, nisn);
      setDapodik(data);
      setStep(2);
    } catch (e) {
      setVerifyErr(e instanceof Error ? e.message : "Verifikasi gagal.");
    } finally {
      setVerifying(false);
    }
  }, [npsn, nisn]);

  async function handleSubmit() {
    if (!dapodik) return;
    setSubmitErr(null);
    if (!tanggalMasuk) {
      setSubmitErr("Tanggal masuk wajib diisi.");
      return;
    }
    if (!rombelTujuan) {
      setSubmitErr("Pilih rombel tujuan.");
      return;
    }
    if (alasanPindah.trim().length < 20) {
      setSubmitErr("Alasan pindah minimal 20 karakter.");
      return;
    }
    try {
      const doc = await create.mutateAsync({
        nisn: dapodik.nisn,
        npsn_asal: dapodik.npsn_asal,
        nama_sekolah_asal: dapodik.nama_sekolah_asal,
        siswa_baru: dapodik.nama_lengkap,
        jenis_kelamin: dapodik.jenis_kelamin,
        tanggal_lahir: dapodik.tanggal_lahir,
        tingkat_terakhir: dapodik.tingkat_terakhir,
        nama_ayah_kk: dapodik.nama_ayah_kk,
        nama_ibu_kk: dapodik.nama_ibu_kk,
        tanggal_masuk: tanggalMasuk,
        rombel_tujuan: rombelTujuan,
        alasan_pindah: alasanPindah,
        status: "Diverifikasi Dapodik",
      });
      void navigate({ to: "/$sekolah/siswa/mutasi-masuk", params: { sekolah } });
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "Gagal menyimpan mutasi masuk.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Siswa › Mutasi Masuk"
        title="Terima Siswa Pindahan"
        description="Verifikasi Dapodik dulu — input manual tidak diizinkan untuk mencegah ghost data."
      />

      <SectionCard title="Status">
        <WorkflowStepper steps={buildSteps(step)} />
      </SectionCard>

      {step === 1 ? (
        <SectionCard
          title="Langkah 1: Verifikasi Dapodik"
          action={<Badge tone="warning" dot>Wajib</Badge>}
        >
          <p className="mb-4 text-xs text-muted-fg">
            Input NPSN sekolah asal + NISN siswa. Sistem akan memverifikasi via API Dapodik
            Kemendikbud. Tidak ada jalur manual — jika Dapodik tidak tersedia, coba lagi nanti.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="NPSN Sekolah Asal" required hint="8 digit, lihat dapo.kemendikbud.go.id">
              <Input
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="20104321"
                maxLength={8}
                inputMode="numeric"
              />
            </FormField>
            <FormField label="NISN Siswa" required hint="10 digit, dari rapot/ijazah sekolah lama">
              <Input
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="0123456789"
                maxLength={10}
                inputMode="numeric"
              />
            </FormField>
          </div>
          {verifyErr ? (
            <div className="mt-4 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
              {verifyErr}
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/$sekolah/siswa/mutasi-masuk", params: { sekolah } })}>
              Batal
            </Button>
            <Button onClick={handleVerify} disabled={verifying}>
              {verifying ? "Memverifikasi…" : "Cek Dapodik"}
            </Button>
          </div>
        </SectionCard>
      ) : null}

      {step === 2 && dapodik ? (
        <>
          <SectionCard
            title="Data Hasil Verifikasi Dapodik"
            action={
              <Badge tone="success" dot>
                Verified
              </Badge>
            }
          >
            <InfoGrid cols={3}>
              <InfoField label="Nama Lengkap" value={dapodik.nama_lengkap} />
              <InfoField label="NISN" value={<span className="font-mono">{dapodik.nisn}</span>} />
              <InfoField label="Jenis Kelamin" value={dapodik.jenis_kelamin} />
              <InfoField label="Tanggal Lahir" value={dapodik.tanggal_lahir} />
              <InfoField label="Sekolah Asal" value={dapodik.nama_sekolah_asal} />
              <InfoField label="NPSN" value={<span className="font-mono">{dapodik.npsn_asal}</span>} />
              {dapodik.tingkat_terakhir ? (
                <InfoField label="Tingkat Terakhir" value={dapodik.tingkat_terakhir} />
              ) : null}
              {dapodik.nama_ayah_kk ? (
                <InfoField label="Nama Ayah (KK)" value={dapodik.nama_ayah_kk} />
              ) : null}
              {dapodik.nama_ibu_kk ? (
                <InfoField label="Nama Ibu (KK)" value={dapodik.nama_ibu_kk} />
              ) : null}
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Langkah 2: Data Tambahan">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Tanggal Masuk" required>
                <Input
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                />
              </FormField>
              <FormField label="Rombel Tujuan" required hint="Pilih rombel yang masih punya kapasitas">
                <SearchableSelect
                  value={rombelTujuan}
                  onChange={(val) => setRombelTujuan(val)}
                  loadOptions={loadRombel}
                  placeholder="Cari rombel…"
                />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Alasan Pindah" required hint="Minimal 20 karakter">
                <Textarea
                  value={alasanPindah}
                  onChange={(e) => setAlasanPindah(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Orang tua pindah tugas ke Bandung per Juli 2026."
                />
              </FormField>
            </div>
            {submitErr ? (
              <div className="mt-4 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
                {submitErr}
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={create.isPending}>
                ← Kembali ke Verifikasi
              </Button>
              <Button onClick={() => setStep(3)} disabled={create.isPending}>
                Lanjut ke Konfirmasi →
              </Button>
            </div>
          </SectionCard>
        </>
      ) : null}

      {step === 3 && dapodik ? (
        <SectionCard
          title="Langkah 3: Konfirmasi"
          action={<Badge tone="warning">Tinjau sebelum submit</Badge>}
        >
          <p className="mb-3 text-xs text-muted-fg">
            Submit akan membuat record Mutasi Masuk dan men-trigger penerbitan NIS baru +
            penempatan ke rombel tujuan. Pastikan data benar.
          </p>
          <InfoGrid cols={2}>
            <InfoField label="Siswa" value={`${dapodik.nama_lengkap} (NISN ${dapodik.nisn})`} />
            <InfoField label="Asal" value={`${dapodik.nama_sekolah_asal} (NPSN ${dapodik.npsn_asal})`} />
            <InfoField label="Tanggal Masuk" value={tanggalMasuk || "—"} />
            <InfoField label="Rombel Tujuan" value={rombelTujuan || "—"} />
          </InfoGrid>
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Alasan</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{alasanPindah}</p>
          </div>
          {submitErr ? (
            <div className="mt-4 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
              {submitErr}
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(2)} disabled={create.isPending}>
              ← Edit Data
            </Button>
            <Button onClick={handleSubmit} disabled={create.isPending}>
              {create.isPending ? "Memproses…" : "Submit Mutasi Masuk"}
            </Button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/mutasi-masuk/new")({ component: MutasiMasukNewPage });
