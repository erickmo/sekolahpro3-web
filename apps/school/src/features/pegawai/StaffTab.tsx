import type { PegawaiProfilStaff } from "../../data/pegawai";

const PRIO_CLASS: Record<"Rendah" | "Sedang" | "Tinggi" | "Mendesak", string> = {
  "Rendah": "text-muted-fg",
  "Sedang": "text-brand",
  "Tinggi": "text-warning",
  "Mendesak": "text-danger",
};

export function StaffTab({ profil }: { profil: PegawaiProfilStaff }) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Departemen & Jabatan</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Departemen</dt><dd>{profil.departemen}</dd>
          <dt className="text-muted-fg">Jabatan</dt><dd>{profil.jabatanStaff}</dd>
          <dt className="text-muted-fg">Atasan</dt><dd>{profil.atasan ?? "—"}</dd>
          <dt className="text-muted-fg">Jam kerja/minggu</dt><dd>{profil.jamKerjaMingguIni}</dd>
          <dt className="text-muted-fg">Tugas aktif</dt><dd>{profil.jumlahTugasAktif} ({profil.jumlahTugasSelesai} selesai)</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Tugas</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg">
            <tr><th className="text-left p-1">ID</th><th className="text-left p-1">Judul</th><th className="text-left p-1">Prioritas</th><th className="text-left p-1">Status</th><th className="text-left p-1">Jatuh tempo</th></tr>
          </thead>
          <tbody>
            {profil.tugas.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-1">{t.id}</td><td className="p-1">{t.judul}</td>
                <td className={`p-1 ${PRIO_CLASS[t.prioritas]}`}>{t.prioritas}</td>
                <td className="p-1">{t.status}</td><td className="p-1">{t.jatuhTempo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Riwayat Jabatan</h2>
        <ul className="text-sm space-y-1">
          {profil.riwayatJabatan.map((r, i) => (
            <li key={i} className="flex justify-between">
              <span>{r.jabatan} — {r.departemen}</span>
              <span className="text-muted-fg">{r.tahun}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Pelatihan</h2>
        <ul className="text-sm space-y-1">
          {profil.pelatihan.map((p, i) => (
            <li key={i} className="flex justify-between">
              <span>{p.nama} — {p.penyelenggara}</span>
              <span className="text-muted-fg">{p.tanggal} · {p.durasi}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
