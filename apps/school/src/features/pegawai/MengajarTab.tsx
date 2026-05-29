import type { PegawaiProfilGuru } from "../../data/pegawai";

export function MengajarTab({ profil }: { profil: PegawaiProfilGuru }) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Mata Pelajaran Pengampu</h2>
        <div className="flex flex-wrap gap-2">
          {profil.mapelPengampu.map((m) => (
            <span key={m} className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs">{m}</span>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-fg">
          {profil.jenisPtk} · {profil.jumlahKelas} kelas · {profil.totalJamMengajar} jam/minggu · rata-rata nilai {profil.rataNilaiKelas}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Jadwal Mengajar</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg">
            <tr><th className="text-left p-1">Hari</th><th className="text-left p-1">Jam</th><th className="text-left p-1">Mapel</th><th className="text-left p-1">Kelas</th><th className="text-left p-1">Ruang</th></tr>
          </thead>
          <tbody>
            {profil.jadwalMengajar.map((j, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-1">{j.hari}</td><td className="p-1">{j.jam}</td><td className="p-1">{j.mapel}</td><td className="p-1">{j.kelas}</td><td className="p-1">{j.ruang}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Riwayat Mengajar</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg">
            <tr><th className="text-left p-1">Tahun</th><th className="text-left p-1">Semester</th><th className="text-left p-1">Mapel</th><th className="text-left p-1">Kelas</th><th className="text-left p-1">Siswa</th></tr>
          </thead>
          <tbody>
            {profil.riwayatMengajar.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-1">{r.tahun}</td><td className="p-1">{r.semester}</td><td className="p-1">{r.mapel}</td><td className="p-1">{r.kelas}</td><td className="p-1">{r.jumlahSiswa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">SK Mengajar</h2>
        <ul className="text-sm space-y-1">
          {profil.skMengajar.map((sk) => (
            <li key={sk.nomorSk} className="flex justify-between">
              <span>{sk.nomorSk} — {sk.mapel} ({sk.tahunAjaran})</span>
              <span className="text-muted-fg">{sk.tanggalSk}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Sertifikasi</h2>
        <ul className="text-sm space-y-1">
          {profil.sertifikasi.map((s) => (
            <li key={s.noSertifikat} className="flex justify-between">
              <span>{s.nama} — {s.lembaga}</span>
              <span className="text-muted-fg">{s.tanggal}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
