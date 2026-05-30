import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  EmptyState,
  IconHome,
  IconPlus,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GedungFormModal } from "../components/infrastruktur/GedungFormModal";

type Gedung = { name: string; nama?: string; kode?: string; tahun_dibangun?: number };
type Lantai = { name: string; gedung?: string };
type Ruangan = { name: string; gedung?: string };

/**
 * Daftar Gedung — list bergaya kartu. Tiap kartu = 1 gedung dengan ringkasan
 * jumlah lantai & ruangan, link ke halaman detail gedung (Lantai / Ruangan &
 * Fasilitas / Utilitas ada di dalam detail). Form tambah tetap di sini.
 */
function GedungListPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const [showCreate, setShowCreate] = useState(false);

  const gedungQ = useResourceList<Gedung>("Gedung", {
    fields: ["name", "nama", "kode", "tahun_dibangun"],
    order_by: "nama asc",
    limit_page_length: 0,
  });
  const lantaiQ = useResourceList<Lantai>("Lantai", {
    fields: ["name", "gedung"],
    limit_page_length: 0,
  });
  const ruanganQ = useResourceList<Ruangan>("Ruangan", {
    fields: ["name", "gedung"],
    limit_page_length: 0,
  });

  const gedungList = gedungQ.data ?? [];

  const counts = useMemo(() => {
    const lantai = new Map<string, number>();
    const ruangan = new Map<string, number>();
    for (const l of lantaiQ.data ?? []) {
      if (l.gedung) lantai.set(l.gedung, (lantai.get(l.gedung) ?? 0) + 1);
    }
    for (const r of ruanganQ.data ?? []) {
      if (r.gedung) ruangan.set(r.gedung, (ruangan.get(r.gedung) ?? 0) + 1);
    }
    return { lantai, ruangan };
  }, [lantaiQ.data, ruanganQ.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Infrastruktur"
        title="Gedung"
        description="Pilih gedung untuk melihat lantai, ruangan, fasilitas, dan utilitasnya."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Tambah Gedung
          </Button>
        }
      />

      {gedungQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : gedungQ.isError ? (
        <SectionCard title="Gagal memuat">
          <div className="flex items-center gap-2 py-4">
            <Badge tone="danger">Error</Badge>
            <Button variant="outline" onClick={() => gedungQ.refetch()}>Coba lagi</Button>
          </div>
        </SectionCard>
      ) : gedungList.length === 0 ? (
        <EmptyState
          title="Belum ada gedung"
          description="Tambahkan gedung pertama untuk mulai menata lantai dan ruangan."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Gedung
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gedungList.map((g) => (
            <Link
              key={g.name}
              to="/$sekolah/infrastruktur/daftar-gedung/$gedungId"
              params={{ sekolah, gedungId: g.name }}
              className="group rounded-xl border border-border bg-white p-5 transition-colors hover:border-brand hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <IconHome />
                  </span>
                  <div>
                    <div className="font-semibold text-fg group-hover:text-brand">{g.nama ?? g.name}</div>
                    <div className="text-xs text-muted-fg font-mono">{g.kode ?? g.name}</div>
                  </div>
                </div>
                {g.tahun_dibangun ? <Badge tone="neutral">{g.tahun_dibangun}</Badge> : null}
              </div>
              <div className="mt-4 flex gap-4 text-sm text-muted-fg">
                <span><span className="font-semibold text-fg">{counts.lantai.get(g.name) ?? 0}</span> lantai</span>
                <span><span className="font-semibold text-fg">{counts.ruangan.get(g.name) ?? 0}</span> ruangan</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <GedungFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/daftar-gedung/")({ component: GedungListPage });
