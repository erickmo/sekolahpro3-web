import type { Pegawai } from "../../data/pegawai";

export function ProfilTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Data Pribadi</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Tempat lahir</dt><dd>{pegawai.tempatLahir}</dd>
          <dt className="text-muted-fg">Tanggal lahir</dt><dd>{pegawai.tanggalLahir}</dd>
          <dt className="text-muted-fg">Jenis kelamin</dt><dd>{pegawai.jenisKelamin}</dd>
          <dt className="text-muted-fg">Agama</dt><dd>{pegawai.agama}</dd>
          <dt className="text-muted-fg">Kewarganegaraan</dt><dd>{pegawai.kewarganegaraan}</dd>
          <dt className="text-muted-fg">NIK</dt><dd>{pegawai.nik ?? "—"}</dd>
          <dt className="text-muted-fg">NUPTK</dt><dd>{pegawai.nuptk ?? "—"}</dd>
        </dl>
      </section>
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Kontak & Alamat</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Telepon</dt><dd>{pegawai.telepon ?? "—"}</dd>
          <dt className="text-muted-fg">Email</dt><dd>{pegawai.email ?? "—"}</dd>
          <dt className="text-muted-fg">Alamat</dt><dd>{pegawai.alamat ?? "—"}</dd>
          <dt className="text-muted-fg">Kabupaten</dt><dd>{pegawai.kabupaten ?? "—"}</dd>
          <dt className="text-muted-fg">Provinsi</dt><dd>{pegawai.provinsi ?? "—"}</dd>
        </dl>
      </section>
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2 md:col-span-2">
        <h2 className="text-sm font-semibold text-fg">Kepegawaian</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Status pegawai</dt><dd>{pegawai.statusKepegawaian}</dd>
          <dt className="text-muted-fg">TMT kerja</dt><dd>{pegawai.tmtKerja}</dd>
          <dt className="text-muted-fg">Pendidikan</dt><dd>{pegawai.pendidikanTerakhir}{pegawai.jurusan ? ` · ${pegawai.jurusan}` : ""}</dd>
          {pegawai.pangkat ? (<><dt className="text-muted-fg">Pangkat/Golongan</dt><dd>{pegawai.pangkat} / {pegawai.golongan}</dd></>) : null}
          {pegawai.masaKontrakBerakhir ? (<><dt className="text-muted-fg">Kontrak berakhir</dt><dd>{pegawai.masaKontrakBerakhir}</dd></>) : null}
        </dl>
      </section>
    </div>
  );
}
