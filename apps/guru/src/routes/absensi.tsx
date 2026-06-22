import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  IconCheck,
  IconAlert,
} from "@sekolahpro/ui";
import { useMyAbsensi, formatTanggal } from "../api/portalPegawai";
import { absensiTone } from "../lib/badge";

function isHadir(s: string) {
  return s === "Hadir";
}

function AbsensiPage() {
  const absensi = useMyAbsensi();
  const rows = absensi.data ?? [];

  const total = rows.length;
  const hadir = rows.filter((r) => isHadir(r.status)).length;
  const izinSakit = rows.filter((r) => r.status === "Izin" || r.status === "Sakit").length;
  const alpha = rows.filter((r) => r.status === "Alpha" || r.status === "Alpa").length;
  const persen = total === 0 ? 0 : Math.round((hadir / total) * 100);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Kepegawaian"
        title="Absensi Saya"
        description="Rekap kehadiran Anda yang tercatat sistem."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Persentase Hadir" value={`${persen}%`} accent="emerald" icon={<IconCheck />} hint={`${hadir} dari ${total}`} />
        <StatCard label="Hadir" value={hadir} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Izin / Sakit" value={izinSakit} accent="amber" icon={<IconAlert />} />
        <StatCard label="Alpha" value={alpha} accent="rose" urgency={alpha > 0 ? "warn" : "normal"} icon={<IconAlert />} />
      </div>

      <SectionCard title="Riwayat Kehadiran" description="Terbaru di atas" padded={false}>
        {absensi.isLoading ? (
          <p className="p-5 text-sm text-muted-fg">Memuat...</p>
        ) : absensi.isError ? (
          <p className="p-5 text-sm text-danger">Gagal memuat data absensi.</p>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada catatan absensi" description="Kehadiran Anda akan tampil di sini." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-fg">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={`${r.tanggal}-${i}`}>
                    <td className="px-5 py-3 whitespace-nowrap text-muted-fg tabular-nums">{formatTanggal(r.tanggal)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={absensiTone(r.status)} dot>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-fg text-xs">{r.keterangan || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/absensi")({ component: AbsensiPage });
