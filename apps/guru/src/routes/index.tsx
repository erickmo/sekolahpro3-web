import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  IconWallet,
  IconCalendar,
  IconCheck,
  IconFile,
} from "@sekolahpro/ui";
import { useMyCuti, useSaldoCuti, formatTanggal } from "../api/portalPegawai";
import { cutiTone } from "../lib/badge";

const QUICK = [
  { to: "/cuti" as const, label: "Ajukan / Lihat Cuti", icon: <IconCalendar /> },
  { to: "/absensi" as const, label: "Absensi Saya", icon: <IconCheck /> },
  { to: "/sk" as const, label: "SK Saya", icon: <IconFile /> },
];

function Beranda() {
  const saldo = useSaldoCuti();
  const cuti = useMyCuti();

  const capped = (saldo.data ?? []).filter((r) => r.kuota !== null);
  const recent = (cuti.data ?? []).slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Beranda"
        title="Layanan Mandiri Pegawai"
        description="Ringkasan saldo cuti dan pengajuan terbaru Anda."
      />

      <SectionCard title="Saldo Cuti" description="Sisa kuota tahun berjalan">
        {saldo.isLoading ? (
          <p className="text-sm text-muted-fg">Memuat saldo...</p>
        ) : saldo.isError ? (
          <p className="text-sm text-danger">Gagal memuat saldo cuti.</p>
        ) : capped.length === 0 ? (
          <p className="text-sm text-muted-fg">Belum ada kuota cuti yang ditetapkan.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {capped.map((r) => (
              <StatCard
                key={r.jenis_cuti}
                label={r.jenis_cuti}
                value={`${r.sisa ?? 0} hari`}
                accent={r.sisa !== null && r.sisa <= 0 ? "rose" : "emerald"}
                icon={<IconWallet />}
                hint={`Terpakai ${r.terpakai} / ${r.kuota}`}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Pengajuan Cuti Terbaru" className="lg:col-span-2" padded={false}>
          {cuti.isLoading ? (
            <p className="p-5 text-sm text-muted-fg">Memuat...</p>
          ) : cuti.isError ? (
            <p className="p-5 text-sm text-danger">Gagal memuat data cuti.</p>
          ) : recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada pengajuan cuti"
                description="Pengajuan cuti Anda akan tampil di sini."
                action={
                  <Link to="/cuti" className="text-sm text-brand hover:underline">
                    Ajukan cuti
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((c) => (
                <li key={c.name} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg">{c.jenis_cuti}</div>
                    <div className="text-xs text-muted-fg">
                      {formatTanggal(c.tanggal_mulai)} – {formatTanggal(c.tanggal_selesai)}
                    </div>
                  </div>
                  <Badge tone={cutiTone(c.status)} dot>
                    {c.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Akses Cepat">
          <div className="flex flex-col gap-2">
            {QUICK.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm text-fg hover:bg-muted transition-colors"
              >
                <span className="h-4 w-4 text-muted-fg">{q.icon}</span>
                {q.label}
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({ component: Beranda });
