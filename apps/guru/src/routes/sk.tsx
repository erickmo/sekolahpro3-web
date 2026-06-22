import { createFileRoute } from "@tanstack/react-router";
import { Badge, EmptyState, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useMySk, formatTanggal } from "../api/portalPegawai";
import { skTone } from "../lib/badge";

function SkPage() {
  const sk = useMySk();
  const rows = sk.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Kepegawaian"
        title="SK Saya"
        description="Surat Keputusan Mengajar dan Jabatan atas nama Anda."
      />

      <SectionCard title="Daftar SK" description="SK Mengajar & SK Jabatan" padded={false}>
        {sk.isLoading ? (
          <p className="p-5 text-sm text-muted-fg">Memuat...</p>
        ) : sk.isError ? (
          <p className="p-5 text-sm text-danger">Gagal memuat data SK.</p>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada SK" description="SK Mengajar / Jabatan Anda akan tampil di sini." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-fg">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Jenis</th>
                  <th className="px-5 py-2.5 text-left font-medium">Nomor</th>
                  <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td className="px-5 py-3 font-medium text-fg">SK {r.jenis}</td>
                    <td className="px-5 py-3 text-muted-fg">{r.nomor_sk_manual || r.name}</td>
                    <td className="px-5 py-3 text-muted-fg tabular-nums">{formatTanggal(r.tanggal_sk)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={skTone(r.status)} dot>
                        {r.status}
                      </Badge>
                    </td>
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

export const Route = createFileRoute("/sk")({ component: SkPage });
