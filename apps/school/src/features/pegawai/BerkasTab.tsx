import type { Pegawai } from "../../data/pegawai";

export function BerkasTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Berkas</h2>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Nama</th><th className="text-left p-1">Tipe</th><th className="text-left p-1">Ukuran</th><th className="text-left p-1">Diunggah</th></tr>
        </thead>
        <tbody>
          {pegawai.dokumen.map((d, i) => (
            <tr key={i} className="border-t border-border">
              <td className="p-1">{d.nama}</td><td className="p-1">{d.tipe}</td><td className="p-1">{d.ukuran}</td><td className="p-1">{d.diunggah}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
