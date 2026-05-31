import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  IconCalendar,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { MasterCreateModal } from "../components/master/MasterCreateModal";
import { TAHUN_AJARAN_FIELDS } from "../components/master/schemas";

type Row = {
  name: string;
  nama: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status?: string;
};

const TA_FIELDS = ["name", "nama", "tanggal_mulai", "tanggal_selesai", "status"];
const PAGE_LIMIT = 100;

function fmtDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function TahunAjaranCardListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [open, setOpen] = useState(false);

  const q = useResourceList<Row>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`nama` desc",
    limit_page_length: PAGE_LIMIT,
  });

  const rows = q.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Master Data"
        title="Tahun Ajaran"
        description="Kelola tahun ajaran. Semester dikelola di dalam tiap tahun ajaran."
        actions={<Button onClick={() => setOpen(true)}>Tambah TA</Button>}
      />

      {q.isLoading ? (
        <CardGridSkeleton />
      ) : q.isError ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
          <div className="text-sm text-rose-700">Gagal memuat data.</div>
          <Button variant="outline" onClick={() => void q.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada tahun ajaran"
          description="Tambahkan tahun ajaran pertama untuk mulai mengelola semester."
          action={<Button onClick={() => setOpen(true)}>Tambah TA</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Link
              key={r.name}
              to="/sch/$sekolah/master/tahun-ajaran/$name"
              params={{ sekolah, name: r.name }}
              className="group flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 hover:border-brand hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center text-fg group-hover:text-brand">
                    <span className="h-5 w-5"><IconCalendar /></span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-fg group-hover:text-brand truncate">
                      {r.nama || r.name}
                    </div>
                    <div className="font-mono text-xs text-muted-fg truncate">{r.name}</div>
                  </div>
                </div>
                <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>
                  {r.status ?? "—"}
                </Badge>
              </div>
              <div className="text-xs text-muted-fg">
                {fmtDate(r.tanggal_mulai)} – {fmtDate(r.tanggal_selesai)}
              </div>
            </Link>
          ))}
        </div>
      )}

      <MasterCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Tahun Ajaran"
        title="Tambah Tahun Ajaran"
        fields={TAHUN_AJARAN_FIELDS}
      />
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-pulse" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/master/tahun-ajaran")({
  component: TahunAjaranCardListPage,
});
