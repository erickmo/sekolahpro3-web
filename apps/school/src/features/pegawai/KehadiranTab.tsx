import type { Pegawai } from "../../data/pegawai";

export function KehadiranTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Kehadiran — {pegawai.persenKehadiran}%</h2>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Tanggal</th><th className="text-left p-1">Status</th><th className="text-left p-1">Masuk</th><th className="text-left p-1">Pulang</th><th className="text-left p-1">Keterangan</th></tr>
        </thead>
        <tbody>
          {pegawai.kehadiran.map((k, i) => (
            <tr key={i} className="border-t border-border">
              <td className="p-1">{k.tanggal}</td><td className="p-1">{k.status}</td><td className="p-1">{k.jamMasuk ?? "—"}</td><td className="p-1">{k.jamPulang ?? "—"}</td><td className="p-1">{k.keterangan ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
