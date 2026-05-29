import type { PegawaiApi } from "./roles";

export function ApiProfilTab({ pegawai }: { pegawai: PegawaiApi }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Data Pribadi</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Tempat lahir</dt><dd>{pegawai.tempat_lahir ?? "—"}</dd>
          <dt className="text-muted-fg">Tanggal lahir</dt><dd>{pegawai.tanggal_lahir ?? "—"}</dd>
          <dt className="text-muted-fg">Jenis kelamin</dt><dd>{pegawai.jenis_kelamin ?? "—"}</dd>
          <dt className="text-muted-fg">Agama</dt><dd>{pegawai.agama ?? "—"}</dd>
          <dt className="text-muted-fg">NIK</dt><dd>{pegawai.nik ?? "—"}</dd>
          <dt className="text-muted-fg">NUPTK</dt><dd>{pegawai.nuptk ?? "—"}</dd>
        </dl>
      </section>
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Kepegawaian</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Status</dt><dd>{pegawai.status_kepegawaian ?? "—"}</dd>
          <dt className="text-muted-fg">Jabatan fungsional</dt><dd>{pegawai.jabatan_fungsional ?? "—"}</dd>
          <dt className="text-muted-fg">TMT pertama kerja</dt><dd>{pegawai.tmt_pertama_kerja ?? "—"}</dd>
          <dt className="text-muted-fg">Sekolah</dt><dd>{pegawai.sekolah ?? "—"}</dd>
        </dl>
      </section>
    </div>
  );
}
