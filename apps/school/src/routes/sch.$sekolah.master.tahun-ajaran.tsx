import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SectionCard,
  IconBook,
  IconCalendar,
  IconCheck,
  IconSettings,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { MasterCreateModal } from "../components/master/MasterCreateModal";
import { TAHUN_AJARAN_FIELDS } from "../components/master/schemas";

// ── Relation diagram ────────────────────────────────────────────────────────

type RelChild = {
  icon: React.ReactNode;
  label: string;
  desc: string;
  href?: string;
};

function RelTree({
  root,
  children,
}: {
  root: { icon: React.ReactNode; label: string; desc: string };
  children: RelChild[];
}) {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-lg border-2 border-brand/50 bg-brand/5 px-3 py-2.5">
        <span className="h-5 w-5 shrink-0 text-brand">{root.icon}</span>
        <div>
          <p className="text-sm font-semibold text-fg">{root.label}</p>
          <p className="text-xs text-muted-fg">{root.desc}</p>
        </div>
      </div>
      <div className="ml-5 mt-1.5 border-l-2 border-border pl-4 space-y-2 pb-1 pt-1">
        {children.map((c) => {
          const inner = (
            <>
              <span className="h-4 w-4 shrink-0 text-muted-fg group-hover:text-brand">{c.icon}</span>
              <div>
                <p className="text-xs font-medium text-fg">{c.label}</p>
                <p className="text-[11px] text-muted-fg leading-tight">{c.desc}</p>
              </div>
            </>
          );
          const cls = "flex items-center gap-2.5 rounded-md border border-border bg-bg px-3 py-2 transition";
          return c.href ? (
            <Link
              key={c.label}
              to={c.href as "/sch/$sekolah/master/kkm"}
              params={{ sekolah }}
              className={`${cls} group hover:border-brand hover:bg-muted/40`}
            >
              {inner}
            </Link>
          ) : (
            <div key={c.label} className={`${cls} opacity-75`}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RelationDiagram() {
  return (
    <SectionCard
      title="Struktur Dokumen Akademik"
      description="Relasi antara Tahun Ajaran, Kurikulum, dan konfigurasi penilaian turunannya."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <RelTree
          root={{ icon: <IconCalendar />, label: "Tahun Ajaran", desc: "Anchor periode akademik" }}
          children={[
            {
              icon: <IconCalendar />,
              label: "Semester",
              desc: "Ganjil & Genap — dikelola di dalam kartu TA",
            },
            {
              icon: <IconCheck />,
              label: "KKM",
              desc: "Nilai batas tuntas per mapel & tingkat",
              href: "/sch/$sekolah/master/kkm",
            },
          ]}
        />
        <RelTree
          root={{ icon: <IconBook />, label: "Kurikulum", desc: "Anchor struktur akademik" }}
          children={[
            {
              icon: <IconBook />,
              label: "Komponen Nilai",
              desc: "UH / UTS / UAS / Tugas + bobot per kurikulum",
              href: "/sch/$sekolah/master/komponen-nilai",
            },
            {
              icon: <IconSettings />,
              label: "Konfigurasi Penilaian",
              desc: "Tipe nilai & rentang per kurikulum / mapel",
              href: "/sch/$sekolah/master/konfigurasi",
            },
          ]}
        />
      </div>
    </SectionCard>
  );
}

// ── Card list ────────────────────────────────────────────────────────────────

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

      <RelationDiagram />

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
