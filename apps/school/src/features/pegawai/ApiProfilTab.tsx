import type { PegawaiApi } from "./roles";

type Item = { label: string; value?: string | number | undefined };

function Section({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      <dl className="grid grid-cols-[150px_1fr] gap-y-1 text-sm">
        {items.map((it) => (
          <div key={it.label} className="contents">
            <dt className="text-muted-fg">{it.label}</dt>
            <dd>{it.value !== undefined && it.value !== "" ? it.value : "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ApiProfilTab({ pegawai: p }: { pegawai: PegawaiApi }) {
  const pribadi: Item[] = [
    { label: "Tempat lahir", value: p.tempat_lahir },
    { label: "Tanggal lahir", value: p.tanggal_lahir },
    { label: "Jenis kelamin", value: p.jenis_kelamin },
    { label: "Agama", value: p.agama },
    { label: "NIK", value: p.nik },
    { label: "NUPTK", value: p.nuptk },
    { label: "No. HP", value: p.no_hp },
    { label: "Email", value: p.email_pribadi },
    { label: "Alamat", value: p.alamat },
    { label: "NPWP", value: p.npwp },
  ];
  const kepegawaian: Item[] = [
    { label: "Status", value: p.status_kepegawaian },
    { label: "Jabatan fungsional", value: p.jabatan_fungsional },
    { label: "Pendidikan terakhir", value: p.pendidikan_terakhir },
    { label: "Golongan", value: p.golongan },
    { label: "NIP", value: p.nip },
    { label: "NRG", value: p.nrg },
    { label: "TMT CPNS", value: p.tmt_cpns },
    { label: "TMT pertama kerja", value: p.tmt_pertama_kerja },
    { label: "TMT di sekolah", value: p.tmt_di_sekolah },
    { label: "Sekolah", value: p.sekolah },
  ];
  const sertifikasi: Item[] = [
    { label: "Sudah sertifikasi", value: p.sudah_sertifikasi === 1 ? "Ya" : "Belum" },
    { label: "Nomor sertifikat", value: p.nomor_sertifikat },
    { label: "Bidang studi", value: p.bidang_studi },
    { label: "Tahun sertifikasi", value: p.tahun_sertifikasi },
  ];
  const finansial: Item[] = [
    { label: "Bank", value: p.bank },
    { label: "No. rekening", value: p.no_rekening },
    { label: "BPJS Kesehatan", value: p.bpjs_kesehatan },
    { label: "BPJS Ketenagakerjaan", value: p.bpjs_ketenagakerjaan },
    { label: "NUKS", value: p.nuks },
    { label: "No. Karpeg", value: p.nomor_karpeg },
    { label: "No. Taspen", value: p.nomor_taspen },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Section title="Data Pribadi" items={pribadi} />
      <Section title="Kepegawaian" items={kepegawaian} />
      <Section title="Sertifikasi" items={sertifikasi} />
      <Section title="Finansial & Jaminan" items={finansial} />
    </div>
  );
}
